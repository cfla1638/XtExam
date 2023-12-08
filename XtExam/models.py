from django.db import models
from django.contrib.auth.models import User

class UserProfile(models.Model):
    ROLE_CHOICES = (
        ('S', 'Student'),
        ('T', 'Teacher')
    )
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')

    name = models.CharField(max_length=50)
    type = models.CharField(max_length=10, choices=ROLE_CHOICES)
    motto = models.CharField(max_length=100, null=True, blank=True)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    
    class Meta:
        verbose_name = 'User Profile'

    def __str__(self) -> str:
        return self.name

class Class(models.Model):
    name = models.CharField(max_length=50)    # 班级名称
    teacher = models.ForeignKey(UserProfile, related_name='teacher', on_delete=models.CASCADE)     # 班级所属的教师
    bulletin = models.CharField(max_length=250, null=True, blank=True)     # 班级公告
    members = models.ManyToManyField(UserProfile)  # 班级成员


    def __str__(self) -> str:
        return self.name

# 题目
class Question(models.Model):
    QUES_TYPE_CHOICES = (
        ('MC', 'MultiCho'),     # 单选题 Multiple Choice
        ('MR', 'MultiRes'),     # 多选题 Multiple Response
        ('FB', 'Blank'),        # 填空题 Fill in blanks
        ('SB', 'Subjective')    # 主观题 Subjective
    )

    type = models.CharField(max_length=20, choices=QUES_TYPE_CHOICES)  # 题目类型
    category = models.CharField(max_length=100, null=True, blank=True)    # 知识点类型
    prompt = models.CharField(max_length=500)      # 题干
    options = models.CharField(max_length=500)     # 选项
    standard_answer = models.CharField(max_length=50, null=True, blank=True)   # 标准答案

# 试卷
class ExamPaper(models.Model):
    title = models.CharField(max_length=100)    # 试卷名称
    tips = models.CharField(max_length=500, null=True, blank=True)  # 提示
    owner = models.ForeignKey(UserProfile, on_delete=models.CASCADE)       # 创建该试卷的教师
    questions = models.ManyToManyField(Question, through="ExamSchema")  # 被包含在该试卷中的题目

    def __str__(self) -> str:
        return self.title

# 试卷与题目的联系类，其记录着题目在试卷中的顺序
class ExamSchema(models.Model):
    exam = models.ForeignKey(ExamPaper, on_delete=models.CASCADE)
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    seq_number = models.IntegerField()  # 题号

# 考试
class Exam(models.Model):
    paper = models.ForeignKey(ExamPaper, on_delete=models.CASCADE)  # 本次考试使用哪张试卷
    owner = models.ForeignKey(UserProfile, related_name='owner', on_delete=models.CASCADE) # 哪个老师创建了该考试
    classIn = models.ForeignKey(Class, on_delete=models.CASCADE)    # 本次考试被发布在哪一个班级中
    students = models.ManyToManyField(UserProfile, through="Participation")    # 参与这场考试的学生

    name = models.CharField(max_length=100)     # 考试名称
    start_time = models.DateTimeField()     # 考试开始时间
    duration = models.DurationField()       # 考试持续时间

    def __str__(self) -> str:
        return self.name

# 学生对于某道题的作答
class Answer(models.Model):
    ANS_TYPE_CHOICES = (
        ('MC', 'MultiCho'),     # 单选题 Multiple Choice
        ('MR', 'MultiRes'),     # 多选题 Multiple Response
        ('FB', 'Blank'),        # 填空题 Fill in blanks
        ('SB', 'Subjective')    # 主观题 Subjective
    )

    student = models.ForeignKey(UserProfile, on_delete=models.CASCADE)
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE)
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    
    achieved_score = models.IntegerField()  # 该题的实际得分
    ans_type = models.CharField(max_length=20, choices=ANS_TYPE_CHOICES)    # 该题的类型
    choice_ans = models.CharField(max_length=50, null=True, blank=True)     # 选择题的答案
    text_ans = models.CharField(max_length=2048, null=True, blank=True)     # 填空题/主观题的答案

# 学生是否参加某次考试
class Participation(models.Model):
    student = models.ForeignKey(UserProfile, on_delete=models.CASCADE)
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE)
    state = models.BooleanField()   # 是否参加, True/False
