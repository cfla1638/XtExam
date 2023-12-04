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
        pass
    else:
        pass
    return render(request, 'student.html')