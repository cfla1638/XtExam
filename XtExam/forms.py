from django import forms
from django.contrib.auth.models import User
import logging 
logger = logging.getLogger(__name__)

class LoginForm(forms.Form):
    email = forms.EmailField(label='邮箱')
    password = forms.CharField(label='密码', widget=forms.PasswordInput)

    def clean_email(self):
        email = self.cleaned_data['email']

        if not User.objects.filter(email=email).exists():
            raise forms.ValidationError("该用户不存在!")
        
        return email
    
class PsdRecovEmailForm(forms.Form):
    email = forms.EmailField(label='邮箱')

    def clean_email(self):
        email = self.cleaned_data['email']

        if not User.objects.filter(email=email).exists():
            raise forms.ValidationError("该用户不存在!")
        
        return email
    
class PsdRecovCaptchaForm(forms.Form):
    captcha = forms.CharField(max_length=6, min_length=6)

class PsdRecovNewPsdForm(forms.Form):
    newPsd = forms.CharField(max_length=16, min_length=6)
