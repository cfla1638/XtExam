from django.shortcuts import render
from django.http import HttpResponse, HttpResponseBadRequest, JsonResponse
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from datetime import datetime, timedelta
import XtExam.models as XtExam_models
from django.core import serializers
from django.core.files.storage import default_storage
import uuid
import os

import logging
import validators
import XtExam.views.my_validators as my_validators
import XtExam.models as XtExam_models

logger = logging.getLogger(__name__)

def index(request):
    if request.method == 'POST':
        request_state = request.POST.get('state')
        if request_state is None:
            return HttpResponseBadRequest('非法请求, 缺少参数[state]')
        elif request_state == 'logout':
            if request.user.is_authenticated:
                logout(request)
                return HttpResponse('已登出!')
            else:
                return HttpResponseBadRequest('没有用户登录!')
        elif request_state == 'fetch_user_info':
            if request.user.is_authenticated:
                if bool(request.user.profile.avatar):
                    avatar_url = request.user.profile.avatar.url
                else:
                    avatar_url = None
                return JsonResponse({'name':request.user.profile.name, 'motto':request.user.profile.motto, 'avatar_url':avatar_url})
            else:
                return HttpResponseBadRequest('用户未登录!')
        elif request_state == 'edit_user_info':
            if request.user.is_authenticated:
                avatar = request.FILES.get('form-avatar')
                name = request.POST.get('form-name')
                motto = request.POST.get('form-motto')

                if avatar is not None:
                    logger.info('修改avatar')
                    extension = os.path.splitext(avatar.name)[1]  # 获取文件扩展名
                    new_filename = f'{uuid.uuid4()}{extension}'  # 生成唯一的文件名
                    old_avatar_path = request.user.profile.avatar.path
                    if old_avatar_path and default_storage.exists(old_avatar_path):
                        default_storage.delete(old_avatar_path)
                    request.user.profile.avatar.save(new_filename, avatar, save=True)
                if name is not None:
                    logger.info('修改name')
                    request.user.profile.name = name
                if motto is not None:
                    logger.info('修改motto')
                    request.user.profile.motto = motto
                request.user.profile.save()
                
                if bool(request.user.profile.avatar):
                    avatar_url = request.user.profile.avatar.url
                else:
                    avatar_url = None
                return JsonResponse({'name':request.user.profile.name, 'motto':request.user.profile.motto, 'avatar_url':avatar_url})   
            else:
                return HttpResponseBadRequest('用户未登录!')
        elif request_state == 'fetch_class_info':
            if request.user.is_authenticated:
                user = request.user
                if user.profile.type != 'T':
                    return HttpResponseBadRequest('该用户不是教师')
                classes = XtExam_models.Class.objects.filter(teacher=user.profile)
                data = []
                for i in classes:
                    item = {}
                    item['pk'] = i.pk
                    item['teacher_name'] = user.profile.name
                    item['class_name'] = i.name
                    item['student_cnt'] = i.members.count()
                    data.append(item)
                return JsonResponse(data, safe=False)
            else:
                return HttpResponseBadRequest('用户未登录!')
        elif request_state == 'create_class':
            if request.user.is_authenticated:
                user = request.user
                class_name = request.POST.get('class_name')
                if not my_validators.valid_class_name(class_name):
                    return HttpResponseBadRequest('班级名称不合法!')
                new_class = XtExam_models.Class(name=class_name, teacher=user.profile)
                new_class.save()
                return HttpResponse('创建成功!')
            else:
                return HttpResponseBadRequest('用户未登录!')
        else:
            return HttpResponseBadRequest('非法请求, 参数[state]格式错误')
    else:
        pass
    return render(request, 'teacher.html')