from django.shortcuts import render, redirect
from django.http import HttpResponse, HttpResponseBadRequest, JsonResponse
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from datetime import datetime, timedelta
import XtExam.models as XtExam_models
from django.core import serializers
from django.core.files.storage import default_storage
import uuid
import os
import json

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
        elif request_state == 'search':
            class_id = request.POST.get('classId')
            if class_id is None:
                return HttpResponseBadRequest('非法请求, 缺少参数[classId]')
            try:
                target_class = XtExam_models.Class.objects.get(pk=class_id)   
            except XtExam_models.Class.DoesNotExist:
                return HttpResponseBadRequest('查找班级失败')

            user = request.user
            if user.is_authenticated:
                if user.profile.type == 'S':
                    if target_class.members.filter(user=user.profile.user).exists():
                        return HttpResponseBadRequest('学生已经加入该班级')
                    target_class.members.add(user.profile)
                    return JsonResponse({'success': True})
                else:
                    return HttpResponseBadRequest('该用户不是学生')
            else:
                return HttpResponseBadRequest('用户未登录')
        elif request_state == 'logout':
            if request.user.is_authenticated:
                logout(request)
                return HttpResponse('已登出!')
            else:
                return HttpResponseBadRequest('没有用户登录!')
        elif request_state == 'fetch_user_info':
            if request.user.is_authenticated:
                user = request.user
                if bool(user.profile.avatar):
                    avatar_url = user.profile.avatar.url
                else:
                    avatar_url = None
                return JsonResponse({'name': user.profile.name, 'motto': user.profile.motto, 'avatar_url': avatar_url})
            else:
                return HttpResponseBadRequest('用户未登录!')
        elif request_state == 'edit_user_info':
            if request.user.is_authenticated:
                user = request.user
                avatar = request.FILES.get('form-avatar')
                name = request.POST.get('form-name')
                motto = request.POST.get('form-motto')

                if avatar is not None:
                    extension = os.path.splitext(avatar.name)[1]
                    new_filename = f'{uuid.uuid4()}{extension}'
                    if user.profile.avatar:
                        old_avatar_path = user.profile.avatar.path
                        if old_avatar_path and default_storage.exists(old_avatar_path):
                            default_storage.delete(old_avatar_path)
                    user.profile.avatar.save(new_filename, avatar, save=True)
                if name is not None:
                    user.profile.name = name
                if motto is not None:
                    user.profile.motto = motto
                user.profile.save()

                if bool(user.profile.avatar):
                    avatar_url = user.profile.avatar.url
                else:
                    avatar_url = None
                return JsonResponse({'name': user.profile.name, 'motto': user.profile.motto, 'avatar_url': avatar_url})
            else:
                return HttpResponseBadRequest('用户未登录!')
        elif request_state == 'fetch_class_info':
            if request.user.is_authenticated:
                user = request.user
                if user.profile.type != 'S':
                    return HttpResponseBadRequest('该用户不是学生')
                classes = user.profile.class_set.all()
                data = []
                for i in classes:
                    item = {
                        'pk': i.pk,
                        'teacher_name': user.profile.name,
                        'class_name': i.name,
                        'student_cnt': i.members.count()
                    }
                    data.append(item)
                return JsonResponse(data, safe=False)
            else:
                return HttpResponseBadRequest('用户未登录!')
        else:
            return HttpResponseBadRequest('非法请求, 参数[state]格式错误')
    else:
        pass
    return render(request, 'student.html')


def class_exam(request, class_pk):
    if request.method == 'POST':
        if not request.user.is_authenticated:
                return HttpResponseBadRequest('用户未登录!')
        try:
            cur_class = XtExam_models.Class.objects.get(pk=int(class_pk))
            cur_student = XtExam_models.UserProfile.objects.get(user=request.user)
        except XtExam_models.Class.DoesNotExist:
            return HttpResponseBadRequest('班级不存在!')
        user = request.user
        request_state = request.POST.get('state')
        if request_state is None:
            return HttpResponseBadRequest('非法请求, 缺少参数[state]')
        elif request_state == 'fetch_bulletin_text':
            return JsonResponse({'bulletin' : cur_class.bulletin})
        elif request_state == 'fetch_exam_content':
            exam_id = request.POST.get('exam_id')
            if exam_id is None:
                return HttpResponseBadRequest('非法请求, 缺少参数[exam_id]')
            try:
                exam = XtExam_models.Exam.objects.get(pk=int(exam_id), classIn=cur_class)
            except XtExam_models.Exam.DoesNotExist:
                return HttpResponseBadRequest('考试不存在!')
            
            # 在这里根据需要进行相应的处理，例如获取试卷信息等
            exam_content = "这是试卷的内容"
            
            # 返回 JSON 响应
            return JsonResponse({'exam_content': exam_content})
        
        elif request_state == 'fetch_exam_list':
            exams = XtExam_models.Exam.objects.filter(classIn=cur_class)
            data = {
                'exams': [],
                'participations': []
            }
            
            for exam in exams:
                exam_item = {
                    'pk': exam.pk,
                    'name': exam.name
                    # 其他属性...
                }
                data['exams'].append(exam_item)
                
                # 获取学生参与情况
                participations = XtExam_models.Participation.objects.filter(exam=exam, student=cur_student)
                for participation in participations:
                    participation_item = {
                        'exam': participation.exam.pk,
                        'state': participation.state
                    }
                    data['participations'].append(participation_item)
            
            return JsonResponse(data, safe=False)
    else:
        pass
    return render(request, 'class_exam.html')


# def class_exam_view(request, class_id):
#     # 根据 class_id 查询班级公告信息
#     class_obj = XtExam_models.Class.objects.get(pk=class_id)
#     bulletin = class_obj.bulletin

#     # 将班级公告信息传递给模板引擎
#     context = {'bulletin': bulletin}
#     return render(request, 'class_exam.html', context)
