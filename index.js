// Import the Express module
var express = require('express');

// Logger
var morgan = require('morgan');

// Import the 'path' module (packaged with Node.js)
var path = require('path');

// Create a new instance of Express
var app = express();

// Import the Anagrammatix game file - we are treating this as another server-side node module.
var agx = require('./game');

// Create a simple Express application

 // Configure Logging - we're just using logging all requests at the moment we can come back to this later
//app.use(morgan('combined'));

// Serve static html, js, css, and image files from the 'public' directory
app.use(express.static(path.join(__dirname,'public')));


// Create a Node.js based http server on port 8080
var server = require('http').createServer(app).listen(process.env.PORT || 8080);

// Create a Socket.IO server and attach it to the http server
var io = require('socket.io').listen(server);


// Listen for Socket.IO Connections. Once connected, start the game logic.
// here the socket param represents the unique socket connection between server and the connected browser.
io.sockets.on('connection', function (socket) {
  // excellent! I can see 3 clients connected and their IDs! Never give up! Never surrender! Alpha Brain FTW!
    console.log('client connected');
    console.log(socket.id);
    agx.initGame(io, socket);
});


