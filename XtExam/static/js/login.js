$(document).ready(init)

function init() {
    $(document).ready(function() {
        let current_index = 0;
        let slides = $('.slides img');
        let total_slides = slides.length
    
        slides.eq(current_index).addClass('active');
        setInterval(function() {
            slides.eq(current_index).removeClass('active');
            current_index = (current_index + 1) % total_slides;
            slides.eq(current_index).addClass('active');
        }, 5000);
    });

    $('.login-form').submit(function (event) {
        event.preventDefault();
        $.ajax({
            type: 'POST',
            url: '../login/',
            data: $('.login-form').serialize(),
            error: function(xhr, status, error) {
                alert('发生错误：' + error);
            },
            success: function(response) {
                if ('role' in response) {
                    if (response['role'] == 'T') {
                        alert('欢迎教师登录!')
                        window.location.href = "../teacher/";
                    }
                    else if (response['role'] == 'S') {
                        alert('欢迎学生登录!')
                        window.location.href = "../student/";
                    }
                }
                else {
                    alert('服务器未返回用户角色!')
                }
            }
        })
    })
}