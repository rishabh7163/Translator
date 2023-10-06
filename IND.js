const WebSocket = require('ws');

const socket = new WebSocket('ws://localhost:3000/ind');

socket.onopen = function(event) {
  console.log('WebSocket connection for User IND established.');
};

socket.onmessage = function(event) {
  const message = JSON.parse(event.data);
  displayMessage(message.sender, message.content);
};

function sendMessageIND() {
  const user = 'IND';
  const message = document.getElementById('message').value;

  const data = {
    sender: user,
    content: message
  };

  socket.send(JSON.stringify(data));

  displayMessage(user, message);

  document.getElementById('message').value = '';
}

function displayMessage(sender, content) {
  const messageContainer = document.getElementById('message-container');
  const messageElement = document.createElement('div');
  messageElement.innerText = sender + ': ' + content;
  messageContainer.appendChild(messageElement);
}
