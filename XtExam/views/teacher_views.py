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
                    extension = os.path.splitext(avatar.name)[1]  # 获取文件扩展名
                    new_filename = f'{uuid.uuid4()}{extension}'  # 生成唯一的文件名
                    if request.user.profile.avatar:
                        old_avatar_path = request.user.profile.avatar.path
                        if old_avatar_path and default_storage.exists(old_avatar_path):
                            default_storage.delete(old_avatar_path)
                    request.user.profile.avatar.save(new_filename, avatar, save=True)
                if name is not None:
                    request.user.profile.name = name
                if motto is not None:
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

def classManage(request, class_pk):
    if request.method == 'POST':
        try:
            cur_class = XtExam_models.Class.objects.get(pk=int(class_pk))
        except XtExam_models.Class.DoesNotExist:
            return HttpResponseBadRequest('班级不存在!')
        user = request.user
        if not request.user.is_authenticated:
                return HttpResponseBadRequest('用户未登录!')
        request_state = request.POST.get('state')
        if request_state is None:
            return HttpResponseBadRequest('非法请求, 缺少参数[state]')
        elif request_state == 'fetch_bulletin_text':
            return JsonResponse({'bulletin' : cur_class.bulletin})
        elif request_state == 'fetch_student_list':
            members = cur_class.members.all()
            data = []
            for i in members:
                item = {}
                item['pk'] = i.pk
                item['name'] = i.name
                data.append(item)
            return JsonResponse(data, safe=False)
        elif request_state == 'remove_student':
            stupk = request.POST.get('stupk')
            if stupk is None:
                return HttpResponseBadRequest('非法请求, 参数[stupk]不存在')
            try:
                member_to_remove = XtExam_models.UserProfile.objects.get(pk=stupk)
            except XtExam_models.UserProfile.DoesNotExist:
                return HttpResponseBadRequest('该学生不存在!')
            try:
                cur_class.members.remove(member_to_remove)
            except ValueError:
                return HttpResponseBadRequest('该学生不是本班级成员')
            return HttpResponse('删除成功!')
        elif request_state == 'add_remove_student':
            stupk = request.POST.get('stupk')
            method = request.POST.get('method')
            if stupk is None:
                return HttpResponseBadRequest('非法请求, 参数[stupk]不存在')
            if method is None:
                return HttpResponseBadRequest('非法请求, 参数[method]不存在')
            elif method == 'add':
                try:
                    member_to_add = XtExam_models.UserProfile.objects.get(pk=stupk)
                except XtExam_models.UserProfile.DoesNotExist:
                    return HttpResponseBadRequest('该学生不存在!')
                cur_class.members.add(member_to_add)
                return HttpResponse('添加成功!')
            elif method == 'remove':
                try:
                    member_to_remove = XtExam_models.UserProfile.objects.get(pk=stupk)
                except XtExam_models.UserProfile.DoesNotExist:
                    return HttpResponseBadRequest('该学生不存在!')
                try:
                    cur_class.members.remove(member_to_remove)
                except ValueError:
                    return HttpResponseBadRequest('该学生不是本班级成员')
                return HttpResponse('删除成功!')
        elif request_state == 'members_query':
            query_key = request.POST.get('query_key')
            if query_key is None:
                return HttpResponseBadRequest('非法请求, 参数[query_key]不存在')
            qs_name = cur_class.members.all().filter(name__contains=query_key, type='S')
            try:
                qs_pk = XtExam_models.UserProfile.objects.filter(pk=query_key, type='S')
                merged_qs = qs_name.union(qs_pk)
            except ValueError:
                merged_qs = qs_name
            data = []
            for i in merged_qs:
                item = {}
                item['name'] = i.name
                item['pk'] = i.pk
                if i in cur_class.members.all():
                    item['is_in_class'] = 'true'
                else:
                    item['is_in_class'] = 'false'
                data.append(item)
            return JsonResponse(data, safe=False)
        elif request_state == 'fetch_exam_list':
            exams = XtExam_models.Exam.objects.filter(classIn=cur_class)
            data = []
            for i in exams:
                item = {}
                item['pk'] = i.pk
                item['name'] = i.name
                data.append(item)
            return JsonResponse(data, safe=False)
        elif request_state == 'fetch_papers':
            papers = XtExam_models.ExamPaper.objects.filter(owner=user.profile)
            data = []
            for i in papers:
                item = {}
                item['pk'] = i.pk
                item['title'] = i.title
                data.append(item)
            return JsonResponse(data, safe=False)
        elif request_state == 'publish_exam':
            paper = XtExam_models.ExamPaper.objects.get(pk=request.POST.get('paper_pk'))
            title = request.POST.get('exam_title')
            start_time = request.POST.get('start_time')
            duration = request.POST.get('duration')

            if not my_validators.valid_exam_title(title):
                return HttpResponseBadRequest('非法请求, 参数[exam_title]格式错误')
            
            start_time = datetime.strptime(start_time, "%Y-%m-%dT%H:%M")
            duration = datetime.strptime(duration, "%H:%M").time()
            duration = timedelta(hours=duration.hour, minutes=duration.minute)
            
            new_exam = XtExam_models.Exam()
            new_exam.name = title
            new_exam.paper = paper
            new_exam.owner = user.profile
            new_exam.classIn = cur_class
            new_exam.start_time = start_time
            new_exam.duration = duration
            new_exam.save()
            return HttpResponse('发布成功！')
        elif request_state == 'edit-bulletin':
            content = request.POST.get('content')
            if not my_validators.valid_bulletin_content(content):
                return HttpResponseBadRequest('非法请求, 参数[bulletin-content]格式错误')
            cur_class.bulletin = content
            cur_class.save()
            return HttpResponse('修改成功!')
        else:
            return HttpResponseBadRequest('非法请求, 参数[state]格式错误')
    else:
        pass
    return render(request, 'classManage.html')

def paperManage(request):
    if request.method == 'POST':
        user = request.user
        if not request.user.is_authenticated:
                return HttpResponseBadRequest('用户未登录!')
        request_state = request.POST.get('state')
        if request_state is None:
            return HttpResponseBadRequest('非法请求, 缺少参数[state]')
        elif request_state == 'fetch_bulletin_text':
            pass
        elif request_state == 'fetch_student_list':
            pass
        elif request_state == 'remove_student':
            pass
        elif request_state == 'add_remove_student':
            pass
        elif request_state == 'members_query':
            pass
        elif request_state == 'fetch_exam_list':
            pass
        elif request_state == 'fetch_papers':
            pass
        elif request_state == 'publish_exam':
            pass
        elif request_state == 'edit-bulletin':
            pass
        else:
            return HttpResponseBadRequest('非法请求, 参数[state]格式错误')
    else:
        pass
    return render(request, 'paperManage.html')