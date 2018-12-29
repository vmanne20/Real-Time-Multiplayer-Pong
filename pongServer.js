var util = require("util"),					// Utility resources (logging, object inspection, etc)
	io = require("socket.io")

var socket,		// Socket controller
	players;	// Array of connected players

var ball = [640,360,10,5,5];

var player1Score = 0;
var player2Score = 0; 
var timer = 10;
/**************************************************
** GAME INITIALISATION
**************************************************/
function init() {
	// Create an empty array to store players
	players = [];

	// Set up Socket.IO to listen on port 8000
	socket = io.listen(8000);

	// Configure Socket.IO
	socket.configure(function() {
		// Only use WebSockets
		socket.set("transports", ["websocket"]);

		// Restrict log output
		socket.set("log level", 2);
	});

	// Start listening for events
	setEventHandlers();
};

var setEventHandlers = function() {
	// Socket.IO
	socket.sockets.on("connection", onSocketConnection);
};

// New socket connection
function onSocketConnection(client) {
	util.log("New player has connected: "+client.id);

	// Listen for client disconnected
	//client.on("disconnect", onClientDisconnect);

	// Listen for new player message
	client.on("new player", onNewPlayer);

	// Listen for move player message
	client.on("move player", onMovePlayer);
	client.on("move ball", moveBall)
};

function onNewPlayer(data) {
	// Create a new player
	var newPlayer = [data.x, data.y,players.length, data.name];
	//newPlayer.id = this.id;
	console.log(newPlayer); 
	// Broadcast new player to connected socket clients
	this.broadcast.emit("new player", {id: newPlayer[2], x: newPlayer[0], y: newPlayer[1]});


	if(players.length == 0)
	{
		this.emit("player alignment", {playerNum: 1})
	}
	else
	{
		// Send existing players to the new player
		var i, existingPlayer;
		for (i = 0; i < players.length; i++) {
			existingPlayer = players[i];
			this.emit("new player", {id: existingPlayer[2], x: existingPlayer[0], y: existingPlayer[1]});
		};
		this.emit("player alignment", {playerNum: 2})
	}
	
	// Add new player to the players array
	players.push(newPlayer);

	if(players.length == 2)
	{
		//socket.sockets.emit("start ball",{x: 640, y: 360, radius: 10, dx: 5, dy: 5})
		
		var myVar = setInterval(function(){
			console.log(timer);
			timer--; 
			socket.sockets.emit("count down",{count: timer}); 
			if(timer == 0)
			{
				clearInterval(myVar);
			}
		}, 1000);
	}
};
function onMovePlayer(data) {
	if(players.length >= data.id)
	{
		// Find player in array
		var movePlayer = data.id-1;
		//console.log(movePlayer);

		// Update player position
		players[movePlayer][0] = data.x;
		players[movePlayer][1] = data.y;

		// Broadcast updated position to connected socket clients
		this.broadcast.emit("move player", {id: data.id, x: players[movePlayer][0], y: players[movePlayer][1]});
	}
	
};
function moveBall(){
	if(timer == 0)
	{
		//util.log("move ball");
		if(ball[0]+ball[2]>= 1280)
		{
		//ball[3] = -ball[3];
			player1Score++; 
			//console.log(player1Score);
			socket.sockets.emit("score made", {player: 1, score: player1Score})
			ball[0] = 640;
			ball[1] = 360; 
		}
		if(ball[0]-ball[2]<= 0)
		{
			player2Score++; 
			//console.log(player1Score);
			socket.sockets.emit("score made", {player: 2, score: player2Score})

			ball[0] = 640;
			ball[1] = 360; 
		}
		if(ball[1]+ball[2] >= 720)
		{
		ball[4] = -ball[4];
		}
		if(ball[1]-ball[2] <= 0)
		{
		ball[4] = -ball[4];
		}
		if((ball[0]+ball[2]>= 1260) && ((ball[1] < (players[1][1]+100))&&(ball[1] >  players[1][1])))
		{
			ball[3] = -ball[3];
		}
		if((ball[0]-ball[2]<= 20) && ((ball[1] < (players[0][1]+100))&&(ball[1] >  players[0][1])))
		{
			ball[3] = -ball[3];
		}
		ball[0]+=ball[3];
        ball[1]+=ball[4];
		socket.sockets.emit("ball moved", {x: ball[0], y:ball[1]})
		//util.log(ball[0] + ', ' + ball[1]);
	}


}
init();