$(document).ready(init);

const student_item = '<div class=\'student-item\'><div class=\'student_name\'>学生姓名</div><img data-stuPK=\'\' src=\'/static/img/minus.png\' alt=\'移除学生\'></div>';
const query_res_inclass = '<div class=\'mem_query_res-item\'><div class=\'student_name\'>学生姓名</div><img data-pk=\'\' data-method=\'remove\' src=\'/static/img/minus.png\' alt=\'管理学生\'></div>';
const query_res_notinclass = '<div class=\'mem_query_res-item\'><div class=\'student_name\'>学生姓名</div><img data-pk=\'\' data-method=\'add\' src=\'/static/img/plus.png\' alt=\'管理学生\'></div>';
const exam_item = '<div class=\'exam-item\' data-pk=\'\'></div>';
const paper_options = '<option value=\'\'></option>';

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

function update_bulletin() {
    $.ajax({
        type: 'POST',
        url: window.location.href,
        data: {
            csrfmiddlewaretoken: $('input[name=csrfmiddlewaretoken]').val(),
            state: 'fetch_bulletin_text'
        },
        success: function (response) {
            $('.bulletin-text').text(response['bulletin']);
            $('#edit-bulletin').val(response['bulletin']);
        },
        error: function (xhr, status, error) {
            var errorMessage = "请求失败：" + error + "\n" + xhr.responseText;
            notify(errorMessage);
        }
    });
}

function update_sidebar() {
    $('.student_list').empty();
    $.ajax({
        type: 'POST',
        url: window.location.href,
        data: {
            csrfmiddlewaretoken: $('input[name=csrfmiddlewaretoken]').val(),
            state: 'fetch_student_list'
        },
        success: function (response) {
            response.forEach(i => {
                $('.student_list').append(student_item);
                let new_item = $('.student_list > div:last');
                new_item.find('img').attr('data-stuPK', i['pk']);
                new_item.find('.student_name').text(i['name']);
            });
            $('.student-item img').click(function() {
                parent = $(this).parent();
                $.ajax({
                    type: 'POST',
                    url: window.location.href,
                    data: {
                        csrfmiddlewaretoken: $('input[name=csrfmiddlewaretoken]').val(),
                        state: 'remove_student',
                        stupk: $(this).attr('data-stupk')
                    },
                    success: function (response) {
                        parent.remove();
                        notify(response);
                    },
                    error: function (xhr, status, error) {
                        var errorMessage = "请求失败：" + error + "\n" + xhr.responseText;
                        notify(errorMessage);
                    }
                });
            })
        },
        error: function (xhr, status, error) {
            var errorMessage = "请求失败：" + error + "\n" + xhr.responseText;
            notify(errorMessage);
        }
    });
}

function get_url_prefix(url) {
    const pattern = /(.+\/)classManage/;
    const matches = url.match(pattern);
    if (matches && matches.length > 1) {
      return matches[1];
    }
    return null;
}

function update_exam_list() {
    $('.exam-list').empty();
    $.ajax({
        type: 'POST',
        url: window.location.href,
        data: {
            csrfmiddlewaretoken: $('input[name=csrfmiddlewaretoken]').val(),
            state: 'fetch_exam_list'
        },
        success: function (response) {
            response.forEach(i => {
                $('.exam-list').append(exam_item);
                let new_item = $('.exam-list > div:last');
                new_item.attr('data-pk', i['pk']);
                new_item.text(i['name']);
            });
            $('.exam-item').click(function() {
                window.location.href = get_url_prefix(window.location.href) + 'exam/' + $(this).attr('data-pk') + '/';
            });
        },
        error: function (xhr, status, error) {
            var errorMessage = "请求失败：" + error + "\n" + xhr.responseText;
            notify(errorMessage);
        }
    });
}

function init() {
    $.ajax({
        type: 'POST',
        url: window.location.href,
        data: {
            csrfmiddlewaretoken: $('input[name=csrfmiddlewaretoken]').val()
        },
        success: function (response) {},
        error: function (xhr, status, error) {
            if (xhr.responseText == '用户未登录!') {
                notify('用户未登录, 即将返回登陆界面');
                setTimeout(function() {window.location.href = get_url_prefix(window.location.href) + 'login/'}, 3000)
            }
        }
    });

    // 悬浮窗口
    $('.members_manage-btn').click(function () {
        $('#overlay').fadeIn();
        $('.members_manage-window').fadeIn();
    });

    $('.mem_man-close').click(function () {
        $('#overlay').fadeOut();
        $('.members_manage-window').fadeOut();
    });

    $('.floating-plus').click(function () {
        $('#overlay').fadeIn();
        $('.publish_exam-window').fadeIn();
        
        $.ajax({
            type: 'POST',
            url: window.location.href,
            data: {
                csrfmiddlewaretoken: $('input[name=csrfmiddlewaretoken]').val(),
                state: 'fetch_papers'
            },
            success: function (response) {
                response.forEach(i => {
                    $('#form-paper').append(paper_options);
                    let new_item = $('#form-paper > option:last');
                    new_item.attr('value', i['pk']);
                    new_item.text(i['title']);
                });
            },
            error: function (xhr, status, error) {
                var errorMessage = "请求失败：" + error + "\n" + xhr.responseText;
                notify(errorMessage);
            }
        });
    });

    $('.publish_exam-close').click(function () {
        $('#overlay').fadeOut();
        $('.publish_exam-window').fadeOut();
    });

    $('.members_query-form').submit(function (event){
        event.preventDefault();
        let query_key = $('#form-members_query').val().trim();
        if (query_key.length == 0) {
            notify('查询不能为空!');
            return ;
        }
        $.ajax({
            type: 'POST',
            url: window.location.href,
            data: {
                csrfmiddlewaretoken: $('input[name=csrfmiddlewaretoken]').val(),
                state: 'members_query',
                query_key: query_key
            },
            success: function (response) {
                if (Object.keys(response).length === 0) {
                    $('.members_query_res-container').empty();
                    $('#form-members_query').val('');
                    notify('查询结果为空!')
                }
                else {
                    $('.members_query_res-container').empty();
                    $('#form-members_query').val('')
                    response.forEach(i => {
                        if (i['is_in_class'] == 'true')
                            $('.members_query_res-container').append(query_res_inclass);
                        else
                            $('.members_query_res-container').append(query_res_notinclass);
                        let new_item = $('.members_query_res-container > div:last');
                        new_item.find('img').attr('data-pk', i['pk']);
                        new_item.find('.student_name').text(i['name']);
                    });

                    $('.members_query_res-container img').click(function() {
                        method = $(this).attr('data-method')
                        parent = $(this).parent();
                        $.ajax({
                            type: 'POST',
                            url: window.location.href,
                            data: {
                                csrfmiddlewaretoken: $('input[name=csrfmiddlewaretoken]').val(),
                                state: 'add_remove_student',
                                stupk: $(this).attr('data-pk'),
                                method: method
                            },
                            success: function (response) {
                                parent.remove();
                                update_sidebar();
                                notify(response);
                            },
                            error: function (xhr, status, error) {
                                var errorMessage = "请求失败：" + error + "\n" + xhr.responseText;
                                notify(errorMessage);
                            }
                        });
                    });
                }
            },
            error: function (xhr, status, error) {
                var errorMessage = "请求失败：" + error + "\n" + xhr.responseText;
                notify(errorMessage);
            }
        });
    });

    // 侧边栏
    $('.settings-btn').click(function() {
        $('.exam-box').removeClass('show');
        $('.exam-box').addClass('disabled');
        $('.settings-box').addClass('show');
        $('.settings-box').removeClass('disabled');
    });

    $('#LOGO').click(function() {
        $('.settings-box').removeClass('show');
        $('.settings-box').addClass('disabled');
        $('.exam-box').addClass('show');
        $('.exam-box').removeClass('disabled');
    });
    $('.exit-btn').click(function() {window.location.href = window.location.href.split('classManage')[0]+'teacher/';});

    update_sidebar();
    

    // 主页
    update_bulletin();

    update_exam_list();

    $('.publish_exam-form').submit(function(event) {
        event.preventDefault();
        let exam_title = $('#form-exam_name').val();
        let paper_pk = $('#form-paper').val();
        let start_time = $('#form-start_time').val();
        let duration = $('#form-exam_duration').val();

        $.ajax({
            type: 'POST',
            url: window.location.href,
            data: {
                csrfmiddlewaretoken: $('input[name=csrfmiddlewaretoken]').val(),
                state: 'publish_exam',
                exam_title : exam_title,
                paper_pk : paper_pk,
                start_time : start_time,
                duration : duration
            },
            success: function (response) {
                update_exam_list();
                $('#form-exam_name').val('');
                $('#form-paper').val('');
                $('#form-start_time').val('');
                $('#form-exam_duration').val('');
                $('#overlay').fadeOut();
                $('.publish_exam-window').fadeOut();
                notify(response);
            },
            error: function (xhr, status, error) {
                var errorMessage = "请求失败：" + error + "\n" + xhr.responseText;
                notify(errorMessage);
            }
        });
    });

    // 设置界面
    $('.save-bulletin').click(function() {
        content = $('#edit-bulletin').val();
        $.ajax({
            type: 'POST',
            url: window.location.href,
            data: {
                csrfmiddlewaretoken: $('input[name=csrfmiddlewaretoken]').val(),
                state: 'edit-bulletin',
                content : content
            },
            success: function (response) {
                update_bulletin();
                notify(response);
            },
            error: function (xhr, status, error) {
                var errorMessage = "请求失败：" + error + "\n" + xhr.responseText;
                notify(errorMessage);
            }
        });
    })
}