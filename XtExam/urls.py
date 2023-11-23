from django.urls import path

import XtExam.views.auth_views as auth_views
import XtExam.views.teacher_views as teacher_views

app_name = "XtExam"
urlpatterns = [
    # path("", views.index, name="index"),
    path("login/", auth_views.login, name="login"),
    path("passwordRecovery/", auth_views.passwordRecovery, name='passwordRecovery'),
    path("register/", auth_views.register, name='register'),
    path("teacher/", teacher_views.index, name="teacher_index")
]
