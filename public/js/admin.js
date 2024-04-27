$(document).ready(function() {
    let HOST = ""
    HOST = "http://live.wynncasino.top"
        // HOST = "http://localhost:7892"
    _apiVeriAccount()
    $('#btn-login').on('click', async() => {
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
            success: function(res) {
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
            error: function(error) {
                console.log(error)
                $('#dialog_login').modal('show')
            }
        })
    }

    async function _apiVeriAccount() {
        // $("#dialog_login").modal("show")
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
            success: function(res) {
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
            error: function(error) {
                console.log(error)
                $('#dialog_login').modal('show')
            }
        })
    }

    // function showMessageCurrent() {
    //     const message_current_id = localStorage.getItem('message_current')
    //     var elementToClick = document.querySelector(`.item-message[data-userid="${message_current_id}"]`);
    //     if (elementToClick) {
    //         elementToClick.click();
    //     } else {
    //         console.log('message current not found');
    //     }

    // }

    function start() {
        const socket = io(HOST, { path: "/admin" });
        const newMsg = new Audio('./voice/newMsg.mp3');
        const sendMsg = new Audio('./voice/sendMsg.mp3');
        let userIdCurrent = ''

        let volumeSetting_admin = localStorage.getItem('volumeSetting_admin');

        if (volumeSetting_admin !== 'true' && volumeSetting_admin !== 'false') {
            localStorage.setItem('volumeSetting_admin', 'true');
            console.log(localStorage.getItem('volumeSetting_admin'));
        }

        let volume = localStorage.getItem('volumeSetting_admin') === 'true';
        _loadMessage()

        $('.volume i').toggleClass('fa-volume-high', volume).toggleClass('fa-volume-xmark', !volume);
        $('.volume').click(function() {
            var icon = $(this).find('i');
            volume = !volume;
            localStorage.setItem('volumeSetting_admin', volume);
            icon.toggleClass('fa-volume-high', volume).toggleClass('fa-volume-xmark', !volume);
        });

        socket.on('connect', () => {
            console.info(`${socket.id}`);
        });

        socket.on('message', (payload) => {
            const { userId, socketId, message, userName, nameFile } = payload;
            console.log(payload)
            const existingMessageDiv = $(`.container-message .item-message[data-userId="${userId}"][data-username="${userName}"]`);


            if (volume) newMsg.play()
            let addClassMsgNew = 'message-new';
            if (userIdCurrent == userId) {
                addClassMsgNew = '';
                _seenMessageUserId(userId)
                if (nameFile) {
                    $('.show-message-user').append(sendMessageYouImg(`${HOST}/images/${nameFile}`, true));
                } else {
                    $('.show-message-user').append(sendMessageYou(message, true));
                }
                $('.show-message-user').scrollTop($('.show-message-user')[0].scrollHeight);
            }

            if (existingMessageDiv.length > 0) {
                existingMessageDiv.prependTo('.container-message').addClass(addClassMsgNew)
            } else {
                const messageDiv = $('<div>', {
                    class: `item-message ${addClassMsgNew}`,
                    'data-userId': userId,
                    'data-username': userName
                }).html(`<span class="item-title">Tin nhắn từ</span><br/><span>${userName}</span>`);

                $('.container-message').eq(0).prepend(messageDiv);
            }
        });

        socket.on('ALERT_UPDATE_USERNAME', (msg) => {
            alert(msg)
        });

        socket.on('ALERT_NOTIFI', payload => {
            alert(payload.message)
        });

        // send image
        $('.show-image-container').hide()

        $('.btn-img').on('click', () => {
            $('#input-image').click()
        });

        $('#input-image').on('change', function() {
            if (this.files && this.files[0]) {
                $('.show-image-container').show()
                var reader = new FileReader();

                reader.onload = function(e) {
                    $('#show-image').attr('src', e.target.result);
                }
                reader.readAsDataURL(this.files[0]);
            }
        });

        $('.close-image').on('click', function() {
            _closeImage()
        });

        function _closeImage() {
            $('#show-image').removeAttr('src');
            $('#input-image').val('');
            $('.show-image-container').hide()
        }

        function _sendImage() {
            var imageData = $('#show-image').attr('src');
            if (imageData && imageData.indexOf('data:image') === 0) {
                const imageName = `ADMIN_${userIdCurrent}_${Date.now()}.jpg`;

                _closeImage()
                console.log('IMG SEND !');
                socket.emit('SEND_IMAGE', {
                    message: imageData,
                    nameFile: imageName,
                    userId: userIdCurrent,
                })

                $('.show-message-user').append(sendMessageMeImg(imageData, true));
                $('.show-message-user').scrollTop($('.show-message-user')[0].scrollHeight);
            }
        }

        $('.changeUsername').on('click', () => {
            const userId = $('.userIdChange').val().trim()
            const userNameChange = $('.userNameChange').val().trim()
            if (userId.length < 3 || userNameChange.length < 1) return alert('Vui lòng kiểm tra lại')
            socket.emit('changeUsernameUser', { userId, userNameChange })

            var elementUpdate = document.querySelector(`.item-message[data-userid="${userId}"]`);
            elementUpdate.dataset.username = userNameChange;
            spans = elementUpdate.querySelectorAll('span');
            spans[1].textContent = userNameChange;

            $('.userIdChange').val('')
            $('.userNameChange').val('')
        })

        $(document).on('click', '.item-message', function() {
            $('.item-message').removeClass('message-active');
            $(this).addClass('message-active');
            if ($(this).hasClass('message-new')) $(this).removeClass('message-new')
            const userId = $(this).data('userid');
            // const username = $(this).data('username');
            userIdCurrent = userId
            console.log(`=> ${userId}`)
                // console.log(`=> ${username}`)
            localStorage.setItem('message_current', userId)
            _loadMessageOneUser(userId)
        });

        $('#send-message').on('click', () => { _sendMessage() });

        $('#value-message').on('keypress', function(event) {
            if (event.which === 13 && !event.shiftKey) {
                _sendMessage();
            }
        });

        $('.delete-all-users').on('click', () => {
            socket.emit('delete-all-users')
            location.reload()
        });

        // medium zoom
        $(document).on('click', '.zoomable-image', function() {
            var imageElement = this;
            if (!$(imageElement).data('medium-zoomed')) {
                mediumZoom(imageElement);
                $(imageElement).data('medium-zoomed', true);
            }
        });

        function _loadMessageOneUser(userId) {
            $.ajax({
                type: "POST",
                url: "/message/getOne",
                data: $.param({ userId: userId }),
                contentType: "application/x-www-form-urlencoded",
                success: function(response) {
                    console.log(response)
                    $('.userNameCurrent').text(`${response.userName} | ${response.userId}`);
                    response = response.messages
                    $('.show-message-user').html('')
                    for (let i = 0; i < response.length; i++) {
                        let div = ''
                        if (response[i].message.includes('.jpg')) {
                            div = response[i].who == 'admin' ?
                                sendMessageMeImg(`${HOST}/images/${response[i].message}`, response[i].createdAt) :
                                sendMessageYouImg(`${HOST}/images/${response[i].message}`, response[i].createdAt)
                        } else {
                            div = response[i].who == 'admin' ?
                                sendMessageMe(response[i].message, response[i].createdAt) :
                                sendMessageYou(response[i].message, response[i].createdAt)
                        }
                        $('.show-message-user').prepend(div);
                    }
                    $('.show-message-user').scrollTop($('.show-message-user')[0].scrollHeight);
                },
                error: function(xhr, status, error) {
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
                success: function(response) {
                    console.log(response)
                    $('#dialog_login').modal('hide')
                    $('.container-message').empty();
                    response.forEach(function(message) {
                        let addClassMsgNew = message.seen === false ? 'message-new' : ''
                        const messageDiv = $('<div>', {
                            class: `item-message ${addClassMsgNew}`,
                            'data-userId': message.userId,
                            'data-username': message.username,
                        }).html(`<span class="item-title">Tin nhắn từ</span><br/><span>${message.username}</span>`);
                        $('.container-message').append(messageDiv);
                    });

                    // showMessageCurrent()
                },
                error: function(error) {
                    console.error(error);
                    alert('Vui lòng đăng nhập lại')
                    $('#dialog_login').modal('show')
                }
            });
        }

        function _sendMessage() {
            _sendImage()
            if (volume) sendMsg.play()
            const message = $('#value-message').val();
            if (message.length < 1 || userIdCurrent.length < 1) {
                // alert('Nhập tin nhắn hoặc chọn 1 người để nhắn')
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
            let valueMsgWelcome = $('.valueMsgWelcome').val()
            let valueMsgReply = $('.valueMsgReply').val()
            let token = localStorage.getItem('token')
            $.ajax({
                type: "POST",
                url: "/message/setConfig",
                data: $.param({ msgWelcome: valueMsgWelcome, msgReply: valueMsgReply, token }),
                contentType: "application/x-www-form-urlencoded",
                success: function(response) {
                    alert(response.message)
                },
                error: function(xhr, status, error) {
                    console.error(error);
                }
            });
        })

        $.ajax({
            type: "POST",
            url: "/message/getConfig",
            contentType: "application/x-www-form-urlencoded",
            success: function(response) {
                console.log(response)
                $('.valueMsgWelcome').val(response.msgWelcome)
                $('.valueMsgReply').val(response.msgReply)
            }
        });

    }
});

function sendMessageYou(content, time) {
    time = time == true ? getCurrentTimeHHMMVietnam() : convertTimeToHHMMVietnam(time)
    return `<div class="item-show-message item-show-message-you float-left">
                <div class="item-show-message-you-avt"><img src="./img/logo-you.png" height="40" width="40"></div>
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

function sendMessageMeImg(url, time) {
    time = time == true ? getCurrentTimeHHMMVietnam() : convertTimeToHHMMVietnam(time)
    return `<div class="item-show-message item-show-message-me float-right">
                <span>${time}</span>
                <img class="zoomable-image" style="height: 100px; width: auto; border-radius: 3px;" src="${url}">
                <div class="item-show-message-me-avt"><img src="./img/me.svg" height="40" width="40"></div>
            </div>`
}

function sendMessageYouImg(url, time) {
    time = time == true ? getCurrentTimeHHMMVietnam() : convertTimeToHHMMVietnam(time)
    return `<div class="item-show-message item-show-message-you float-left">
                <div class="item-show-message-you-avt"><img src="./img/logo-you.png" height="40" width="40"></div>
                <img class="zoomable-image" style="height: 100px; width: auto; border-radius: 3px;" src="${url}">
                <span>${time}</span>
            </div>`
}