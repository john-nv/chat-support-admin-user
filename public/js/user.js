$(document).ready(async () => {
    let HOST = ""
    // let page = 1
    // let pageSize = 5
    // HOST = "http://live.wynncasino.top"
    let msgReply = 0
    const socket = io(HOST, { path: "/user" });
    const newMsg = new Audio('./voice/newMsg.mp3');
    const sendMsg = new Audio('./voice/sendMsg.mp3');
    let volume = localStorage.getItem('volumeSetting') === 'true';
    let msgWelcome = 'Chào bạn'
    getConfig()

    $('.volume i').toggleClass('fa-volume-high', volume).toggleClass('fa-volume-xmark', !volume);
    $('.volume').click(function () {
        var icon = $(this).find('i');
        volume = !volume;
        localStorage.setItem('volumeSetting', volume);
        icon.toggleClass('fa-volume-high', volume).toggleClass('fa-volume-xmark', !volume);
    });

    function getConfig() {
        $.ajax({
            type: "POST",
            url: "/message/getConfig",
            success: function (response) {
                console.log(response.msgWelcome)
                msgWelcome = response.msgWelcome
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

    socket.on('connect', async () => {
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
        $('.show-message-user').append(sendMessageYou(payload.message, true));
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

        $('.show-message-user').append(sendMessageMe(message, true));

        socket.emit('message', {
            socketId: socket.id,
            userId: socket.userId,
            message,
        });
        if (volume) sendMsg.play()
        $('#value-message').val("");

        if (msgReply < 1) {
            msgReply++
            $('.show-message-user').append(sendMessageYou("Vui lòng đợi một lát, chúng tôi sẽ liên hệ lại bạn ngay !!!", true));
        }
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
                    if (response.user == 0) {
                        localStorage.removeItem('userName')
                        localStorage.removeItem('socketId')
                        location.reload()
                    }
                    if (response.messages) response = response.messages
                    $('.show-message-user').html('')
                    console.log(response.length)
                    for (let i = 0; i < response.length; i++) {
                        let div = response[i].who == 'admin' ? sendMessageYou(response[i].message, response[i].createdAt) : sendMessageMe(response[i].message, response[i].createdAt)
                        $('.show-message-user').prepend(div)
                    }
                    $('.show-message-user').append(sendMessageWelcome(msgWelcome))
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

    // async function _loadMessageUserOld(userId, page = 1, pageSize) {
    //     try {
    //         $.ajax({
    //             type: "POST",
    //             url: "/message/getOne",
    //             data: $.param({ userId, page, pageSize }),
    //             contentType: "application/x-www-form-urlencoded",
    //             success: function (response) {
    //                 console.log(response)
    //                 page = response.length === pageSize ? page++ : null
    //                 response = response.messages
    //                 for (let i = 0; i < response.length; i++) {
    //                     let addClassWho = response[i].who == 'admin' ? 'item-show-message-you float-left' : 'item-show-message-me float-right'
    //                     $('.show-message-user').prepend(`<div class="item-show-message ${addClassWho}"><span>${response[i].message}</span></div>`)
    //                 }
    //             },
    //             error: function (xhr, status, error) {
    //                 console.error(error);
    //             }
    //         });
    //     } catch (error) {
    //         console.log(error)
    //         console.log(error.message)
    //     }
    // }

    // $('.show-message-user').on('scroll', async function () {
    //     let scrollTop = $(this).scrollTop();
    //     if (scrollTop === 0 && page) {
    //         console.log('Tải tin nhắn mới');
    //         let userId = localStorage.getItem('userId');
    //         await _loadMessageUserOld(userId, page);
    //     }
    // });

});

function sendMessageYou(content, time) {
    time = time == true ? getCurrentTimeHHMMVietnam() : convertTimeToHHMMVietnam(time)
    return `<div class="item-show-message item-show-message-you float-left">
                <div class="item-show-message-you-avt"><img src="./img/you.svg" height="40" width="40"></div>
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
                <div class="item-show-message-you-avt"><img src="./img/you.svg" height="40" width="40"></div>
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