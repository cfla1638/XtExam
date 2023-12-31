from django.urls import path

import XtExam.views.auth_views as auth_views
import XtExam.views.teacher_views as teacher_views
import XtExam.views.student_views as student_views


app_name = "XtExam"
urlpatterns = [
    path("", auth_views.index, name="index"),
    path("login/", auth_views.login, name="login"),
    path("passwordRecovery/", auth_views.passwordRecovery, name='passwordRecovery'),
    path("register/", auth_views.register, name='register'),
    path("teacher/", teacher_views.index, name="teacher_index"),
    path("classManage/<int:class_pk>/", teacher_views.classManage, name='class_manage'),
    path("paperManage/", teacher_views.paperManage, name='paper_manage'),
    path("student/", student_views.index, name="student_index"),
    path("save_paper/", teacher_views.save_paper, name='save_paper'),
    path("exam/<int:exam_pk>/", teacher_views.exam, name='exam'),
    path("save_ans/", teacher_views.save_ans, name='save_ans'),
    path("class_exam/<int:class_pk>/", student_views.class_exam, name='class_exam'),
    path("stu_save_ans/", student_views.save_ans, name='stu_save_ans'),
]
