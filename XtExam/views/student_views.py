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
        except XtExam_models.Class.DoesNotExist:
            return HttpResponseBadRequest('班级不存在!')
        user = request.user

        request_state = request.POST.get('state')
        if request_state is None:
            return HttpResponseBadRequest('非法请求, 缺少参数[state]')
        elif request_state == 'fetch_bulletin_text':
            return JsonResponse({'bulletin' : cur_class.bulletin})
        elif request_state == 'fetch_exam_list':
            exams = XtExam_models.Exam.objects.filter(classIn=cur_class)
            data = []
            for i in exams:
                exam_item = {
                    'pk': i.pk,
                    'name': i.name
                }

                part_exist = True
                try:
                    part_state = XtExam_models.Participation.objects.get(exam=i, student=user.profile)
                except XtExam_models.Participation.DoesNotExist:
                    part_exist = False
                if part_exist:
                    exam_item['state'] = 'True'
                else:
                    exam_item['state'] = 'False'
                data.append(exam_item)
            return JsonResponse(data, safe=False)
        elif request_state == 'fetch_exam':
            exam_pk = request.POST.get('exam_pk')
            if exam_pk is None:
                return HttpResponseBadRequest('非法请求, 缺少参数[exam_pk]')
            try:
                cur_exam = XtExam_models.Exam.objects.get(pk=exam_pk)
            except XtExam_models.Exam.DoesNotExist:
                return HttpResponseBadRequest('试卷不存在!')
            data = {}
            data['start_time'] = cur_exam.start_time
            data['duration'] = cur_exam.duration

            paper = cur_exam.paper
            ques_list = []
            for i in paper.questions.all():
                ques_item = {}
                ques_item['pk'] = i.pk
                ques_item['type'] = i.type
                ques_item['category'] = i.category
                ques_item['prompt'] = i.prompt

                ans_exist = True
                try:
                    ans = XtExam_models.Answer.objects.get(student=user.profile, exam=cur_exam, question=i)
                except XtExam_models.Answer.DoesNotExist:
                    ans_exist = False
                if (ans_exist):
                    ques_item['anspk'] = ans.pk
                else:
                    ques_item['anspk'] = ''
                    ques_item['ans'] = ''

                if i.type == 'MC':
                    ques_item['options'] = i.options
                    if (ans_exist):
                        ques_item['ans'] = ans.choice_ans
                elif i.type == 'MR':
                    ques_item['options'] = i.options
                    if (ans_exist):
                        ques_item['ans'] = ans.choice_ans
                elif i.type == 'FB':
                    if (ans_exist):
                        ques_item['ans'] = ans.text_ans
                elif i.type == 'SB':
                    if (ans_exist):
                        ques_item['ans'] = ans.text_ans
                ques_list.append(ques_item)
            data['ques_list'] = ques_list
            return JsonResponse(data, safe=False)
    else:
        pass
    return render(request, 'class_exam.html')


def save_ans(request):
    if request.method == 'POST':
        user = request.user
        if not request.user.is_authenticated:
                return HttpResponseBadRequest('用户未登录!')
        
        json_data = json.loads(request.body.decode('utf-8'))
        stu = user.profile

        try:
            exam = XtExam_models.Exam.objects.get(pk=json_data['exam_pk'])
        except XtExam_models.Exam.DoesNotExist:
            return HttpResponseBadRequest('该场考试不存在!')
        
        try:
            part = XtExam_models.Participation.objects.get(student=stu, exam=exam)
        except XtExam_models.Participation.DoesNotExist:
            part = XtExam_models.Participation()
            part.student = stu
            part.exam = exam
            part.state = True
            part.save()
        
        for i in json_data['ans_list']:
            try:
                ans = XtExam_models.Answer.objects.get(pk=i['ans_pk'])
            except XtExam_models.Answer.DoesNotExist:
                return HttpResponseBadRequest('作答不存在!')
            except ValueError:  # i['ans_pk'] = ''
                # 如果学生没有作答这道题
                try:
                    ques = XtExam_models.Question.objects.get(pk=i['ques_pk'])
                except XtExam_models.Question.DoesNotExist:
                    return HttpResponseBadRequest('题目pk={}，不存在!'.format(i['ques_pk']))
                if len(i['ans_pk']) == 0:
                    ans = XtExam_models.Answer()
                    ans.student = stu
                    ans.exam = exam
                    ans.question = ques
                    ans.achieved_score = 0
                else:   # 非法pk
                    return HttpResponseBadRequest('非法请求, 参数[ans_pk]格式错误')
            if i['type'] == 'MC' or i['type'] == 'MR':
                ans.choice_ans = i['ans']
            else:
                ans.text_ans = i['ans']
            ans.ans_type = i['type']
            ans.save()
        return HttpResponse('保存成功!')
    else:
        return HttpResponseBadRequest('只允许POST请求!')