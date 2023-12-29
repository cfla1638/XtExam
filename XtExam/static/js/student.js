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

function update_class_list() {
    $('.class_list-box').empty();
    $.ajax({
        type: 'POST',
        url: '../student/',
        data: {
            csrfmiddlewaretoken: $('input[name=csrfmiddlewaretoken]').val(),
            state: 'fetch_class_info'
        },
        success: function (response) {
            console.log(response);
            response.forEach(i => {
                $('.class_list-box').append(class_item);
                let new_item = $('.class_list-box > div:last');
                new_item.attr('data-pk', i['pk']);
                new_item.find('.class_name').text(i['class_name']);
                new_item.find('.teacher_name').text(i['teacher_name']);
                new_item.find('.student_count').text(i['student_cnt'] + '人');
                $('.class-item').click(function () {
                    target_link = '../class_exam/' + $(this).attr('data-pk') + '/';
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

function init() {
    // 取得用户信息
    $.ajax({
        type: 'POST',
        url: '../student/',
        data: {
            csrfmiddlewaretoken: $('input[name=csrfmiddlewaretoken]').val(),
            state: 'fetch_user_info'
        },
        success: function (response) {
            let avatar_url = response.avatar_url;
            let student_name = response.name;
            let student_motto = response.motto;
            if (avatar_url) {
                $('.sidebar img').attr('src', avatar_url);
                $('.upper-box img').attr('src', avatar_url);
            }
            if (student_name) {
                $('#name').text(student_name);
            }
            if (student_motto) {
                $('#motto').text(student_motto);
            }
        },
        error: function (xhr, status, error) {
            var errorMessage = "请求失败：" + error + "\n" + xhr.responseText;
            notify(errorMessage);
            notify('即将返回登陆界面');
            setTimeout(function () { window.location.href = '../login/' }, 3000);
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
            url: '../student/',
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

    $('.sidebar img').click(function () {
        if ($('.class_manage-box').hasClass('show')) {
            $('.class_manage-box').removeClass('show');
            $('.class_manage-box').addClass('disabled');
            $('.profile-box').addClass('show');
            $('.profile-box').removeClass('disabled');
        }
    })

    //个人信息返回
    $('.exampaper_manage-btn').click(function () {
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
            url: '../student/',
            data: {
                csrfmiddlewaretoken: $('input[name=csrfmiddlewaretoken]').val(),
                state: 'fetch_user_info'
            },
            success: function (response) {
                let student_name = response.name;
                let student_motto = response.motto;
                if (student_name) {
                    $('#form-name').val(student_name);
                }
                if (student_motto) {
                    $('#form-motto').val(student_motto);
                }
            },
            error: function (xhr, status, error) {
                var errorMessage = "请求失败：" + error + "\n" + xhr.responseText;
                notify(errorMessage);
            }
        });
    });

    // 监听表单提交事件
    $('.join_class-form').submit(function (event) {
        event.preventDefault(); // 阻止表单默认提交行为
        var classId = $('#searchId').val();
        $.ajax({
            type: 'POST',
            url: '../student/',
            data: {
                csrfmiddlewaretoken: $('input[name=csrfmiddlewaretoken]').val(),
                state: 'search',
                classId: classId
            },
            success: function (response) {
                notify('学生添加成功！');
                update_class_list();
                $('#overlay').fadeOut();
                $('.floatingWindow').fadeOut();
                $('#searchId').val('');
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
        form_data = new FormData(this);
        form_data.append('state', 'edit_user_info')

        $.ajax({
            type: 'POST',
            url: '../student/',
            data: form_data,
            processData: false,
            contentType: false,
            success: function (response) {
                $('.status2').removeClass('show');
                $('.status2').addClass('disabled');
                $('.status3').addClass('show');
                $('.status3').removeClass('disabled');

                let student_name = response.name;
                let student_motto = response.motto;
                let avatar_url = response.avatar_url;
                if (student_name) {
                    $('#name').text(student_name);
                }
                if (student_motto) {
                    $('#motto').text(student_motto);
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

    $('#selected-courses-btn').click(function () {
        // 切换侧边栏按钮的样式
        $('.sidebar-btn').removeClass('active');
        $(this).addClass('active');

        // 切换内容区域的显示
        $('.content-box').removeClass('show');
        $('.class_manage-box').addClass('show');
    });
}