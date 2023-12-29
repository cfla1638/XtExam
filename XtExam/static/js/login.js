$(document).ready(init)

$.fn.moveAndFadeOut = function (duration, callback) {
    var $element = this;

    $element.css({
        position: 'relative',
        top: 0
    });

    function animateElement() {
        $element.animate({
            top: '+=50',
            opacity: 0
        }, duration, function () {
            $element.hide();
            if (typeof callback === 'function') {
                callback();
            }
        });
    }

    animateElement();
};

function notify(message) {
    var notificationContainer = $('#notification-container');

    var notificationBar = $('<div class="notification-bar"></div>');
    notificationBar.text(message);
    notificationContainer.append(notificationBar);

    setTimeout(function () {
        notificationBar.moveAndFadeOut(1000, function () {
            $(this).remove();
        });
    }, 3000);
}

function init() {
    $(document).ready(function () {
        let current_index = 0;
        let slides = $('.slides img');
        let total_slides = slides.length

        slides.eq(current_index).addClass('active');
        setInterval(function () {
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
            error: function (xhr, status, error) {
                var errorMessage = "请求失败：" + xhr.responseText;
                notify(errorMessage);
            },
            success: function (response) {
                if ('role' in response) {
                    if (response['role'] == 'T') {
                        notify('欢迎教师登录!')
                        window.location.href = "../teacher/";
                    }
                    else if (response['role'] == 'S') {
                        notify('欢迎学生登录!')
                        window.location.href = "../student/";
                    }
                }
                else {
                    notify('服务器未返回用户角色!')
                }
            }
        })
    })
}