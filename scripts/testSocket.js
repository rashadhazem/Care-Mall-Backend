// Simple test script for socket chat flows
// Usage: TOKEN=<jwt> node scripts/testSocket.js
// Or set process.env.TOKEN and process.env.SERVER_URL

const io = require('socket.io-client');

const TOKEN = process.env.TOKEN || '';
const SERVER = process.env.SERVER_URL || 'http://localhost:5000'; // adjust port if needed

if (!TOKEN) {
  console.error('Please set TOKEN env var (a valid JWT for a user)');
  process.exit(1);
}

const socket = io(SERVER, {
  transports: ['websocket'],
  query: { token: TOKEN },
  reconnection: false,
});

socket.on('connect', () => {
  console.log('Connected to socket server:', socket.id);

  // Example: create or get chat with a storeId
  const exampleStoreId = process.env.STORE_ID || '<STORE_ID_HERE>';
  if (exampleStoreId && exampleStoreId !== '<STORE_ID_HERE>') {
    socket.emit('createChat', { storeId: exampleStoreId }, (res) => {
      console.log('createChat response:', res);
      if (res && res.status === 'ok') {
        const chatId = res.chat._id;

        // join chat
        socket.emit('joinChat', { chatId }, (joinRes) => {
          console.log('joinChat response:', joinRes);

          // send a message
          socket.emit('sendMessage', { chatId, content: 'Hello from test script' }, (msgRes) => {
            console.log('sendMessage response:', msgRes);

            // mark read
            socket.emit('markRead', { chatId }, (markRes) => {
              console.log('markRead response:', markRes);
            });
          });
        });
      }
    });
  } else {
    console.log('No STORE_ID provided. Use env var STORE_ID to run createChat flow.');

    // Alternatively, retrieve chats
    socket.emit('getMyChats', (res) => {
      console.log('getMyChats response:', res);
    });
  }
});

socket.on('newMessage', (message) => {
  console.log('Received newMessage event:', message);
});

socket.on('messageNotification', (notif) => {
  console.log('Received messageNotification:', notif);
});

socket.on('newChat', (chat) => {
  console.log('Received newChat notification:', chat);
});

socket.on('messagesRead', (info) => {
  console.log('messagesRead:', info);
});

socket.on('connect_error', (err) => {
  console.error('connect_error', err.message);
});

socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
});
