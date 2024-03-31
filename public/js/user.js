$(document).ready(function () {
    // const HOST = "http://live.wynncasino.top"
    const HOST = ""
    const socket = io(HOST, { path: "/user" });
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
                    $('.show-message-user').append(`<div class="item-show-message item-show-message-you float-left"><span>${msgWelcome}</span></div>`)
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


let msgWelcome = `- Để kỷ niệm 10 năm thành lập công ty, nhằm tri ân người dùng cũ và mới, công ty hiện đang triển khai hoạt động phần thưởng khi nạp tiền và đăng ký người dùng mới để nhận phần thưởng lì xì đỏ 10$. Hãy tham khảo dịch vụ khách hàng trực tuyến " SỰ KIỆN NHẬN LÌ XÌ ĐỎ " để nhận thưởng.
<br/><br/>
- Các hoạt động phần thưởng khi tài khoản hội viên tích lũy nạp tiền:
<br/><br/>
- Tích lũy nạp đủ 100.000.000VND (4081 đô la Mỹ) quý khách hàng sẽ nhận được phần thưởng là được cộng thêm 10.000.000VND (408 đô la Mỹ).
<br/><br/>
- Tích lũy nạp đủ 300.000.000VND (12245 đô la Mỹ) quý khách hàng sẽ nhận được phần thưởng là được cộng thêm 35.000.000VND (1428 đô la Mỹ).
<br/><br/>
- Tích lũy nạp đủ 500.000.000VND (20408 đô la Mỹ) quý khách hàng sẽ nhận được phần thưởng là được cộng thêm 60.000.000VND (2449 đô la Mỹ).
<br/><br/>
- Tích lũy nạp đủ 1.000.000.000VND (40816 đô la Mỹ) quý khách hàng sẽ nhận được phần thưởng là được cộng thêm 150.000.000VND (6122 đô la Mỹ), 1 phần quà Apple Watch trị giá 1000$.
<br/><br/>
- Tích lũy nạp đủ 3.000.000.000VND (122449 đô la Mỹ) quý khách hàng sẽ nhận được phần thưởng là được cộng thêm 300.000.000VND (12245 đô la Mỹ), WynnCasino xin gửi đến quý khách phần quà là 1 chiếc điện thoại iPhone 15 Pro Max 256GB trị giá 1400$.
<br/><br/>
- Tất cả các hoạt động phần thưởng nạp tích lũy quý khách hàng có thể rút về tài khoản, số tiền nạp càng cao phúc lợi càng lớn. Xin liên hệ bộ phận chăm sóc khách hàng để được hỗ trợ.
<br/><br/>
- Đặc biệt lưu ý: Mỗi tài khoản chỉ được tham gia 1 lần trong mỗi giai đoạn nhận thưởng của hoạt động nạp tiền tích lũy.<br/>
- Tỉ giá hối đoái 1$ = 24.500VND.<br/>
- Khoản tiền nạp tối thiểu là 100$.<br/>
Thời gian hoạt động được áp dụng từ 00:00 ngày 01/03/2024 đến 00:00 ngày 31/03/2024!`