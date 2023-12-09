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

function get_url_prefix(url) {
  const pattern = /(.+\/)class_exam/;
  const matches = url.match(pattern);
  if (matches && matches.length > 1) {
    return matches[1];
  }
  return null;
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
      let exams = response.exams;
      let studentParticipations = response.participations;

      exams.forEach(function (exam) {
        let examPk = exam.pk;
        let examName = exam.name;
        // 其他属性...

        // 在这里可以根据学生是否参加某次考试来判断考试是新的还是历史的
        let isParticipated = studentParticipations.some(function (participation) {
          return participation.exam === examPk && participation.state === true;
        });

        let examItem = $('<div class="exam-item" data-pk="' + examPk + '"></div>');
        let examNameElement = $('<div class="exam-name">' + examName + '</div>');
        let examStatusElement = $('<div class="exam-status">新的考试</div>');

        if (isParticipated) {
          // 考试为历史考试
          examItem.addClass('history-exam');
          examStatusElement.text('（历史考试）');
        } else {
          // 考试为新的考试
          examItem.addClass('new-exam');
          examStatusElement.text('（新的考试）');
        }

        examItem.append(examNameElement);
        examItem.append(examStatusElement);

        $('.exam-list').append(examItem);
      });
    },
    error: function (xhr, status, error) {
      var errorMessage = "请求失败：" + error + "\n" + xhr.responseText;
      notify(errorMessage);
    }
  });
}

function init() {
    $('.exit-btn').click(function() {window.location.href = window.location.href.split('class_exam')[0]+'student/';});
    
    update_bulletin();
    update_exam_list();

    // 点击考试项目跳转到相应链接
    $(document).on('click', '.exam-item', function () {
      let csrfToken = Cookies.get('csrftoken');
      let $examItem = $(this);
      let examId = $examItem.data('pk');
      // 发送 AJAX 请求获取试卷信息
      $.ajax({
        type: 'POST',
        url: window.location.href,
        headers: { 'X-CSRFToken': csrfToken },
        data: {
          state: 'fetch_exam_content',
          exam_id: examId
        },
        success: function (response) {
          //将试卷信息填充到右侧边栏的容器中
          $('.exam-box').removeClass('show');
          $('.exam-box').addClass('disabled');
          $('.exam-content').addClass('show');
          $('.exam-content').removeClass('disabled');
          $('.exam-content').html(response);
    
          // 添加返回按钮
          var backButton = $('<button class="back-button">返回</button>');
          $('.exam-content').append(backButton);
    
          // 返回按钮点击事件
          backButton.click(function () {
            $('.exam-content').removeClass('show');
            $('.exam-content').addClass('disabled');
            $('.exam-box').addClass('show');
            $('.exam-box').removeClass('disabled');
            // 执行状态1的相关操作
            // ...
          });
        },
        error: function (xhr, status, error) {
          var errorMessage = "请求失败：" + error + "\n" + xhr.responseText;
          notify(errorMessage);
        }
      });
    });
}