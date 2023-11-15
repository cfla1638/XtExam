from django.contrib import admin
from django.contrib.auth.models import User
from .models import UserProfile, Class, ExamPaper, Question, ExamSchema, Participation, Exam, Answer

# 管理员
# 用户名:     admin
# 密码:       nihaonihao
# 电子邮件:   admin@example.com

# Register your models here.
admin.site.register(UserProfile)
admin.site.register(Class)
admin.site.register(Question)
admin.site.register(ExamPaper)
admin.site.register(ExamSchema)
admin.site.register(Exam)
admin.site.register(Participation)
admin.site.register(Answer)
