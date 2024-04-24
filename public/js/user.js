$(document).ready(async() => {
    let HOST = ""
        // let page = 1
        // let pageSize = 5
        // HOST = "http://live.wynncasino.top"
    HOST = "http://localhost:7892"
    let msgReplyCount = 0
    const socket = io(HOST, { path: "/user" });
    const newMsg = new Audio('./voice/newMsg.mp3');
    const sendMsg = new Audio('./voice/sendMsg.mp3');

    let volumeSetting = localStorage.getItem('volumeSetting');

    if (volumeSetting !== 'true' && volumeSetting !== 'false') {
        localStorage.setItem('volumeSetting', 'true');
        console.log(localStorage.getItem('volumeSetting'));
    }

    let volume = localStorage.getItem('volumeSetting') === 'true';
    let msgWelcome = 'Hello !'
    let msgReply = 'OK'
    getConfig()

    $('.volume i').toggleClass('fa-volume-high', volume).toggleClass('fa-volume-xmark', !volume);
    $('.volume').click(function() {
        var icon = $(this).find('i');
        volume = !volume;
        localStorage.setItem('volumeSetting', volume);
        icon.toggleClass('fa-volume-high', volume).toggleClass('fa-volume-xmark', !volume);
    });

    function getConfig() {
        $.ajax({
            type: "POST",
            url: "/message/getConfig",
            success: function(response) {
                console.log(response)
                msgWelcome = response.msgWelcome
                msgReply = response.msgReply
            }
        });
    }

    function showDialogName() {
        $('#dialog_username').modal('show')
    }

    $('#getUsername').on('click', () => {
        let username = $('#username').val()
        if (username.length < 3) return alert('Tên nhân vật quá ngắn')
        localStorage.setItem('userName', username)
        $('#dialog_username').modal('hide')
        socket.userName = username

        localStorage.setItem('socketId', socket.userId);
        $('.show-message-user').append(sendMessageWelcome(msgWelcome))
        $('.show-message-user').scrollTop($('.show-message-user')[0].scrollHeight);

        console.info(`socket.userId ${socket.userId}`);
        console.info(`socket.userName ${socket.userName}`);
        socket.emit('init', { userId: socket.userId, socketId: socket.id, userName: socket.userName });
    })

    socket.on('connect', async() => {
        console.info(`socket.id ${socket.id}`);
        const socketId = localStorage.getItem('socketId');
        const userName = localStorage.getItem('userName');

        if (socketId && userName) {
            socket.userId = socketId;
            socket.userName = userName;
            await _loadMessageUser(socket.userId);
        } else {
            if (!socketId) {
                socket.userId = _generateUserId()
            } else {
                socket.userId = socketId;
            }
            showDialogName()
            return
        }
        console.info(`socket.userId ${socket.userId}`);
        console.info(`socket.userName ${socket.userName}`);
        socket.emit('init', { userId: socket.userId, socketId: socket.id, userName: socket.userName });
    });

    socket.on('message', (payload) => {
        const { message, nameFile } = payload
        if (nameFile) {
            $('.show-message-user').append(sendMessageYouImg(`${HOST}/images/${nameFile}`, true));
        } else {
            $('.show-message-user').append(sendMessageYou(payload.message, true));
        }
        console.log(payload)
        if (volume) newMsg.play()
        $('.show-message-user').scrollTop($('.show-message-user')[0].scrollHeight);
    });

    socket.on('UPDATE_USERNAME', (payload) => {
        console.log('UPDATE_USERNAME : ', payload)
        const { userNameChange } = payload
        localStorage.setItem('userName', userNameChange)
    });

    socket.on('DELETE_ALL_USER', () => {
        location.reload()
    });

    $('#send-message').on('click', () => { _sendMessage() });

    $('#value-message').on('keypress', function(event) {
        if (event.which === 13 && !event.shiftKey) {
            _sendMessage();
        }
    });

    // medium zoom
    // mediumZoom($('#show-image').get(0));
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

    function _sendMessage() {
        _sendImage()
        const message = $('#value-message').val();
        console.log(message)
        const userName = localStorage.getItem('userName');
        if (message.length < 1) return;

        $('.show-message-user').append(sendMessageMe(message, true));

        socket.emit('message', {
            socketId: socket.id,
            userId: socket.userId,
            message,
            userName
        });
        if (volume) sendMsg.play()
        $('#value-message').val("");

        if (msgReplyCount < 1) {
            msgReplyCount++
            $('.show-message-user').append(sendMessageYou(msgReply, true));
        }
        $('.show-message-user').scrollTop($('.show-message-user')[0].scrollHeight);
    }

    function _closeImage() {
        $('#show-image').removeAttr('src');
        $('#input-image').val('');
        $('.show-image-container').hide()
    }

    function _sendImage() {
        var imageData = $('#show-image').attr('src');
        if (imageData && imageData.indexOf('data:image') === 0) {
            const userName = localStorage.getItem('userName')
            const socketId = localStorage.getItem('socketId')
            const imageName = `${socketId}_${Date.now()}.jpg`;

            _closeImage()
            console.log('IMG SEND !');
            socket.emit('SEND_IMAGE', {
                message: imageData,
                nameFile: imageName,
                userName: userName,
                socketId: socket.id,
                userId: socket.userId,
            })

            $('.show-message-user').append(sendMessageMeImg(imageData, true));
            $('.show-message-user').scrollTop($('.show-message-user')[0].scrollHeight);
        }
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
                success: function(response) {
                    if (response.user == 0) {
                        localStorage.removeItem('userName')
                        localStorage.removeItem('socketId')
                        location.reload()
                    }
                    console.log(response)
                    localStorage.setItem('userName', response.userName)
                    if (response.messages) response = response.messages
                    $('.show-message-user').html('')
                    console.log(response.length)
                    for (let i = 0; i < response.length; i++) {
                        let div = ''
                        if (response[i].message.includes('.jpg')) {
                            div = response[i].who == 'admin' ?
                                sendMessageYouImg(`${HOST}/images/${response[i].message}`, response[i].createdAt) :
                                sendMessageMeImg(`${HOST}/images/${response[i].message}`, response[i].createdAt)
                        } else {
                            div = response[i].who == 'admin' ?
                                sendMessageYou(response[i].message, response[i].createdAt) :
                                sendMessageMe(response[i].message, response[i].createdAt)
                        }
                        $('.show-message-user').prepend(div)
                    }
                    $('.show-message-user').append(sendMessageWelcome(msgWelcome))
                    $('.show-message-user').scrollTop($('.show-message-user')[0].scrollHeight);
                    console.log($('.show-message-user').height());

                },
                error: function(xhr, status, error) {
                    console.error(error);
                }
            });
        } catch (error) {
            console.log(error)
            console.log(error.message)
        }
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
                <div class="item-show-message-me-avt"><img src="./img/me.svg" height="40" width="40"></div>
            </div>`
}

function sendMessageWelcome(content) {
    content = content.replace(/\n/g, '<br/>');
    return `<div class="item-show-message item-show-message-you float-left">
                <div class="item-show-message-you-avt"><img src="./img/logo-you.png" height="40" width="40"></div>
                <p>${content}</p>
                <span>${getCurrentTimeHHMMVietnam()}</span>
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
                <img style="height: 100px; width: auto; border-radius: 10px;" src="${url}">
                <div class="item-show-message-me-avt"><img src="./img/me.svg" height="40" width="40"></div>
            </div>`
}

function sendMessageYouImg(url, time) {
    time = time == true ? getCurrentTimeHHMMVietnam() : convertTimeToHHMMVietnam(time)
    return `<div class="item-show-message item-show-message-you float-left">
                <div class="item-show-message-you-avt"><img src="./img/logo-you.png" height="40" width="40"></div>
                <img style="height: 100px; width: auto; border-radius: 10px;" src="${url}">
                <span>${time}</span>
            </div>`
}