$(document).ready(init);

// 全局变量
let examEndTime = new Date("2023-12-20T12:00:00");
const option_item = '<div class=\'option_item\'><span class=\'option_label\'></span><span class=\'option_text\'></span></div>';
const MC_item = '<div class=\'question-item MC\' data-pk=\'\' data-anspk=\'\'><div class=\'prompt\'></div><div class=\'options\'></div><form><span>答案: </span><input type=\'text\' class=\"form-ans\" name=\"form-ans\"/></form></div>';
const MR_item = MC_item;
const blank_item = '<input type=\'text\' class=\"form-blank-item\" name=\"form-score\" placeholder=\'\'/>';
const FB_item = '<div class=\'question-item FB\' data-pk=\'\' data-anspk=\'\'><div class=\'prompt\'></div><div class=\'blank_list\'></div></div>';
const SB_item = '<div class=\'question-item SB\' data-pk=\'\' data-anspk=\'\'><div class=\'prompt\'></div><textarea class=\'form-SB-ans\' rows=\"3\" cols=\"30\" ></textarea></div>';
let cur_exam_pk = null;

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

function get_url_prefix(url) {
    const pattern = /(.+\/)class_exam/;
    const matches = url.match(pattern);
    if (matches && matches.length > 1) {
        return matches[1];
    }
    return null;
}

// 获取班级公告内容
function update_bulletin() {
    let csrfToken = Cookies.get('csrftoken');
    $.ajax({
        type: 'POST',
        url: window.location.href,
        headers: { 'X-CSRFToken': csrfToken },
        data: {
            state: 'fetch_bulletin_text',
        },
        success: function (response) {
            $('.bulletin-text').text(response['bulletin']);
        },
        error: function (xhr, status, error) {
            var errorMessage = "请求失败：" + error + "\n" + xhr.responseText;
            notify(errorMessage);
            notify('即将返回登陆界面');
            setTimeout(function() { window.location.href = get_url_prefix(window.location.href) + 'login/' } , 3000);
        }
    });
}

//获取班级的考试信息
function update_exam_list() {
    $('.exam-list').empty();
    let csrfToken = Cookies.get('csrftoken');
    $.ajax({
        type: 'POST',
        url: window.location.href,
        headers: { 'X-CSRFToken': csrfToken },
        data: {
            state: 'fetch_exam_list'
        },
        success: function (response) {
            console.log(response);
            response.forEach(i => {
                let examPk = i.pk;
                let examName = i.name;
                let isParticipated = i.state;

                let examItem = $('<div class="exam-item" data-pk="' + examPk + '"></div>');
                let examNameElement = $('<div class="exam-name">' + examName + '</div>');
                let examStatusElement = $('<div class="exam-status">新的考试</div>');

                if (isParticipated == 'False') {     // 考试为历史考试
                    examItem.addClass('new-exam');
                    examStatusElement.text('(新的考试)');
                } else {      // 考试为新的考试
                    examItem.addClass('history-exam');
                    examStatusElement.text('(历史考试)');
                }
                examItem.append(examNameElement);
                examItem.append(examStatusElement);

                $('.exam-list').append(examItem);
            });
            bind_exam_item();
        },
        error: function (xhr, status, error) {
            var errorMessage = "请求失败：" + error + "\n" + xhr.responseText;
            notify(errorMessage);
        }
    });
}

// 判断当前时间是否在指定的时间段内
function isTimeWithinEvent(startTime, duration) {
    var currentTime = new Date();
    var eventStartTime = new Date(startTime);
    var eventEndTime = new Date(eventStartTime.getTime() + parseDuration(duration));
    if (currentTime >= eventStartTime && currentTime <= eventEndTime) {
        return true;
    } else {
        return false;
    }
}

// 解析持续时间
function parseDuration(duration) {
    var durationRegex = /P(\d+)DT(\d+)H(\d+)M(\d+)S/; // 正则表达式匹配持续时间的格式
    var matches = duration.match(durationRegex);
    var days = parseInt(matches[1]);
    var hours = parseInt(matches[2]);
    var minutes = parseInt(matches[3]);
    var seconds = parseInt(matches[4]);

    // 计算总持续时间（以毫秒为单位）
    var totalDuration = (days * 24 * 60 * 60 + hours * 60 * 60 + minutes * 60 + seconds) * 1000;
    return totalDuration;
}

function calculateEndTime(startTime, duration) {
    var eventStartTime = new Date(startTime); // 将开始时间转换为Date对象
  
    // 解析持续时间
    var durationRegex = /P(\d+)DT(\d+)H(\d+)M(\d+)S/;
    var matches = duration.match(durationRegex);
    var days = parseInt(matches[1]);
    var hours = parseInt(matches[2]);
    var minutes = parseInt(matches[3]);
    var seconds = parseInt(matches[4]);
  
    // 根据持续时间计算结束时间
    var endTime = new Date(eventStartTime.getTime() + (days * 24 * 60 * 60 + hours * 60 * 60 + minutes * 60 + seconds) * 1000);
  
    return endTime;
  }

function bind_exam_item() {
    let csrfToken = Cookies.get('csrftoken');
    $('.exam-item').click(function () {
        cur_exam_pk = $(this).attr('data-pk');
        $.ajax({
            type: 'POST',
            url: window.location.href,
            headers: { 'X-CSRFToken': csrfToken },
            data: {
                state: 'fetch_exam',
                exam_pk: $(this).attr('data-pk')
            },
            success: function (response) {
                console.log(response);
                if (!isTimeWithinEvent(response['start_time'], response['duration'])) {
                    notify('当前时间不在考试时间范围内!');
                }
                else {
                    // 渲染试卷
                    $('.exam-box').removeClass('show');
                    $('.exam-box').addClass('disabled');
                    $('.exam-content').removeClass('disabled');
                    $('.exam-content').addClass('show');
                    examEndTime = calculateEndTime(response['start_time'], response['duration']);
                    updateCountdown();
                    response['ques_list'].forEach(i => {
                        if (i['type'] == 'MC') {
                            $('.question-list').append(MC_item);
                            let new_item = $('.question-list > div:last');
                            new_item.attr('data-pk', i['pk']);
                            new_item.find('.prompt').text(i['prompt']);
                            new_item.attr('data-anspk', i['anspk']);
                            new_item.find('.form-ans').val(i['ans']);
        
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
                            $('.question-list').append(MR_item);
                            let new_item = $('.question-list > div:last');
                            new_item.attr('data-pk', i['pk']);
                            new_item.find('.prompt').text(i['prompt']);
                            new_item.attr('data-anspk', i['anspk']);
                            new_item.find('.form-ans').val(i['ans']);
        
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
                        else if (i['type'] == 'FB') {
                            $('.question-list').append(FB_item);
                            let new_item = $('.question-list > div:last');
                            new_item.attr('data-pk', i['pk']);
                            new_item.find('.prompt').text(i['prompt']);
                            new_item.attr('data-anspk', i['anspk']);

                            let str = i['blanks'];
                            let regex = /\[(\w+)\]\{([^}]+)\}\s*/g;
        
                            let match;
                            while ((match = regex.exec(str)) !== null) {
                                new_item.find('.blank_list').append(blank_item);
                            }

                            str = i['ans'];
                            let ans_index = 0;
                            while ((match = regex.exec(str)) !== null) {
                                var option = match[1];
                                var text = match[2];
        
                                new_item.find('.blank_list').children().eq(ans_index).val(text);
                                ans_index++;
                            }

                        }
                        else if (i['type'] == 'SB') {
                            console.log(i);
                            $('.question-list').append(SB_item);
                            let new_item = $('.question-list > div:last');
                            new_item.attr('data-pk', i['pk']);
                            new_item.find('.prompt').text(i['prompt']);
                            new_item.attr('data-anspk', i['anspk']);
                            new_item.find('.form-SB-ans').val(i['ans']);
                        }
                    });
                }
            },
            error: function (xhr, status, error) {
                var errorMessage = "请求失败：" + error + "\n" + xhr.responseText;
                notify(errorMessage);
            }
        });
    });
}

function updateCountdown() {
    let currentTime = new Date();   // 获取当前时间
    let timeDifference = examEndTime - currentTime;   // 计算距离考试结束的时间差

    // 将时间差转换为小时、分钟和秒
    let hours = Math.floor(timeDifference / (1000 * 60 * 60));
    let minutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));
    let seconds = Math.floor((timeDifference % (1000 * 60)) / 1000);

    $("#countdown").text(hours + ":" + minutes + ":" + seconds);  // 更新倒计时显示
    setTimeout(updateCountdown, 1000);  // 每秒更新一次倒计时
}

function init() {
    $('.exit-btn').click(function () { window.location.href = window.location.href.split('class_exam')[0] + 'student/'; });

    update_bulletin();
    update_exam_list();

    // 绑定返回按钮
    $('.back-button').click(function() {
        $('.exam-content').removeClass('show');
        $('.exam-content').addClass('disabled');
        $('.exam-box').removeClass('disabled');
        $('.exam-box').addClass('show');
        $('.question-list').empty();
        cur_exam_pk = null;
        update_exam_list();
    });

    // 绑定保存按钮
    $('.floating-save').click(function () {    
        let jsonData = {};
        jsonData['exam_pk'] = cur_exam_pk;
        ans_list = [];
        $('.question-list').children().each(function () {
            let ques_item = {};
            ques_item['ques_pk'] = $(this).attr('data-pk');
            ques_item['ans_pk'] = $(this).attr('data-anspk');
            
            if ($(this).hasClass('MC')) {
                ques_item['type'] = 'MC';
                ques_item['ans'] = $(this).find('.form-ans').val();
            }
            else if ($(this).hasClass('MR')) {
                ques_item['type'] = 'MR';
                ques_item['ans'] = $(this).find('.form-ans').val();
            }
            else if ($(this).hasClass('FB')) {
                ques_item['type'] = 'FB';
                let blank_ans = '';
                let blank_cnt = 1;
                $(this).find('.blank_list').children().each(function() {
                    blank_ans += ('[' + blank_cnt + ']' + '{' + $(this).val() + '}');
                    blank_cnt++;
                });
                ques_item['ans'] = blank_ans;
            }
            else if ($(this).hasClass('SB')) {
                ques_item['type'] = 'SB';
                ques_item['ans'] = $(this).find('.form-SB-ans').val();
            }
            ans_list.push(ques_item);
        });
        jsonData['ans_list'] = ans_list;
        console.log(jsonData);
        let csrfToken = Cookies.get('csrftoken');
        $.ajax({
            type: 'POST',
            url: get_url_prefix(window.location.href) + 'stu_save_ans/',
            headers: {
                'X-CSRFToken': csrfToken
            },
            data: JSON.stringify(jsonData),
            success: function (response) {
                notify(response);
                $.ajax({
                    type: 'POST',
                    url: window.location.href,
                    headers: { 'X-CSRFToken': csrfToken },
                    data: {
                        state: 'fetch_exam',
                        exam_pk: cur_exam_pk
                    },
                    success: function (response) {
                        console.log(response);
                        if (!isTimeWithinEvent(response['start_time'], response['duration'])) {
                            notify('当前时间不在考试时间范围内!');
                        }
                        else {
                            // 渲染试卷
                            $('.question-list').empty();
                            response['ques_list'].forEach(i => {
                                if (i['type'] == 'MC') {
                                    $('.question-list').append(MC_item);
                                    let new_item = $('.question-list > div:last');
                                    new_item.attr('data-pk', i['pk']);
                                    new_item.find('.prompt').text(i['prompt']);
                                    new_item.attr('data-anspk', i['anspk']);
                                    new_item.find('.form-ans').val(i['ans']);
                
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
                                    $('.question-list').append(MR_item);
                                    let new_item = $('.question-list > div:last');
                                    new_item.attr('data-pk', i['pk']);
                                    new_item.find('.prompt').text(i['prompt']);
                                    new_item.attr('data-anspk', i['anspk']);
                                    new_item.find('.form-ans').val(i['ans']);
                
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
                                else if (i['type'] == 'FB') {
                                    $('.question-list').append(FB_item);
                                    let new_item = $('.question-list > div:last');
                                    new_item.attr('data-pk', i['pk']);
                                    new_item.find('.prompt').text(i['prompt']);
                                    new_item.attr('data-anspk', i['anspk']);

                                    let str = i['blanks'];
                                    let regex = /\[(\w+)\]\{([^}]+)\}\s*/g;
                
                                    let match;
                                    while ((match = regex.exec(str)) !== null) {
                                        new_item.find('.blank_list').append(blank_item);
                                    }

                                    str = i['ans'];
                                    let ans_index = 0;
                                    while ((match = regex.exec(str)) !== null) {
                                        var option = match[1];
                                        var text = match[2];
                
                                        new_item.find('.blank_list').children().eq(ans_index).val(text);
                                        ans_index++;
                                    }

                                }
                                else if (i['type'] == 'SB') {
                                    console.log(i);
                                    $('.question-list').append(SB_item);
                                    let new_item = $('.question-list > div:last');
                                    new_item.attr('data-pk', i['pk']);
                                    new_item.find('.prompt').text(i['prompt']);
                                    new_item.attr('data-anspk', i['anspk']);
                                    new_item.find('.form-SB-ans').val(i['ans']);
                                }
                            });
                        }
                    },
                    error: function (xhr, status, error) {
                        var errorMessage = "请求失败：" + error + "\n" + xhr.responseText;
                        notify(errorMessage);
                    }
                });
            },
            error: function (xhr, status, error) {
                var errorMessage = "请求失败：" + error + "\n" + xhr.responseText;
                notify(errorMessage);
            }
        });
    });
}