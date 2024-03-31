$(document).ready(function () {
    const HOST = "http://localhost:7892"
    const socket = io({ path: `${HOST}/user` });
    const newMsg = new Audio('./voice/newMsg.mp3');
    const sendMsg = new Audio('./voice/sendMsg.mp3');
    let volume = localStorage.getItem('volumeSetting') === 'true';

    $('.volume i').toggleClass('fa-volume-high', volume).toggleClass('fa-volume-xmark', !volume);
    $('.volume').click(function () {
        var icon = $(this).find('i');
        volume = !volume;
        localStorage.setItem('volumeSetting', volume);
        icon.toggleClass('fa-volume-high', volume).toggleClass('fa-volume-xmark', !volume);
    });

    socket.on('connect', async () => {
        console.info(`socket.id ${socket.id}`);
        const socketId = localStorage.getItem('socketId');

        if (socketId) {
            socket.userId = socketId;
            await _loadMessageUser(socket.userId)
        } else {
            socket.userId = `${_generateUserId()}`;
            localStorage.setItem('socketId', socket.userId);
        }

        console.info(`socket.userId ${socket.userId}`);
        socket.emit('init', { userId: socket.userId, socketId: socket.id });
    });

    socket.on('message', (payload) => {
        $('.show-message-user').append(`<div class="item-show-message item-show-message-you float-left"><span>${payload.message}</span></div>`);
        console.log(payload)
        if (volume) newMsg.play()
        $('.show-message-user').scrollTop($('.show-message-user')[0].scrollHeight);
    });

    $('#send-message').on('click', () => { _sendMessage() });

    $('#value-message').on('keypress', function (event) {
        if (event.which === 13 && !event.shiftKey) {
            _sendMessage();
        }
    });
    function _sendMessage() {
        const message = $('#value-message').val();
        console.log(message)
        if (message.length < 1) return;

        $('.show-message-user').append(`<div class="item-show-message item-show-message-me float-right"><span>${message}</span></div>`);

        socket.emit('message', {
            socketId: socket.id,
            userId: socket.userId,
            message,
        });
        if (volume) sendMsg.play()
        $('#value-message').val("");
        $('.show-message-user').scrollTop($('.show-message-user')[0].scrollHeight);
    }

    function _generateUserId() {
        return 'user_' + Math.random().toString(36).substring(6);
    }

    async function _loadMessageUser(userId) {
        try {
            $.ajax({
                type: "POST",
                url: "/message/getOne",
                data: $.param({ userId: userId }),
                contentType: "application/x-www-form-urlencoded",
                success: function (response) {
                    console.log(response)
                    $('.show-message-user').html('')
                    console.log(response)
                    for (let i = 0; i < response.length; i++) {
                        let addClassWho = response[i].who == 'admin' ? 'item-show-message-you float-left' : 'item-show-message-me float-right'
                        $('.show-message-user').append(`<div class="item-show-message ${addClassWho}"><span>${response[i].message}</span></div>`)
                    }
                    $('.show-message-user').scrollTop($('.show-message-user')[0].scrollHeight);
                    console.log($('.show-message-user').height());

                },
                error: function (xhr, status, error) {
                    console.error(error);
                }
            });
        } catch (error) {
            console.log(error)
            console.log(error.message)
        }
    }
});
