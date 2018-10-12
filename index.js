var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var uid = 0;

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
  console.log('a user connected');
  var connectionUid = uid++;
  socket.emit('init', {id: connectionUid, x: 50, y:50});

  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
  socket.on('chat message', function(msg){
    console.log('message: ' + msg);
    io.emit('chat message', msg);
  });
  socket.on('user_action', function(data) {
      io.emit('user_action', data);
  });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
