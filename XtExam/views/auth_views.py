from django.shortcuts import render
from django.http import HttpResponse, HttpResponseBadRequest
from django.forms import ValidationError
from ..forms import LoginForm
from django.contrib.auth import authenticate, login
from django.core.mail import send_mail
from django.contrib.auth.models import User
import logging
import validators
from datetime import datetime, timedelta
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
        elif request_state == 'submit_email_send_captcha':
            pass
        elif request_state == 'resend_captcha':
            pass
        elif request_state == 'verify_captcha':
            pass
        elif request_state == 'set_new_password':
            pass
        else:
            return HttpResponseBadRequest('非法请求, 参数[state]格式错误')
    else:
        pass
    return render(request, 'register.html')