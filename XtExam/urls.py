from django.urls import path

from . import views

app_name = "XtExam"
urlpatterns = [
    path("", views.index, name="index"),
]