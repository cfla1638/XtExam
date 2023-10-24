from django.db import models

class User(models.Model):
    ROLE_CHOICES = (
        ('S', 'Student'),
        ('T', 'Teacher')
    )

    user_name = models.CharField(max_length=50)
    user_type = models.CharField(max_length=10, choices=ROLE_CHOICES)
    motto = models.CharField(max_length=100, blank=True)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    psd = models.CharField(max_length=128)
    email = models.EmailField(max_length=50)

    def __str__(self) -> str:
        return self.user_name

class Class(models.Model):
    class_name = models.CharField(max_length=50)    # 班级名称
    user_id = models.ForeignKey(User, on_delete=models.CASCADE)     # 班级所属的教师
    bulletin = models.CharField(max_length=250)     # 班级公告