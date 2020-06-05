let errorCounter = true;
let username;
let presentChannel;
let previusUser;
let userColor;
let userPresent = false;

if (localStorage.getItem('username')) {
    username = localStorage.getItem('username');
}

if (localStorage.getItem('presentChannel')) {
    presentChannel = localStorage.getItem('presentChannel');
}
else {
    localStorage.setItem('presentChannel', 'general');
    presentChannel = 'general';
}

if (localStorage.getItem('userColor')) {
    userColor = localStorage.getItem('userColor');
}

document.addEventListener('DOMContentLoaded', () => {
    document.querySelector(`[data-channel*="${presentChannel}"]`).classList.add('active');
    if (!username) {
        $('#myModal').modal({
            backdrop: 'static',
            keyboard: false
        });
        document.querySelector('#username-button').onclick = () => {
            getUsername();
        }
    }
    else {
        document.querySelector('.user').innerHTML = username;
        document.querySelector('#channelUser').style.color = userColor;
        loadChannel(presentChannel);
    }
    var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);
    socket.on('connect', () => {
        document.querySelector('#message-send').onclick = () => {
            const newMessage = document.querySelector('#message-send-text').value;
            document.querySelector('#message-send-text').value = '';

            if (newMessage.length > 0) {
                socket.emit('user message', { 'user': username, 'channel': presentChannel, 'date': getDate(), 'message': newMessage });
            }
        }

        document.querySelectorAll('.channel').forEach(link => {
            link.onclick = () => {
                if (presentChannel !== link.dataset.channel) {
                    presentChannel = link.dataset.channel;
                    localStorage.setItem('presentChannel', presentChannel);
                    elements = document.querySelector('.messages-container');
                    while (elements.lastElementChild) {
                        elements.removeChild(elements.lastElementChild);
                    }
                    document.querySelector('.active').classList.remove('active');
                    link.classList.add('active');
                    loadChannel(presentChannel);
                }
            }
        })
        document.querySelector('#new-channel').onclick = () => {
            let channelName = document.querySelector('#new-channel-name').value;
            document.querySelector('#new-channel-name').value = '';
            if (channelName.length > 0) {
                socket.emit('new channel', { 'channel': channelName })
            }
        }

        var input = document.querySelector('#message-send-text');

        // Execute a function when the user releases a key on the keyboard
        input.addEventListener("keyup", function (event) {
            // Number 13 is the "Enter" key on the keyboard
            if (event.keyCode === 13) {
                // Cancel the default action, if needed
                event.preventDefault();
                // Trigger the button element with a click
                document.querySelector('#message-send').click();
            }
        });

        document.querySelector('#open-sidebar').onclick = () => {
            console.log('clicked');
            console.log(document.querySelector(".sidebar").style.width === '60%')
            if (document.querySelector(".sidebar").style.width === '60%') {
                closeNav();
            }
            else {
                openNav();
            }
        };


        function openNav() {
            document.querySelector(".sidebar").style.width = "60%";
            document.querySelector(".main").style.marginLeft = "60%";
            setTimeout(() => {
                console.log('block');
                document.querySelector(".sidebar-container").style.display = "block"
            }, 500);
        }

        /* Set the width of the sidebar to 0 and the left margin of the page content to 0 */
        function closeNav() {
            document.querySelector(".sidebar").style.width = "0";
            document.querySelector(".main").style.marginLeft = "0";
            document.querySelector(".sidebar-container").style.display = "none";
        }
    })

    function loadChannel(channel) {
        previusUser = '';

        const request = new XMLHttpRequest();
        request.open('POST', '/openChannel');

        request.onload = () => {
            let data = JSON.parse(request.responseText);
            data = data[channel];
            if (!isEmpty(data)) {
                data.forEach(test => {
                    if (test.type === 'online') {
                        add_online(test.data.name, test.data.date, test.data.color);
                    }
                    else {
                        add_message(test.data.name, test.data.message, test.data.date, test.data.color);
                    }
                })
            }
            socket.emit('user online', { 'user': username, 'channel': presentChannel, 'date': getDate() });

        }

        const data = new FormData();
        data.append('channel', presentChannel);

        request.send(data);
        return false;
    }

    socket.on('new user', input => {
        var a = document.createElement('a');
        a.className = 'online';
        a.innerHTML = input.username;
        a.dataset.name = input.username;
        a.style.color = input.color;
        document.querySelector('.users-container').append(a);
    })

    socket.on('user is online', input => {
        if (input.channel === presentChannel) {
            add_online(input.data.name, input.data.date, input.data.color);
        }
    })

    socket.on('user post message', input => {
        if (input.channel === presentChannel) {
            add_message(input.data.name, input.data.message, input.data.date, input.data.color);
        }
    })

    socket.on('add new channel', input => {
        addNewChannel(input);
    })

    function addNewChannel(channelName) {
        const newChannel = document.createElement('a');
        newChannel.className = 'channel';
        newChannel.innerHTML = '#' + channelName;
        newChannel.dataset.channel = channelName;
        newChannel.href = '#';
        newChannel.onclick = () => {
            if (presentChannel !== newChannel.dataset.channel) {
                presentChannel = newChannel.dataset.channel;
                localStorage.setItem('presentChannel', presentChannel)
                elements = document.querySelector('.messages-container');
                while (elements.lastElementChild) {
                    elements.removeChild(elements.lastElementChild);
                }
                document.querySelector('.active').classList.remove('active');
                newChannel.classList.add('active');
                loadChannel(presentChannel);
            }
        }
        document.querySelector('.channel-container').append(newChannel);
    }

    function getUsername() {
        username = document.querySelector('#username').value;
        const request = new XMLHttpRequest();
        request.open('POST', '/checkExistingUsername');
        request.onload = () => {
            let data = JSON.parse(request.responseText);
            data = data['exists'];
            if (data) {
                if (!document.querySelector('.no-username')) {
                    const errorMessage = document.createElement('p');
                    errorMessage.innerHTML = 'Username already exists.';
                    errorMessage.className = "no-username"
                    document.querySelector('#username').style.border = '1px solid red';
                    errorMessage.style.margin = '0';
                    errorMessage.style.fontSize = '12px';
                    errorMessage.style.textAlign = 'left';
                    document.querySelector('.int').append(errorMessage);
                }
                else {
                    document.querySelector('.no-username').innerHTML = 'Username already exists.';
                }
            }
            else if (username.length > 0) {
                $('#myModal').modal('hide');
                document.querySelector('#myModal').remove();
                document.querySelector('.user').innerHTML = username;
                localStorage.setItem('username', username);
                loadChannel(presentChannel);
            }
            else {
                if (!document.querySelector('.no-username')) {
                    const errorMessage = document.createElement('p');
                    errorMessage.innerHTML = 'No username entered.';
                    errorMessage.className = "no-username"
                    document.querySelector('#username').style.border = '1px solid red';
                    errorMessage.style.margin = '0';
                    errorMessage.style.fontSize = '12px';
                    errorMessage.style.textAlign = 'left';
                    document.querySelector('.int').append(errorMessage);
                    errorCounter = false;
                }
                else {
                    document.querySelector('.no-username').innerHTML = 'No username entered.';
                }
            }
        }
        const data = new FormData();
        data.append('name', username);

        request.send(data);
        return false;
    }

    const online_template = Handlebars.compile(document.querySelector('#user-online').innerHTML)
    function add_online(name, date, color) {

        var dateOfMessage = date || getDate();
        previusUser = '';
        if (!userColor && username === name) {
            userColor = color;
            localStorage.setItem('userColor', userColor);
            document.querySelector('#channelUser').style.color = color;
            socket.emit('user status', { 'username': username, 'color': color });
        }

        // Create new post.
        const online = online_template({ 'user': name, 'date': dateOfMessage, 'color': color });
        // Add post to DOM.
        document.querySelector('.messages-container').innerHTML += online;

        scrollToBottom();
    };

    const message_template = Handlebars.compile(document.querySelector('#user-message').innerHTML)
    function add_message(name, message, date, color) {
        var dateOfMessage = date || getDate();
        if (previusUser === name) {
            const userMessage = document.createElement('p');
            userMessage.innerHTML = message;
            userMessage.className = 'message';
            userMessage.style.marginBottom = '0';
            let x = document.querySelectorAll('.message-bottom');
            x = x[x.length - 1];
            x.append(userMessage);
        }
        else {
            const userMessage = message_template({ 'user': name, 'date': dateOfMessage, 'message': message, 'color': color })
            document.querySelector('.messages-container').innerHTML += userMessage;
            previusUser = name;
        }
        scrollToBottom();
    }

    function getDate() {
        var date = new Date();
        var dateToday = `${date.getMonth() + 1}-${date.getDate()}-${date.getFullYear()}`;
        return dateToday;
    }

    function scrollToBottom() {
        var elem = document.querySelector('.messages-container');
        elem.scrollTop = elem.scrollHeight;
    }

    function isEmpty(obj) {
        for (var key in obj) {
            if (obj.hasOwnProperty(key))
                return false;
        }
        return true;
    }
});

