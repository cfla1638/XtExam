from django.shortcuts import render
from django.http import HttpResponse, HttpResponseBadRequest
from django.forms import ValidationError
from ..forms import LoginForm
from django.contrib.auth import authenticate, login
from django.core.mail import send_mail
from django.contrib.auth.models import User
from datetime import datetime, timedelta
import XtExam.models as XtExam_models

import logging
import validators
import XtExam.views.my_validators as my_validators
import random

logger = logging.getLogger(__name__)

def index(request):
    return HttpResponse("Hello, world. You're at the XtExam index.")

def login(request):
    # 用户点击登录按钮
    if request.method == 'POST':
        form = LoginForm(request.POST)
        if form.is_valid():
            email = form.cleaned_data['email']
            password = form.cleaned_data['password']
            logger.info(email)
            logger.info(password)
            user = authenticate(request, email=email, password=password)
            logger.info(user)
            if user is not None:
                # login(request, user)
                return HttpResponse('登陆成功')
            else:
                return HttpResponse('登陆失败[密码错误]')
        else:
            return HttpResponse('用户不存在![表单验证失败]')
    else:   # 第一次请求页面
        form = LoginForm()
    return render(request, 'login.html')

def passwordRecovery(request):
    if request.method == 'POST':
        request_state = request.POST.get('state')
        if request_state is None:
            return HttpResponseBadRequest('非法请求, 缺少参数[state]')
        elif request_state == 'submit_email_send_captcha':
            email_addr = request.POST.get('email')
            if validators.email(email_addr):
                if not User.objects.filter(email=email_addr).exists():
                    return HttpResponseBadRequest('该邮箱尚未注册!')
                captcha = str(random.randint(100000, 999999))
                request.session['captcha'] = captcha
                request.session['last_sent'] = datetime.now().timestamp()
                request.session['email'] = email_addr
                logger.info(captcha)
                # send_mail(
                #     subject='Captcha - XtExam',
                #     message=captcha,
                #     from_email='xtexam@126.com',
                #     recipient_list=[email_addr],
                #     fail_silently=False
                # )
                return HttpResponse('邮件发送成功!')
            else:
                return HttpResponseBadRequest('邮箱格式错误!')
        elif request_state == 'resend_captcha':
            pass
        elif request_state == 'verify_captcha':
            tobeverified = request.POST.get('captcha')
            captcha = request.session.get('captcha')
            if captcha is None:
                return HttpResponseBadRequest('非法请求, 没有验证码被发送!')
            elif captcha == tobeverified:
                request.session['verified_time'] = datetime.now().timestamp()
                return HttpResponse('验证通过!\n有效期5分钟')
            else:
                return HttpResponseBadRequest('验证码不匹配!')
        elif request_state == 'set_new_password':
            verified_time = datetime.fromtimestamp(request.session.get('verified_time'))
            if datetime.now() > (verified_time + timedelta(minutes=5)):
                return HttpResponseBadRequest('验证码有效期已过!')
            email_addr = request.session.get('email')
            if email_addr is None:
                return HttpResponseBadRequest('非法请求, 参数[email]不存在!')
            newpsd = request.POST.get('newpsd')
            if len(newpsd) >= 8 and len(newpsd) <= 16:
                user_tobemodified = User.objects.get(email=email_addr)
                user_tobemodified.set_password(newpsd)
                user_tobemodified.save()
                return HttpResponse('修改成功!')
            else:
                return HttpResponseBadRequest('密码长度需要6-16个字符!')
        else:
            return HttpResponseBadRequest('非法请求, 参数[state]格式错误')
    else:
        pass
    return render(request, 'passwordRecovery.html')

def register(request):
    if request.method == 'POST':
        request_state = request.POST.get('state')
        if request_state is None:
            return HttpResponseBadRequest('非法请求, 缺少参数[state]')
        elif request_state == 'submit_register_info':
            email_addr = request.POST.get('email')
            if not validators.email(email_addr):
                return HttpResponseBadRequest('邮箱格式不合法!')
            if User.objects.filter(email=email_addr).exists():
                return HttpResponseBadRequest('该邮箱已注册!')
            user_name = request.POST.get('user_name')
            if not my_validators.valid_name(user_name):
                return HttpResponseBadRequest('姓名字段未通过验证!')
            role = request.POST.get('role')
            if not my_validators.valid_role(role):
                return HttpResponseBadRequest('角色字段未通过验证!')
            request.session['email'] = email_addr
            request.session['user_name'] = user_name
            request.session['role'] = role
            
            # 生成验证码, 发送邮箱
            captcha = str(random.randint(100000, 999999))
            request.session['captcha'] = captcha
            request.session['last_sent'] = datetime.now().timestamp()
            logger.info(captcha)
            # send_mail(
            #     subject='Captcha - XtExam',
            #     message=captcha,
            #     from_email='xtexam@126.com',
            #     recipient_list=[email_addr],
            #     fail_silently=False
            # )
            return HttpResponse('邮件发送成功!')
        elif request_state == 'resend_captcha':
            pass
        elif request_state == 'verify_captcha':
            tobeverified = request.POST.get('captcha')
            captcha = request.session.get('captcha')
            if captcha is None:
                return HttpResponseBadRequest('非法请求, 没有验证码被发送!')
            elif captcha == tobeverified:
                request.session['verified_time'] = datetime.now().timestamp()
                return HttpResponse('验证通过!\n有效期5分钟')
            else:
                return HttpResponseBadRequest('验证码不匹配!')
        elif request_state == 'set_new_password':
            verified_time = datetime.fromtimestamp(request.session.get('verified_time'))
            if datetime.now() > (verified_time + timedelta(minutes=5)):
                return HttpResponseBadRequest('验证码有效期已过!')
            
            newpsd = request.POST.get('newpsd')
            if not(len(newpsd) >= 8 and len(newpsd) <= 16):
                return HttpResponseBadRequest('密码长度需要6-16个字符!')
            
            email_addr = request.session.get('email')
            user_name = request.session.get('user_name')
            role = request.session.get('role')
            if (email_addr is None) or (user_name is None) or (role is None):
                return HttpResponseBadRequest('非法请求, 参数缺失!')
            
            logger.info(email_addr)
            logger.info(user_name)
            logger.info(role)

            new_user = User(username='tmp_username', email=email_addr)
            new_user.save()
            new_user.username = 'user_' + str(new_user.pk)
            new_user.set_password(newpsd)
            new_user.save()
            user_profile = XtExam_models.UserProfile(user=new_user, name=user_name, type=role[0])
            user_profile.save()
            return HttpResponse('注册成功!')
        else:
            return HttpResponseBadRequest('非法请求, 参数[state]格式错误')
    else:
        pass
    return render(request, 'register.html')