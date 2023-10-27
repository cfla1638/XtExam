from django.db import models

class User(models.Model):
    ROLE_CHOICES = (
        ('S', 'Student'),
        ('T', 'Teacher')
    )

    name = models.CharField(max_length=50)
    type = models.CharField(max_length=10, choices=ROLE_CHOICES)
    motto = models.CharField(max_length=100, null=True, blank=True)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    psd = models.CharField(max_length=128)
    email = models.EmailField(max_length=50)

    def __str__(self) -> str:
        return self.name

class Class(models.Model):
    name = models.CharField(max_length=50)    # 班级名称
    teacher = models.ForeignKey(User, related_name='teacher', on_delete=models.CASCADE)     # 班级所属的教师
    bulletin = models.CharField(max_length=250, null=True, blank=True)     # 班级公告
    members = models.ManyToManyField(User)

    def __str__(self) -> str:
        return self.name

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

class ExamPaper(models.Model):
    title = models.CharField(max_length=100)
    tips = models.CharField(max_length=500, null=True, blank=True)
    owner = models.ForeignKey(User, on_delete=models.CASCADE)
    questions = models.ManyToManyField(Question, through="ExamSchema")

    def __str__(self) -> str:
        return self.title

class ExamSchema(models.Model):
    exam = models.ForeignKey(ExamPaper, on_delete=models.CASCADE)
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    seq_number = models.IntegerField()

class Exam(models.Model):
    paper = models.ForeignKey(ExamPaper, on_delete=models.CASCADE)
    owner = models.ForeignKey(User, related_name='owner', on_delete=models.CASCADE)
    classIn = models.ForeignKey(Class, on_delete=models.CASCADE)
    students = models.ManyToManyField(User, through="Participation")

    name = models.CharField(max_length=100)
    start_time = models.DateTimeField()
    duration = models.DurationField()

    def __str__(self) -> str:
        return self.name

class Answer(models.Model):
    ANS_TYPE_CHOICES = (
        ('MC', 'MultiCho'),     # 单选题 Multiple Choice
        ('MR', 'MultiRes'),     # 多选题 Multiple Response
        ('FB', 'Blank'),        # 填空题 Fill in blanks
        ('SB', 'Subjective')    # 主观题 Subjective
    )

    student = models.ForeignKey(User, on_delete=models.CASCADE)
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE)
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    
    achieved_score = models.IntegerField()
    ans_type = models.CharField(max_length=20, choices=ANS_TYPE_CHOICES)
    choice_ans = models.CharField(max_length=50, null=True, blank=True)
    text_ans = models.CharField(max_length=2048, null=True, blank=True)

class Participation(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE)
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE)
    state = models.BooleanField()
