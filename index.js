var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var uid = 0;
var userDatas = {};

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
  console.log('a user connected');
  var connectionUid = uid++;
  userDatas[connectionUid] = {id: connectionUid, x: 50, y:50, vx: 0 , vy:0};
  socket.emit('init', userDatas[connectionUid]);

  socket.on('disconnect', function(){
    delete userDatas[connectionUid];
    console.log('user disconnected');
  });
  socket.on('chat message', function(msg){
    console.log('message: ' + msg);
    io.emit('chat message', msg);
  });
  socket.on('user_action', function(data) {
    if (userDatas[data.id]) {
      userDatas[data.id] = data;
      var killId = bumped(data) || hitWall(data);
      if (killId) {
        delete userDatas[killId];
        io.emit('kill', killId);
      }
      if (killId != data.id) {
        io.emit('user_action', data);
      }
    }
  });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});

function hitWall(currentData){
  if(currentData.x + 20 > 800 || currentData.x -20 < 0){
    return currentData.id
  }
  if(currentData.y + 20 > 600 || currentData.y -20 < 0){
    return currentData.id
  }
}

function bumped(currentData){
  var killId;
  Object.values(userDatas).filter(data => data.id != currentData.id).some(data => {
    if(pytCalc(currentData, data) < 20*2 ){
      console.log("Collision",currentData.id,data.id);
      if (speed(currentData) > speed(data)) {
        killId = data.id;
      } else {
        killId = currentData.id;
      }
      return true;
    } else {
      return false;
    }
  });
  return killId;
}

function pytCalc(pos1, pos2){
  var a = pos1.x - pos2.x;
  var b = pos1.y - pos2.y;

  var distance = Math.sqrt( a*a + b*b );
  return distance;
}

function speed(ball) {
  console.log("speed:", ball.id, Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy))
  return Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
}
