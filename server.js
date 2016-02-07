var PORT = process.env.PORT || 3000;
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var moment = require('moment');

app.use(express.static(__dirname + '/public'));

var clientInfo = {};
var rooms = [];
var roomList = '';

// Sends current users to provided socket
function sendCurrentUsers (socket) {
	var info = clientInfo[socket.id];
	var users = [];

	if (typeof info === 'undefined') {
		return;
	}

	Object.keys(clientInfo).forEach(function (socketId) {
		var userInfo = clientInfo[socketId];

		if (info.room === userInfo.room) {
			users.push(userInfo.name);
		}
	});

	socket.emit('message', {
		name: 'System',
		text: 'Currently in this room: ' + users.join(', '),
		timestamp: moment().valueOf()
	});
}

// returns number of users in room
function userQty (socket) {
	var info = clientInfo[socket.id];
	var users = [];

	if (typeof info === 'undefined') {
		return;
	}

	Object.keys(clientInfo).forEach(function (socketId) {
		var userInfo = clientInfo[socketId];

		if (info.room === userInfo.room) {
			users.push(userInfo.name);
		}
	});

	if (users) {
		return users.length;
	} else {
		return 0;
	}
}


io.on('connection', function (socket) {
	console.log('User connected via socket.io');
	var now = moment();

	socket.on('disconnect', function () {
		var userData = clientInfo[socket.id];

		if (userQty(socket) < 1) {
			rooms.forEach(function (closedRoom, i, rooms) {
				if (closedRoom === userData.room) {  // but not if there's someone else still in that room
					rooms.splice(i, 1);
				}
			});
			roomList = rooms.join(',');
			console.log(roomList);
			socket.broadcast.emit('roomUpdate', {
				rooms: roomList,
				timestamp: moment().valueOf()
			});
		}
		

		if (typeof userData !== 'undefined') {
			socket.leave(userData.room);
			io.to(userData.room).emit('message', {
				name: 'System',
				text: userData.name + ' has left.',
				timestamp: moment().valueOf()
			});
			delete clientInfo[socket.id];
		}
	});

	socket.on('joinRoom', function (req) {
		clientInfo[socket.id] = req;
		socket.join(req.room);
		sendCurrentUsers(socket);

		socket.broadcast.to(req.room).emit('message', {
			name: 'System',
			text: req.name + ' has joined.',
			timestamp: moment().valueOf()
		});

		// updates list of rooms
		if (rooms.indexOf(req.room) < 0 ) {
			rooms.push(req.room);
			roomList = rooms.join(',');
			console.log(roomList);
			socket.broadcast.emit('roomUpdate', {
				rooms: roomList,
				timestamp: moment().valueOf()
			});
		}
	});

	socket.on('message', function (message) {
		console.log('Message received: ' + message.text);

		if (message.text === '@currentUsers') {
			sendCurrentUsers(socket);
		} else {
			message.timestamp = moment().valueOf();
			// socket.broadcast.emit  // sends to everyone BUT sender
			io.to(clientInfo[socket.id].room).emit('message', message);
		}
	});


	//  =====    we dont need this anymore =====
	// socket.emit('message', {
	// 	name: 'System',
	// 	text: 'Welcome to the chat application!',
	// 	timestamp: moment().valueOf()
	// });
});

http.listen(PORT, function () {
	console.log('Server started!');
});