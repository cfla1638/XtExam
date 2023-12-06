$(document).ready(init);

let last_selected = null;
let cur_selected = null;
const paper_item = '<div class=\'paper-item\'><div class=\'paper_title\'>试卷名称</div><img data-pk=\'\' src=\'/static/img/minus.png\' alt=\'移除试卷\'></div>'
const ques_item = '<div class=\'question-item\' data-pk=\'\'><form class=\'ques-item-status editor-form-control MultiCho show\'><div class=\'ques-item-row1\'><textarea class=\'ques_prompt\' rows=\"3\" cols=\"30\" placeholder=\"请输入题干\"></textarea><div class=\'ques-item-col2\'><select class=\'ques_type\'><option value=\'MC\' selected>单选题</option><option value=\'MR\'>多选题</option><option value=\'FB\'>填空题</option><option value=\'SB\'>主观题</option></select><input type=\"text\" class=\"ques_category\" placeholder=\"知识点类型\" /></div></div><input type=\"text\" class=\"ques_options\" placeholder=\"请输入选项,格式为若干个[A,B,C...]{选项提示文字}\" /><input type=\"text\" class=\"ans\" placeholder=\"请输入答案,格式为单个的A,B,C...\" /><div class=\"remove_paper\"></div></form><form class=\'ques-item-status editor-form-control MultiRes disabled\'><div class=\'ques-item-row1\'><textarea class=\'ques_prompt\' rows=\"3\" cols=\"30\" placeholder=\"请输入题干\"></textarea><div class=\'ques-item-col2\'><select class=\'ques_type\'><option value=\'MC\'>单选题</option><option value=\'MR\' selected>多选题</option><option value=\'FB\'>填空题</option><option value=\'SB\'>主观题</option></select><input type=\"text\" class=\"ques_category\" placeholder=\"知识点类型\" /></div></div><input type=\"text\" class=\"ques_options\" placeholder=\"请输入选项,格式为若干个[A,B,C...]{选项提示文字}\" /><input type=\"text\" class=\"ans\" placeholder=\"请输入答案, 例如ABC\" /><div class=\"remove_paper\"></div></form><form class=\'ques-item-status editor-form-control Blank disabled\'><div class=\'ques-item-row1\'><textarea class=\'ques_prompt\' rows=\"3\" cols=\"30\" placeholder=\"请输入题干\"></textarea><div class=\'ques-item-col2\'><select class=\'ques_type\'><option value=\'MC\'>单选题</option><option value=\'MR\'>多选题</option><option value=\'FB\' selected>填空题</option><option value=\'SB\'>主观题</option></select><input type=\"text\" class=\"ques_category\" placeholder=\"知识点类型\" /></div></div><textarea class=\'blank_ans\' rows=\"2\" cols=\"30\" placeholder=\"请输入每个空的答案，格式为若干[1,2,3...]{答案}\"></textarea><div class=\"remove_paper\"></div></form><form class=\'ques-item-status editor-form-control Subjective disabled\'><div class=\'ques-item-row1\'><textarea class=\'ques_prompt\' rows=\"3\" cols=\"30\" placeholder=\"请输入题干\"></textarea><div class=\'ques-item-col2\'><select class=\'ques_type\'><option value=\'MC\'>单选题</option><option value=\'MR\'>多选题</option><option value=\'FB\'>填空题</option><option value=\'SB\' selected>主观题</option></select><input type=\"text\" class=\"ques_category\" placeholder=\"知识点类型\" /></div></div><textarea class=\'subjective_ans\' rows=\"2\" cols=\"30\" placeholder=\"请输入参考答案/评分标准\"></textarea><div class=\"remove_paper\"></div></form></div>';

$(document).on('CurSelectedChanged', cur_selected_changed);



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

function bind_ques_item() {
    $('.question-item').filter(function() {
        return $(this).data('oldValue') === undefined;
      }).data('oldValue', 'MC');
    $('.ques_type').change(function () {
        let ques_item = $(this).parent().parent().parent().parent();
        let cur_val = $(this).val();
        new_form = ques_item.find('.' + ques_type_transform(cur_val));
        old_form = ques_item.find('.' + ques_type_transform(ques_item.data('oldValue')));

        $(this).val(ques_item.data('oldValue'));
        ques_item.data('oldValue', cur_val);
        old_form.removeClass('show');
        old_form.addClass('disabled');
        old_form.find(':input:not(.ques_type)').val('');
        new_form.addClass('show');
        new_form.removeClass('disabled');
    });
    $('.remove_paper').click(function() {
        $(this).parent().parent().remove();
    })
}

function bind_paper_item() {
    $('.paper-item').click(function () {
        cur_selected = $(this);
        $(document).trigger('CurSelectedChanged');
    });
}

function load_paper(paper_pk) {
    // 清空原编辑器
    $('#paper_header_title').val();
    $('#paper_header_tips').val();
    $('.question-list').empty();

    // 拉取新的试卷
    $.ajax({
        type: 'POST',
        url: window.location.href,
        data: {
            csrfmiddlewaretoken: $('input[name=csrfmiddlewaretoken]').val(),
            state: 'fetch_paper',
            paper_pk: paper_pk
        },
        success: function (response) {
            console.log(response);
            $('#paper_header_title').val(response['title']);
            $('#paper_header_tips').val(response['tips']);
            response['question_list'].forEach(i => {
                $('.question-list').append(ques_item);
                let new_item = $('.question-list > div:last');
                new_item.attr('data-pk', i.pk);
                if (i.type == 'MC') {
                    activated_form = new_item.find('form.show');
                    activated_form.find('.ques_prompt').val(i.prompt);
                    activated_form.find('.ques_category').val(i.category);
                    activated_form.find('.ques_options').val(i.options);
                    activated_form.find('.ans').val(i.ans);
                    new_item.data('oldValue', 'MC');
                }
                else if (i.type == 'MR') {
                    old_form = new_item.find('form.MultiCho');
                    old_form.removeClass('show');
                    old_form.addClass('disabled');
                    new_form = new_item.find('form.' + ques_type_transform(i.type));
                    new_form.removeClass('disabled');
                    new_form.addClass('show');
                    activated_form = new_form;
                    
                    activated_form.find('.ques_prompt').val(i.prompt);
                    activated_form.find('.ques_category').val(i.category);
                    activated_form.find('.ques_options').val(i.options);
                    activated_form.find('.ans').val(i.ans);

                    new_item.data('oldValue', 'MR');
                }
                else if (i.type == 'FB') {
                    old_form = new_item.find('form.MultiCho');
                    old_form.removeClass('show');
                    old_form.addClass('disabled');
                    new_form = new_item.find('form.' + ques_type_transform(i.type));
                    new_form.removeClass('disabled');
                    new_form.addClass('show');
                    activated_form = new_form;

                    activated_form.find('.ques_prompt').val(i.prompt);
                    activated_form.find('.ques_category').val(i.category);
                    activated_form.find('.blank_ans').val(i.ans);

                    new_item.data('oldValue', 'FB');
                }
                else if (i.type == 'SB') {
                    old_form = new_item.find('form.MultiCho');
                    old_form.removeClass('show');
                    old_form.addClass('disabled');
                    new_form = new_item.find('form.' + ques_type_transform(i.type));
                    new_form.removeClass('disabled');
                    new_form.addClass('show');
                    activated_form = new_form;

                    activated_form.find('.ques_prompt').val(i.prompt);
                    activated_form.find('.ques_category').val(i.category);
                    activated_form.find('.subjective_ans').val(i.ans);

                    new_item.data('oldValue', 'SB');
                }
            });
            bind_ques_item();
        },
        error: function (xhr, status, error) {
            var errorMessage = "请求失败：" + error + "\n" + xhr.responseText;
            notify(errorMessage);
        }
    });
}

function cur_selected_changed() {
    // 处理应该消失的页面
    if (last_selected != null) {        // 如果应该消失的页面是编辑器
        // 处理旧表单

        // 隐去旧页面
        $('.editor-box').removeClass('show');
        $('.editor-box').addClass('disabled');

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

        cur_selected = null;
        last_selected = null;
    }
    else {          // 如果应该加载新的编辑器
        cur_selected.addClass('selected');

        // 加载新表单
        paper_pk = cur_selected.find('img').attr('data-pk');
        load_paper(paper_pk);

        // 显示新页面
        $('.editor-box').removeClass('disabled');
        $('.editor-box').addClass('show');
    }
    last_selected = cur_selected;
}

function update_paper_list() {
    let old_selected_pk = cur_selected?.find('img').attr('data-pk');
    cur_selected = null;
    $('.paper_list').empty();
    $.ajax({
        type: 'POST',
        url: window.location.href,
        data: {
            csrfmiddlewaretoken: $('input[name=csrfmiddlewaretoken]').val(),
            state: 'fetch_paper_list'
        },
        success: function (response) {
            response.forEach(i => {
                $('.paper_list').append(paper_item);
                let new_item = $('.paper_list > div:last');
                new_item.find('img').attr('data-pk', i['pk']);
                new_item.find('.paper_title').text(i['title']);
                if (i['pk'] == old_selected_pk) {
                    cur_selected = new_item;
                    new_item.addClass('selected');
                }
            });
            $('.paper-item img').click(function (event) {
                event.stopPropagation();
                parent = $(this).parent();
                $.ajax({
                    type: 'POST',
                    url: window.location.href,
                    data: {
                        csrfmiddlewaretoken: $('input[name=csrfmiddlewaretoken]').val(),
                        state: 'remove_paper',
                        paper_pk: $(this).attr('data-pk')
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
            });
            bind_paper_item();
        },
        error: function (xhr, status, error) {
            var errorMessage = "请求失败：" + error + "\n" + xhr.responseText;
            notify(errorMessage);
        }
    });
}

function init() {
    // 侧边栏
    update_paper_list();
    $('.paper_manage-btn').click(function () {
        $.ajax({
            type: 'POST',
            url: window.location.href,
            data: {
                csrfmiddlewaretoken: $('input[name=csrfmiddlewaretoken]').val(),
                state: 'create_paper',
            },
            success: function (response) {
                update_paper_list();
                notify(response);
            },
            error: function (xhr, status, error) {
                var errorMessage = "请求失败：" + error + "\n" + xhr.responseText;
                notify(errorMessage);
            }
        });
    });

    $('.exit-btn').click(function() {
        window.location.href = '../teacher/';
    });

    // 悬浮窗口
    $('.floating-save').click(function () {
        paper_pk = cur_selected?.find('img').attr('data-pk');
        jsonData = {};
        jsonData['paper_pk'] = paper_pk;
        jsonData['header'] = { 'title': $('#paper_header_title').val(), 'tips': $('#paper_header_tips').val() };
        let ques_list = []
        $('.question-list').children().each(function () {
            let ques_item = {}
            activated_form = $(this).find('form.show');
            ques_item['ques_pk'] = $(this).attr('data-pk');
            ques_item['type'] = activated_form.find('.ques_type').val();
            ques_item['prompt'] = activated_form.find('.ques_prompt').val();
            ques_item['category'] = activated_form.find('.ques_category').val();
            if (ques_item['type'] == 'MC') {
                ques_item['options'] = activated_form.find('.ques_options').val();
                ques_item['ans'] = activated_form.find('.ans').val();
            }
            else if (ques_item['type'] == 'MR') {
                ques_item['options'] = activated_form.find('.ques_options').val();
                ques_item['ans'] = activated_form.find('.ans').val();
            }
            else if (ques_item['type'] == 'FB') {
                ques_item['ans'] = activated_form.find('.blank_ans').val();
            }
            else if (ques_item['type'] == 'SB') {
                ques_item['ans'] = activated_form.find('.subjective_ans').val();
            }
            ques_list.push(ques_item);
        });
        jsonData['ques_list'] = ques_list;
        let csrfToken = Cookies.get('csrftoken');
        $.ajax({
            type: 'POST',
            url: '../save_paper/',
            data: JSON.stringify(jsonData),
            headers: {
                'X-CSRFToken': csrfToken,
                'Content-Type': 'application/json'
            },
            success: function (response) {
                update_paper_list();
                notify(response);
            },
            error: function (xhr, status, error) {
                var errorMessage = "请求失败：" + error + "\n" + xhr.responseText;
                notify(errorMessage);
            }
        });
    });

    $('.floating-plus').click(function () {
        $('.question-list').append(ques_item);
        bind_ques_item();
    });

    // Editor
    bind_ques_item();


    $(".question-list").sortable();
    $(".question-list").disableSelection();
}