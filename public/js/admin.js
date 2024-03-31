$(document).ready(function () {
    checkLogin()
    $('#btn-login').on('click', () => {
        let username = $('#username').val()
        let password = $('#password').val()
        _apiLogin(username, password)
    })
    function checkLogin() {
        let username = localStorage.getItem('username')
        let password = localStorage.getItem('password')

        if (username && password) return _apiLogin(username, password)
        $('#dialog_login').modal('show');
    }

    function _apiLogin(username, password) {
        if (username.length < 1 || password.length < 1) return alert('Tài khoản hoặc mật khẩu quá ngắn !');
        $.ajax({
            type: "POST",
            url: "/message/login",
            data: { username, password },
            success: function (res) {
                if (res == true) {
                    $('#dialog_login').modal('hide')
                    localStorage.setItem('username', username)
                    localStorage.setItem('password', password)
                    start()
                } else {
                    alert('Tài khoản hoặc mật khẩu sai !');
                    $('#dialog_login').modal('show')
                    localStorage.removeItem('username');
                    localStorage.removeItem('password');
                }
            },
            error: function (error) {
                console.log(error)
                $('#dialog_login').modal('show')
            }
        })
    }

    function start() {
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
            const username = localStorage.getItem('username')
            const password = localStorage.getItem('password')
            console.log(username, password)
            $.ajax({
                type: "POST",
                url: "/message/getAllUser",
                data: { username: username, password: password },
                success: function (response) {
                    console.log(response)
                    $('#dialog_login').modal('hide')
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
                error: function (error) {
                    console.error(error);
                    alert('Vui lòng đăng nhập lại')
                    $('#dialog_login').modal('hide')
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
    }
});
