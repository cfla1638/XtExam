$(document).ready(init);

// 全局变量
const option_item = '<div class=\'option_item\'><span class=\'option_label\'></span><span class=\'option_text\'>选项1</span></div>';
const MC_item = '<div class=\'question-item MC\' data-pk=\'\'><div class=\'prompt\'></div><div class=\'options\'></div><div class=\'ans-container\'><span>学生作答: </span><span class=\'ans\'></span></div><form><span>得分: </span><input type=\'text\' class=\"form-score\" name=\"form-score\"/></form></div>';
const MR_item = '<div class=\'question-item MR\' data-pk=\'\'><div class=\'prompt\'></div><div class=\'options\'></div><div class=\'ans-container\'><span>学生作答: </span><span class=\'ans\'></span></div><form><span>得分: </span><input type=\'text\' class=\"form-score\" name=\"form-score\"/></form></div>';
const blank_item = '<div class=\'blank_item\'><span class=\'blank_item_label\'></span><span class=\'blank_item_text\'></span></div>';
const FB_item = '<div class=\'question-item FB\' data-pk=\'\'><div class=\'prompt\'></div><div class=\'blank_list\'></div><form><span>得分: </span><input type=\'text\' class=\"form-score\" name=\"form-score\"/></form></div>';
const SB_item = '<div class=\'question-item SB\' data-pk=\'\'><div class=\'prompt\'></div><div class=\'ans-container\'><span>学生作答: </span><span class=\'ans\'></span></div><form><span>得分: </span><input type=\'text\' class=\"form-score\" name=\"form-score\"/></form></div>';

let last_selected = null;
let cur_selected = null;
$(document).on('CurSelectedChanged', cur_selected_changed);
const student_item = '<div class=\'student-item\' data-pk=\'\'>学生姓名</div>'

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

function load_ans(student_pk) {

}

function cur_selected_changed() {
    // 处理应该消失的页面
    if (last_selected != null) {        // 如果应该消失的页面是编辑器
        // 处理旧表单

        // 隐去旧页面
        $('.ans_details-box').removeClass('show');
        $('.ans_details-box').addClass('disabled');

        last_selected.removeClass('selected');
    }
    else {              // 如果应该消失的页面是欢迎界面
        $('.welcome-box').removeClass('show');
        $('.welcome-box').addClass('disabled');
    }

    // 加载新出现的界面
    if (last_selected?.get(0) === cur_selected.get(0)) {    // 如果应该加载欢迎界面
        $('.welcome-box').removeClass('disabled');
        $('.welcome-box').addClass('show');
        cur_selected.removeClass('selected');

        cur_selected = null;
        last_selected = null;
    }
    else {          // 如果应该加载新的编辑器
        cur_selected.addClass('selected');

        // 加载新表单
        student_pk = cur_selected.attr('data-pk');
        // load_ans(student_pk);

        // 显示新页面
        $('.ans_details-box').removeClass('disabled');
        $('.ans_details-box').addClass('show');
    }
    last_selected = cur_selected;
}

function bind_student_item() {
    $('.student-item').click(function () {
        cur_selected = $(this);
        $(document).trigger('CurSelectedChanged');
    });
}

function update_student_list() {
    let old_selected_pk = cur_selected?.find('img').attr('data-pk');
    cur_selected = null;
    $('.student_list').empty();
    let csrfToken = Cookies.get('csrftoken');
    $.ajax({
        type: 'POST',
        url: window.location.href,
        headers: {
            'X-CSRFToken': csrfToken
        },
        data: {
            state: 'fetch_student_list'
        },
        success: function (response) {
            response.forEach(i => {
                $('.student_list').append(student_item);
                let new_item = $('.student_list > div:last');
                new_item.attr('data-pk', i['pk']);
                new_item.text(i['name']);
                if (i['pk'] == old_selected_pk) {
                    cur_selected = new_item;
                    new_item.addClass('selected');
                }
            });
            bind_student_item();
        },
        error: function (xhr, status, error) {
            var errorMessage = "请求失败：" + error + "\n" + xhr.responseText;
            notify(errorMessage);
        }
    });
}

function init() {
    update_student_list();

    // 拉取试卷
    let csrfToken = Cookies.get('csrftoken');
    $.ajax({
        type: 'POST',
        url: window.location.href,
        headers: { 'X-CSRFToken': csrfToken },
        data: {
            state: 'fetch_ques_list'
        },
        success: function (response) {
            response.forEach(i => {
                if (i['type'] == 'MC') {
                    $('.question-list').append(MC_item);
                    let new_item = $('.question-list > div:last');
                    new_item.attr('data-pk', i['pk']);
                    new_item.find('.prompt').text(i['prompt']);
                    

                    let str = i['options'];
                    let regex = /\[(\w+)\]\{([^}]+)\}\s*/g;

                    let match;
                    while ((match = regex.exec(str)) !== null) {
                        var option = match[1];
                        var text = match[2];
                        
                        option += '. ';
                        new_item.find('.options').append(option_item);
                        let new_option = new_item.find('.options > div:last');
                        new_option.find('.option_label').text(option);
                        new_option.find('.option_text').text(text);
                    }
                }
                else if (i['type'] == 'MR') {

                }
                else if (i['type'] == 'FB') {

                }
                else if (i['type'] == 'SB') {

                }
                // $('.student_list').append(student_item);
                // let new_item = $('.student_list > div:last');
                // new_item.attr('data-pk', i['pk']);
                // new_item.text(i['name']);
                // if (i['pk'] == old_selected_pk) {
                //     cur_selected = new_item;
                //     new_item.addClass('selected');
                // }
            });
        },
        error: function (xhr, status, error) {
            var errorMessage = "请求失败：" + error + "\n" + xhr.responseText;
            notify(errorMessage);
        }
    });

}