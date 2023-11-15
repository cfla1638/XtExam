$(document).ready(init)

function init() {
    $(document).ready(function() {
        let current_index = 0;
        let slides = $('.slides img');
        let total_slides = slides.length
    
        slides.eq(current_index).addClass('active');
        setInterval(function() {
            slides.eq(current_index).removeClass('active');
            current_index = (current_index + 1) % total_slides;
            slides.eq(current_index).addClass('active');
        }, 5000);
    });

    $('.login-form').submit(function (event) {
        event.preventDefault();
        $.ajax({
            type: 'POST',
            url: '../login/',
            data: $('.login-form').serialize(),
            error: function(xhr, status, error) {
                alert('发生错误：' + error);
            },
            success: function(data) {
                alert(data);
            }
        })
    })
}