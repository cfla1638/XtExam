$(document).ready(init);

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

const class_item = '<div class=\"class-item\" data-pk=\"\"><img src=\'/static/img/class_cover.jpg\' class=\'cover\'><div class=\'class_details\'><div class=\'class_name\'>很长的课程名称</div><div class=\'teacher_name\'>教师名称</div><div class=\'student_count\'>00人</div></div></div>';

function update_class_list() {
    $('.class_list-box').empty();
    $.ajax({
        type: 'POST',
        url: '../teacher/',
        data: {
            csrfmiddlewaretoken: $('input[name=csrfmiddlewaretoken]').val(),
            state: 'fetch_class_info'
        },
        success: function (response) {
            response.forEach(i => {
                $('.class_list-box').append(class_item);
                let new_item = $('.class_list-box > div:last');
                new_item.attr('data-pk', i['pk']);
                new_item.find('.class_name').text(i['class_name']);
                new_item.find('.teacher_name').text(i['teacher_name']);
                new_item.find('.student_count').text(i['student_cnt'] + '人');
                $('.class-item').click(function() {
                    target_link = '../classManage/' + $(this).attr('data-pk') + '/';
                    window.location.href = target_link;
                });
            })
        },
        error: function (xhr, status, error) {
            var errorMessage = "请求失败：" + error + "\n" + xhr.responseText;
            notify(errorMessage);
        }
    });
}

function init() {
    $('.exampaper_manage-btn').click(function() {
        window.location.href = '../paperManage/';
    });

    // 取得用户信息
    $.ajax({
        type: 'POST',
        url: '../teacher/',
        data: {
            csrfmiddlewaretoken: $('input[name=csrfmiddlewaretoken]').val(),
            state: 'fetch_user_info'
        },
        success: function (response) {
            let avatar_url = response.avatar_url;
            let teacher_name = response.name;
            let teacher_motto = response.motto;
            if (avatar_url) {
                $('.sidebar img').attr('src', avatar_url);
                $('.upper-box img').attr('src', avatar_url);
            }
            if (teacher_name) {
                $('#name').text(teacher_name);
            }
            if (teacher_motto) {
                $('#motto').text(teacher_motto);
            }
        },
        error: function (xhr, status, error) {
            var errorMessage = "请求失败：" + error + xhr.responseText;
            notify(errorMessage);
            notify('即将返回登陆界面');
            setTimeout(function() { window.location.href = '../login/' } , 3000)
        }
    });

    // 绑定其他事件
    $('#form-avatar').change(function () {
        var fileName = $(this).val().split('\\').pop();
        $('#form-avatar-label').text(fileName);
    });

    $('.exampaper_manage-btn').click(function () {
        window.location.href = "#";
    });

    $('.exit-btn').click(function () {
        $.ajax({
            type: 'POST',
            url: '../teacher/',
            data: {
                csrfmiddlewaretoken: $('input[name=csrfmiddlewaretoken]').val(),
                state: 'logout'
            },
            success: function (response) {
                notify(response);
                window.location.href = "../login/";
            },
            error: function (xhr, status, error) {
                var errorMessage = "请求失败：" + error + "\n" + xhr.responseText;
                notify(errorMessage);
                window.location.href = "../login/";
            }
        });
    });

    $('.sidebar img').click(function() {
        if ($('.class_manage-box').hasClass('show')) {
            $('.class_manage-box').removeClass('show');
            $('.class_manage-box').addClass('disabled');
            $('.profile-box').addClass('show');
            $('.profile-box').removeClass('disabled');
        }
    })

    $('#edit-profile-btn').click(function () {
        $('.status1').removeClass('show');
        $('.status1').addClass('disabled');
        $('.status2').addClass('show');
        $('.status2').removeClass('disabled');
        $('#form-avatar').val(null);
        $('#form-avatar-label').text('浏览');
        $.ajax({
            type: 'POST',
            url: '../teacher/',
            data: {
                csrfmiddlewaretoken: $('input[name=csrfmiddlewaretoken]').val(),
                state: 'fetch_user_info'
            },
            success: function (response) {
                let teacher_name = response.name;
                let teacher_motto = response.motto;
                if (teacher_name) {
                    $('#form-name').val(teacher_name);
                }
                if (teacher_motto) {
                    $('#form-motto').val(teacher_motto);
                }
            },
            error: function (xhr, status, error) {
                var errorMessage = "请求失败：" + error + "\n" + xhr.responseText;
                notify(errorMessage);
            }
        });
    });

    $('.finished-btn').click(function () {
        $('.status3').removeClass('show');
        $('.status3').addClass('disabled');
        $('.status1').addClass('show');
        $('.status1').removeClass('disabled');
    });

    $('.profile-form').submit(function (event) {
        event.preventDefault();
        // let teacher_name = $('#form-name').val();
        // let teacher_motto = $('#form-motto').val();
        form_data = new FormData(this);
        form_data.append('state', 'edit_user_info')

        $.ajax({
            type: 'POST',
            url: '../teacher/',
            data: form_data,
            processData: false,
            contentType: false,
            success: function (response) {
                $('.status2').removeClass('show');
                $('.status2').addClass('disabled');
                $('.status3').addClass('show');
                $('.status3').removeClass('disabled');

                let teacher_name = response.name;
                let teacher_motto = response.motto;
                let avatar_url = response.avatar_url;
                if (teacher_name) {
                    $('#name').text(teacher_name);
                }
                if (teacher_motto) {
                    $('#motto').text(teacher_motto);
                }
                if (avatar_url) {
                    $('.sidebar img').attr('src', avatar_url);
                    $('.upper-box img').attr('src', avatar_url);
                }
            },
            error: function (xhr, status, error) {
                var errorMessage = "请求失败：" + error + "\n" + xhr.responseText;
                notify(errorMessage);
            }
        });
    })

    // 班级管理
    $('.floating-plus').click(function () {
        $('#overlay').fadeIn();
        $('.floatingWindow').fadeIn();
    })

    $('.close').click(function () {
        $('#overlay').fadeOut();
        $('.floatingWindow').fadeOut();
        $('#form-class_name').val('');
    });

    $('.class_manage-btn').click(function () {
        if ($('.profile-box').hasClass('show')) {
            $('.profile-box').removeClass('show');
            $('.profile-box').addClass('disabled');
            $('.class_manage-box').addClass('show');
            $('.class_manage-box').removeClass('disabled');
            // 拉取班级信息
            update_class_list();
        }
    });

    $('.create_class-form').submit(function(event) {
        event.preventDefault();
        let class_name = $('#form-class_name').val();
        $.ajax({
            type: 'POST',
            url: '../teacher/',
            data: {
                csrfmiddlewaretoken: $('input[name=csrfmiddlewaretoken]').val(),
                state: 'create_class', 
                class_name: class_name
            },
            success: function (response) {
                update_class_list();
                $('#overlay').fadeOut();
                $('.floatingWindow').fadeOut();
                $('#form-class_name').val('');
            },
            error: function (xhr, status, error) {
                var errorMessage = "请求失败：" + error + "\n" + xhr.responseText;
                notify(errorMessage);
            }
        });
    });
}