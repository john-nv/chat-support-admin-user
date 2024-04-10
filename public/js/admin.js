$(document).ready(function () {
    let HOST = ""
    // HOST = "http://live.wynncasino.top"
    _apiVeriAccount()
    $('#btn-login').on('click', async () => {
        let username = $('#username').val()
        let password = $('#password').val()
        await _apiLogin(username, password)
    })

    async function _apiLogin(username, password) {
        if (username.length < 1 || password.length < 1) return alert('Tài khoản hoặc mật khẩu quá ngắn !');
        $.ajax({
            type: "POST",
            url: "/account/login",
            data: { username, password },
            success: function (res) {
                if (res.code) {
                    // $('#dialog_login').remove()
                    $('#dialog_login').modal('hide')
                    localStorage.setItem('token', res.token)
                    start()
                } else {
                    localStorage.removeItem('token');
                    alert(res.message);
                    $('#dialog_login').modal('show')
                }
            },
            error: function (error) {
                console.log(error)
                $('#dialog_login').modal('show')
            }
        })
    }

    async function _apiVeriAccount() {
        $("#dialog_login").modal("show")
        $("#dialog_login").modal("hide")
        const token = localStorage.getItem('token')
        if (!token || token.length < 10) {
            localStorage.removeItem('token')
            $('#dialog_login').modal('show')
            console.log('Không có token hoặc token ảo')
            return
        }
        $.ajax({
            type: "POST",
            url: "/account/verify",
            data: { token },
            success: function (res) {
                if (!res.expired) {
                    // $('#dialog_login').remove()
                    $('#dialog_login').modal('hide')
                    start()
                } else {
                    alert(res.message);
                    $('#dialog_login').modal('show')
                    localStorage.removeItem('token');
                }
            },
            error: function (error) {
                console.log(error)
                $('#dialog_login').modal('show')
            }
        })
    }

    function start() {
        const socket = io(HOST, { path: "/admin" });
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
                $('.show-message-user').append(sendMessageYou(message, true));
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
            const username = $(this).data('username');
            $('.userNameCurrent').text(`Chat với ${username}`);
            userIdCurrent = userId
            console.log(`=> ${userId}`)
            console.log(`=> ${username}`)
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
                    response = response.messages
                    $('.show-message-user').html('')
                    for (let i = 0; i < response.length; i++) {
                        // let setClass = (response[i].who == 'admin') ? 'item-show-message-me float-right' : 'item-show-message-you float-left'
                        // const div = `<div class="item-show-message ${setClass}"><span>${response[i].message}</span></div>`
                        let div = response[i].who == 'admin' ? sendMessageMe(response[i].message, response[i].createdAt) : sendMessageYou(response[i].message, response[i].createdAt)
                        $('.show-message-user').prepend(div);
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
            const token = localStorage.getItem('token')
            $.ajax({
                type: "POST",
                url: "/message/getAllUser",
                data: { token },
                success: function (response) {
                    console.log(response)
                    $('#dialog_login').modal('hide')
                    $('.container-message').empty();
                    response.forEach(function (message) {
                        let addClassMsgNew = message.seen === false ? 'message-new' : ''
                        const messageDiv = $('<div>', {
                            class: `item-message ${addClassMsgNew}`,
                            'data-userId': message.userId,
                            'data-username': message.username,
                        }).html(`<span class="item-title">Tin nhắn từ</span><br/><span>${message.username}</span>`);
                        $('.container-message').append(messageDiv);
                    });
                },
                error: function (error) {
                    console.error(error);
                    alert('Vui lòng đăng nhập lại')
                    $('#dialog_login').modal('show')
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
            // const div = `<div class="item-show-message item-show-message-me float-right"><span>${message}</span></div>`
            $('.show-message-user').append(sendMessageMe(message, true));
            $('.show-message-user').scrollTop($('.show-message-user')[0].scrollHeight);
            $('#value-message').val('');
        }

        $('.setMsgWelcome').on('click', () => {
            let msg = $('.valueMsgWelcome').val()
            let token = localStorage.getItem('token')
            $.ajax({
                type: "POST",
                url: "/message/setConfig",
                data: $.param({ msgWelcome: msg, token }),
                contentType: "application/x-www-form-urlencoded",
                success: function (response) {
                    alert(response.message)
                },
                error: function (xhr, status, error) {
                    console.error(error);
                }
            });
        })

        $.ajax({
            type: "POST",
            url: "/message/getConfig",
            contentType: "application/x-www-form-urlencoded",
            success: function (response) {
                console.log(response)
                $('.valueMsgWelcome').val(response.msgWelcome)
            }
        });
    }
});

function sendMessageYou(content, time) {
    time = time == true ? getCurrentTimeHHMMVietnam() : convertTimeToHHMMVietnam(time)
    return `<div class="item-show-message item-show-message-you float-left">
                <div class="item-show-message-you-avt"><img src="./img/me.svg" height="40" width="40"></div>
                <p>${content}</p>
                <span>${time}</span>
            </div>`
}

function sendMessageMe(content, time) {
    time = time == true ? getCurrentTimeHHMMVietnam() : convertTimeToHHMMVietnam(time)
    return `<div class="item-show-message item-show-message-me float-right">
                <span>${time}</span>
                <p>${content}</p>
                <div class="item-show-message-me-avt"><img src="./img/you.svg" height="40" width="40"></div>
            </div>`
}

function convertTimeToHHMMVietnam(originalTimeStr) {
    var originalTime = moment(originalTimeStr);
    originalTime.utcOffset('+07:00');
    var formattedTime = originalTime.format('HH:mm');
    return formattedTime;
}

function getCurrentTimeHHMMVietnam() {
    var currentTime = moment();
    currentTime.utcOffset('+07:00');
    var formattedTime = currentTime.format('HH:mm');
    return formattedTime;
}