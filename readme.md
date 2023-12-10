# XtExam - 学拓考试系统

## 使用方法：

1. 配置邮箱，在`\mainsite\settings.py`中配置以下选项:

   ~~~py
   # 配置邮箱
   EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
   EMAIL_USE_TLS = True  # 是否使用TLS安全传输协议(用于在两个通信应用程序之间提供保密性和数据完整性。)
   EMAIL_USE_SSL = False  # 是否使用SSL加密，qq企业邮箱要求使用
   EMAIL_HOST = 'smtp.126.com'  # 发送邮件的邮箱 的 SMTP服务器，这里用了163邮箱
   EMAIL_PORT = 25  # 发件箱的SMTP服务器端口
   EMAIL_HOST_USER = ''  # 发送邮件的邮箱地址
   EMAIL_HOST_PASSWORD = ''  # 发送邮件的邮箱密码(这里使用的是授权码)
   ~~~

2. 创建数据库迁移文件

   ~~~sh
   py mamage.py makemigrations
   ~~~

3. 应用数据库迁移文件，将数据库模式的更改实际应用到数据库中

   ~~~
   py mamage.py migrate
   ~~~

4. 运行服务器

   ~~~sh
   py manage.py runserver
   ~~~

   