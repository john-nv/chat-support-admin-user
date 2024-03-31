$(document).ready(function () {
    const socket = io({ path: "/admin" });
    const newMsg = new Audio('./voice/newMsg.mp3');
    const sendMsg = new Audio('./voice/sendMsg.mp3');
    let userIdCurrent = ''
    let volume = localStorage.getItem('volumeSetting_admin') === 'true';
    _loadMessage()

    $('.volume i').toggleClass('fa-volume-high', volume).toggleClass('fa-volume-xmark', !volume);
    $('.volume').click(function () {
        var icon = $(this).find('i');
        volume = !volume;
        localStorage.setItem('volumeSetting_admin', volume);
        icon.toggleClass('fa-volume-high', volume).toggleClass('fa-volume-xmark', !volume);
    });

    socket.on('connect', () => {
        console.info(`${socket.id}`);
    });

    socket.on('message', (payload) => {
        const { userId, socketId, message } = payload;
        const existingMessageDiv = $(`.container-message .item-message[data-userId="${userId}"]`);

        if (volume) newMsg.play()
        let addClassMsgNew = 'message-new';
        if (userIdCurrent == userId) {
            addClassMsgNew = '';
            _seenMessageUserId(userId)
            const div = `<div class="item-show-message item-show-message-you float-left"><span>${message}</span></div>`;
            $('.show-message-user').append(div);
            $('.show-message-user').scrollTop($('.show-message-user')[0].scrollHeight);
        }

        if (existingMessageDiv.length > 0) {
            existingMessageDiv.prependTo('.container-message').addClass(addClassMsgNew)
        } else {
            const messageDiv = $('<div>', {
                class: `item-message ${addClassMsgNew}`,
                'data-userId': userId
            }).html(`<span class="item-title">Tin nhắn từ</span><br/><span>${userId}</span>`);

            $('.container-message').eq(0).prepend(messageDiv);
        }
    });

    $(document).on('click', '.item-message', function () {
        $('.item-message').removeClass('message-active');
        $(this).addClass('message-active');
        if ($(this).hasClass('message-new')) $(this).removeClass('message-new')
        const userId = $(this).data('userid');
        $('.userNameCurrent').text(`Chat với ${userId}`);
        userIdCurrent = userId
        console.log(`=> ${userId}`)
        _loadMessageOneUser(userId)
    });

    $('#send-message').on('click', () => { _sendMessage() });

    $('#value-message').on('keypress', function (event) {
        if (event.which === 13 && !event.shiftKey) {
            _sendMessage();
        }
    });

    function _loadMessageOneUser(userId) {
        $.ajax({
            type: "POST",
            url: "/message/getOne",
            data: $.param({ userId: userId }),
            contentType: "application/x-www-form-urlencoded",
            success: function (response) {
                console.log(response)
                $('.show-message-user').html('')
                for (let i = 0; i < response.length; i++) {
                    let setClass = (response[i].who == 'admin') ? 'item-show-message-me float-right' : 'item-show-message-you float-left'
                    const div = `<div class="item-show-message ${setClass}"><span>${response[i].message}</span></div>`
                    $('.show-message-user').append(div);
                }
                $('.show-message-user').scrollTop($('.show-message-user')[0].scrollHeight);
            },
            error: function (xhr, status, error) {
                console.error(error);
            }
        });
        _seenMessageUserId(userId)
    }

    function _seenMessageUserId(userId) {
        $.ajax({
            type: "POST",
            url: "/message/updateSeen",
            data: $.param({ userId: userId }),
            contentType: "application/x-www-form-urlencoded",
        });
    }

    function _loadMessage() {
        $.ajax({
            type: "POST",
            url: "/message/getAllUser",
            contentType: "application/json",
            success: function (response) {
                console.log(response)
                $('.container-message').empty();
                response.forEach(function (message) {
                    let addClassMsgNew = message.seen === false ? 'message-new' : ''
                    const messageDiv = $('<div>', {
                        class: `item-message ${addClassMsgNew}`,
                        'data-userId': message.userId
                    }).html(`<span class="item-title">Tin nhắn từ</span><br/><span>${message.userId}</span>`);
                    $('.container-message').append(messageDiv);
                });
            },
            error: function (xhr, status, error) {
                console.error(error);
            }
        });
    }


    function _sendMessage() {
        if (volume) sendMsg.play()
        const message = $('#value-message').val();
        if (message.length < 1 || userIdCurrent.length < 1) {
            alert('Nhập tin nhắn hoặc chọn 1 người để nhắn')
            $('#value-message').val('')
            return
        }
        console.log(message)
        console.log('userIdCurrent ', userIdCurrent)
        socket.emit('message', {
            message,
            userId: userIdCurrent,
        });
        const div = `<div class="item-show-message item-show-message-me float-right"><span>${message}</span></div>`
        $('.show-message-user').append(div);
        $('.show-message-user').scrollTop($('.show-message-user')[0].scrollHeight);
        $('#value-message').val('');
    }
});
