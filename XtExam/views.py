from django.shortcuts import render
from django.http import HttpResponse, HttpResponseBadRequest
from django.forms import ValidationError
from .forms import LoginForm, PsdRecovCaptchaForm, PsdRecovEmailForm, PsdRecovNewPsdForm
from django.contrib.auth import authenticate, login
import logging

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
    return render(request, 'passwordRecovery.html')