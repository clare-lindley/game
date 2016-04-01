/**
 GameStarted = my test event - OK
 Player client emits ‘currentPlayerVideoSearch’ and sends search query (button click) - OK
 Server handles and emits ‘videoSearchResultsReady’ and returns results - OK
 Player client handles and displays results - working on now - OK
 Player chooses video - click handler on player emits ‘onvideoSearchResultClick’ and sends video id back to Server - OK

 Server handles and emits ‘videoReadyToPlay’ and returns video id
 Host client handles and plays the video in the player.

 So set up - we need a player and a host client, we need player templates and a host template
 Setup events - what are these?

 @todo Keep the video player on the Host - only broadcast results to the players

 @todo Make the button bigger on the player screen

 @todo Use REAL YT API library: https://developers.google.com/youtube/v3/docs/search/list#examples

*/

var https = require('https');
var io;
var gameSocket;


/**
 * This function is called by index.js to initialize a new game instance.
 *
 * @param sio The Socket.IO library
 * @param socket The socket object for the connected client.
 */
exports.initGame = function(sio, socket){
  io = sio;
  gameSocket = socket;
  gameSocket.emit('connected', { message: "You are connected!" });

  // Host Events
  gameSocket.on('hostCreateNewGame', hostCreateNewGame);
  gameSocket.on('hostRoomFull', hostPrepareGame);
  gameSocket.on('hostCountdownFinished', hostStartGame);
  gameSocket.on('hostNextRound', hostNextRound);

  // Video-related Events
  gameSocket.on('currentPlayerVideoSearch', doVideoSearch);
  gameSocket.on('currentPlayerVideoSelected', currentPlayerVideoSelected);

  // Player Events
  gameSocket.on('playerJoinGame', playerJoinGame);
  gameSocket.on('playerAnswer', playerAnswer);
  gameSocket.on('playerRestart', playerRestart);
}

/* *******************************
 *                             *
 *       HOST FUNCTIONS        *
 *                             *
 ******************************* */

/**
 * The 'START' button was clicked and 'hostCreateNewGame' event occurred.
 */
function hostCreateNewGame() {
  // Create a unique Socket.IO Room
  var thisGameId = ( Math.random() * 100000 ) | 0;

  // Return the Room ID (gameId) and the socket ID (mySocketId) to the browser client
  this.emit('newGameCreated', {gameId: thisGameId, mySocketId: this.id});

  // Join the Room and wait for the players
  this.join(thisGameId.toString());
};

/*
 * Two players have joined. Alert the host!
 * @param gameId The game ID / room ID
 */
function hostPrepareGame(gameId) {
  var sock = this;
  var data = {
    mySocketId : sock.id,
    gameId : gameId
  };
  //console.log("All Players Present. Preparing game...");
  io.sockets.in(data.gameId).emit('beginNewGame', data);
}

/*
 * The Countdown has finished, and the game begins!
 * @param gameId The game ID / room ID
 */
function hostStartGame(gameId) {
  //console.log('Game Started.');
  io.sockets.in(gameId).emit('gameStarted');
};

/**
 * A player answered correctly. Time for the next word.
 * @param data Sent from the client. Contains the current round and gameId (room)
 */
function hostNextRound(data) {
  if(data.round < wordPool.length ){
    // Send a new set of words back to the host and players.
    sendWord(data.round, data.gameId);
  } else {
    // If the current round exceeds the number of words, send the 'gameOver' event.
    io.sockets.in(data.gameId).emit('gameOver',data);
  }
}
/* *****************************
 *                           *
 *     PLAYER FUNCTIONS      *
 *                           *
 ***************************** */

/**
 * A player clicked the 'START GAME' button.
 * Attempt to connect them to the room that matches
 * the gameId entered by the player.
 * @param data Contains data entered via player's input - playerName and gameId.
 */
function playerJoinGame(data) {
  //console.log('Player ' + data.playerName + 'attempting to join game: ' + data.gameId );

  // A reference to the player's Socket.IO socket object
  var sock = this;

  // Look up the room ID in the Socket.IO manager object.
  var room = gameSocket.manager.rooms["/" + data.gameId];

  // If the room exists...
  if( room != undefined ){
    // attach the socket id to the data object.
    data.mySocketId = sock.id;

    // Join the room
    sock.join(data.gameId);

    //console.log('Player ' + data.playerName + ' joining game: ' + data.gameId );

    // Emit an event notifying the clients that the player has joined the room.
    io.sockets.in(data.gameId).emit('playerJoinedRoom', data);

  } else {
    // Otherwise, send an error message back to the player.
    this.emit('error',{message: "This room does not exist."} );
  }
}

/**
 * A player has tapped a word in the word list.
 * @param data gameId
 */
function playerAnswer(data) {
  // console.log('Player ID: ' + data.playerId + ' answered a question with: ' + data.answer);

  // The player's answer is attached to the data object.  \
  // Emit an event with the answer so it can be checked by the 'Host'
  io.sockets.in(data.gameId).emit('hostCheckAnswer', data);
}

/**
 * The game is over, and a player has clicked a button to restart the game.
 * @param data
 */
function playerRestart(data) {
  // console.log('Player: ' + data.playerName + ' ready for new game.');

  // Emit the player's data back to the clients in the game room.
  data.playerId = this.id;
  io.sockets.in(data.gameId).emit('playerJoinedRoom',data);
}


/* *****************************
 *                           *
 *     VIDEO-RELATED FUNCTIONS     *
 *                           *
 ***************************** */

function doVideoSearch(data){

  var options = {
    host: 'www.googleapis.com',
    path: '/youtube/v3/search?part=snippet&q=' + data.searchTerm + '&type=video&maxResults=25&key=AIzaSyB7Q9OG5EbQDxsPcP3voVbmMUuABU9ORKw'
  };


  var req = https.get(options, function(res) {
    //console.log('STATUS: ' + res.statusCode);
    //console.log('HEADERS: ' + JSON.stringify(res.headers));

    // Buffer the body entirely for processing as a whole.
    var bodyChunks = [];
    res.on('data', function(chunk) {
      // You can process streamed parts here...
      bodyChunks.push(chunk);
    }).on('end', function() {
      var body = Buffer.concat(bodyChunks);
      // ...and/or process the entire body here.
      data.results = JSON.parse(body)

      // here we only want to send data to the players, not ALL the clients. Oh ya!
      io.sockets.in(data.gameId).emit('videoSearchResultsReady', data);
    })
  });


  req.on('error', function(e) {
    console.log('ERROR: ' + e.message);
  });

}

function currentPlayerVideoSelected(data){
  
  console.log('Server passing video id ' + data.videoId + 'back to host client for display');
}

