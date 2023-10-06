const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');
const fetch = require('cross-fetch');

// Array to store messages
const messages = [];

// Create an HTTP server
const server = http.createServer((req, res) => {
  if (req.url === '/' || req.url === '/index.html') {
    const filePath = path.join(__dirname, 'index.html');
    fs.readFile(filePath, 'utf8', (err, content) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(content);
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Function to translate messages using libretranslate API
async function translateMessage(text, targetLanguage) {
  try {
    const response = await fetch('https://libretranslate.com/translate', {
      method: 'POST',
      body: JSON.stringify({
        q: text,
        source: 'en',
        target: targetLanguage,
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error('Translation failed.');
    }

    const data = await response.json();

    if (!data.translatedText) {
      throw new Error('Translation failed.');
    }

    return data.translatedText;
  } catch (error) {
    console.error('Translation Error:', error.message);
    return text; // Return original text if translation fails
  }
}

// WebSocket server event handling
wss.on('connection', (socket) => {
  console.log('WebSocket client connected.');

  // Send all stored messages to the newly connected client
  messages.forEach(async (message) => {
    const translatedMessage = await translateMessage(
      message.content,
      message.targetLanguage
    );
    socket.send(
      JSON.stringify({
        sender: message.sender,
        content: translatedMessage,
        targetLanguage: message.targetLanguage,
      })
    );
  });

  socket.on('message', async (messageData) => {
    const message = JSON.parse(messageData);
    messages.push(message);

    // Translate the message to the target language before broadcasting
    const translatedMessage = await translateMessage(
      message.content,
      message.targetLanguage
    );

    // Broadcast the new message to all connected clients
    wss.clients.forEach(async (client) => {
      if (client.readyState === WebSocket.OPEN) {
        if (client !== socket) {
          const translatedMessageOther = await translateMessage(
            message.content,
            message.targetLanguage
          );
          client.send(
            JSON.stringify({
              sender: message.sender,
              content: translatedMessageOther,
              targetLanguage: message.targetLanguage,
            })
          );
        } else {
          client.send(
            JSON.stringify({
              sender: message.sender,
              content: translatedMessage,
              targetLanguage: message.targetLanguage,
            })
          );
        }
      }
    });
  });

  socket.on('close', () => {
    console.log('WebSocket client disconnected.');
  });
});

// Start the server
server.listen(3000, () => {
  console.log('Server is running on port 3000.');
});
