var name = getQueryVariable('name') || 'Anonymous';
var room = getQueryVariable('room');
var socket = io();

console.log(name+' wants to join '+room+'!')

// update h1 tag
jQuery('.room-title').text('Welcome to the '+room+ ' chat room.');

socket.on('connect', function () {
	console.log('Connected to socket.io server');
	socket.emit('joinRoom', {
		name: name,
		room: room
	});
});

socket.on('message', function (message) {
	var momentTimestamp = moment.utc(message.timestamp);
	var $messages = jQuery('.messages');
	var $message = jQuery('<li class="list-group-item"></li>');



	console.log('New message: ');
	console.log(message.text);

	$message.append('<p><strong>'+ message.name +' '+ momentTimestamp.local().format('h:mma') +'</strong> '+message.text+'</p>');
	// $message.append(message.text+'</p>');
	$messages.append($message);
});


// Handles submitting of new msg
var entityMap = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': '&quot;',
    "'": '&#39;',
    "/": '&#x2F;'
  };

  function escapeHtml(string) {
    return String(string).replace(/[&<>"'\/]/g, function (s) {
      return entityMap[s];
    });
  }

var $form = jQuery('#message-form');


$form.on('submit', function (event) {
	event.preventDefault();

	var $rawMessage = $form.find('input[name=message]');
	var messageEscaped = escapeHtml($rawMessage.val());


	socket.emit('message', {
		name: name,
		text: messageEscaped // $message.val()
	});

	$rawMessage.val('');
});