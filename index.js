var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var uid = 1;
var userDatas = {};

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

var colors = ["#FF0000", "#00FF00", "#8d8d8d"];
var highScore = {value: 0, color: "#ffffff"};

io.on('connection', function(socket){
  console.log('a user connected');
  var connectionUid = uid++;
  var randomX = 50 + 700 * Math.random();
  var randomY = 50 + 500 * Math.random();
  //Random colors
  var r = 75 + Math.round(Math.random()*125);
  var g = 75 + Math.round(Math.random()*125);
  var b = 75 + Math.round(Math.random()*125);
  var color = "rgba(" + r + "," + g + "," + b +",1)";
  userDatas[connectionUid] = {id: connectionUid, x: randomX, y:randomY, vx: 0 , vy:0, color: color, score:0};
  socket.emit('init', userDatas[connectionUid]);
  socket.emit('highscore', highScore);

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
      var tmpScore = userDatas[data.id].score;
      userDatas[data.id] = {...data, score: tmpScore } ;
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
      var score = Math.round(pytCalc({x: currentData.vx, y: currentData.vy},{x: data.vx, y: data.vy}));
      if (speed(currentData) > speed(data)) {
        killId = data.id;
        score += data.score;
        currentData.score += score;
        if (currentData.score > highScore.value) {
          highScore.value = currentData.score;
          highScore.color = currentData.color;
          io.emit('highscore', highScore);
        }
      } else {
        killId = currentData.id;
        score += currentData.store;
        data.score += score;
        if (data.score > highScore.value) {
          highScore.value = data.score;
          highScore.color = data.color;
          io.emit('highscore', highScore);
        }
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
