$(document).ready(init);

let submited_email;

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
    $('.register-info-form').submit(function (event) {
        event.preventDefault();
        submited_email = $('#email').val();
        $.ajax({
            type: 'POST',
            url: '../register/',
            data: {
                csrfmiddlewaretoken: $('input[name=csrfmiddlewaretoken]').val(),
                email: submited_email,
                user_name: $('#name').val(),
                role: $('#role').val(),
                state: 'submit_register_info'
            },
            success: function (response) {
                $('.status1').removeClass('show');
                $('.status1').addClass('disabled');
                $('.status2').addClass('show');
                $('.status2').removeClass('disabled');
                notify(response);
            },
            error: function (xhr, status, error) {
                var errorMessage = "请求失败：" + error + "\n" + xhr.responseText;
                notify(errorMessage);
            }
        });
    })

    $('.captcha-form').submit(function (event) {
        event.preventDefault();
        $.ajax({
            type: 'POST',
            url: '../register/',
            data: {
                csrfmiddlewaretoken: $('input[name=csrfmiddlewaretoken]').val(),
                state: 'verify_captcha',
                captcha: $('#captcha').val()
            },
            success: function (response) {
                $('.status2').removeClass('show');
                $('.status2').addClass('disabled');
                $('.status3').addClass('show');
                $('.status3').removeClass('disabled');
                notify(response);
            },
            error: function (xhr, status, error) {
                var errorMessage = "请求失败：" + error + "\n" + xhr.responseText;
                notify(errorMessage);
            }
        });
    })

    $('.setpsd-form').submit(function (event) {
        event.preventDefault();
        let password = $('#newpsd').val();
        let repeatpsd = $('#repeatpsd').val();
        if (password != repeatpsd) {
            notify('密码前后不一致, 请重新输入!');
            return;
        }
        $.ajax({
            type: 'POST',
            url: '../register/',
            data: {
                csrfmiddlewaretoken: $('input[name=csrfmiddlewaretoken]').val(),
                state: 'set_new_password',
                newpsd: $('#newpsd').val()
            },
            success: function (response) {
                $('.status3').removeClass('show');
                $('.status3').addClass('disabled');
                $('.status4').addClass('show');
                $('.status4').removeClass('disabled');
                notify(response);
            },
            error: function (xhr, status, error) {
                var errorMessage = "请求失败：" + error + "\n" + xhr.responseText;
                notify(errorMessage);
            }
        });
    })

    $('.gotologin-submit').click(function (event) {
        event.preventDefault();
        window.location.href = "../login/";
    });
}