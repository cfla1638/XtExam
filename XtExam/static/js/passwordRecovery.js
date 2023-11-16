$(document).ready(init);

let submited_email;

function init() {
    $('.email-form').submit(function (event) {
        event.preventDefault();
        submited_email = $('#email').val();
        $.ajax({
            type: 'POST',
            url: '../passwordRecovery/',
            data: {
                csrfmiddlewaretoken: $('input[name=csrfmiddlewaretoken]').val(),
                email: submited_email,
                state: 'submit_email_send_captcha'
            },
            success: function (response) {
                // 请求成功后的处理逻辑
                alert(response);
            },
            error: function (xhr, status, error) {
                // 请求失败后的处理逻辑
                alert(error);
            }
        });
    })
}