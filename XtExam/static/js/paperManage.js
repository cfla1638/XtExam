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

function ques_type_transform(src) {
    if (src == 'MC')
        return 'MultiCho';
    else if (src == 'MR')
        return 'MultiRes';
    else if (src == 'FB')
        return 'Blank';
    else if (src == 'SB')
        return 'Subjective';
}

let cur_selected = null;

function init() {
    // 侧边栏
    $('.paper-item').click(function() {
        if ($(this).hasClass('selected')) {
            $(this).removeClass('selected')
            cur_selected = null;
            $('.editor-box').removeClass('show');
            $('.editor-box').addClass('disabled');
            $('.welcome-box').removeClass('disabled');
            $('.welcome-box').addClass('show');
        } 
        else {
            if (cur_selected == null) {
                cur_selected = $(this);
                $(this).addClass('selected');
                $('.welcome-box').removeClass('show');
                $('.welcome-box').addClass('disabled');
                $('.editor-box').removeClass('disabled');
                $('.editor-box').addClass('show');
            }
            else {
                $(this).addClass('selected');
                cur_selected.removeClass('selected');
                cur_selected = $(this);
            }
        }
    });

    // 悬浮窗口

    // Editor
    $('.question-item').data('oldValue', 'MC');
    $('.ques_type').change(function() {
        let ques_item = $(this).parent().parent().parent().parent();
        cur_val = ques_item.find('.' + ques_type_transform($(this).val()));
        pre_val = ques_item.find('.' + ques_type_transform(ques_item.data('oldValue')));

        pre_val.removeClass('show');
        pre_val.addClass('disabled');
        cur_val.addClass('show');
        cur_val.removeClass('disabled');
        ques_item.data('oldValue', $(this).val());
    });

    $(".question-list").sortable({start: function(event, ui) {
          ui.item.index(0); // 将目标元素的索引设置为0，即第一项
        }});
    $(".question-list").disableSelection();
}