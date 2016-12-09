var express = require('express'), 
    app = express(),
    http = require('http'),
    socketIo = require('socket.io');

// start webserver on port 8080
var server =  http.createServer(app);
var io = socketIo.listen(server);
var fs = require('fs');
var clients = new Array();
server.listen(8080);


// add directory with our static files
app.use(express.static(__dirname + '/'));
console.log("Server running on 127.0.0.1:8080");

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});


// array of all lines drawn
var line_history = [];

// event-handler for new incoming connections


// var io = require('socket.io')(3000);

var image;

io.on('connection', function (socket) {
  socket.on('disconnect', function(){
    console.log(clients);
    var index = clients.indexOf(socket.id);
    var topItem = clients.pop();
    if(clients.length != index)
      clients[index] = topItem;
    // console.log(clients);
  });

  // fs.readFile('company.png', function(err, buf){
  //   socket.emit('image', { image: true, buffer: buf.toString('base64') });
  // });
  
  clients.push(socket.id);
  io.to(socket.id).emit('start',{socketid:socket.id});

  console.log("USER CONNECTED");
  if(clients.length > 0)
  {
   console.log("clients connected: "+clients.length);  
   console.log(clients);
     for(i=0; i<(clients.length); i++)
     {
      console.log("GET CANVAS FROM: " + clients[i]); 
       
       if(clients[i].id != socket.id)
       {
         //download canvas
         io.to(clients[i]).emit('get_current_canvas');
         
         //receive canvas
         socket.on('received_current_canvas', function(data){
         setTimeout(function(){ ;}, 1000);
         

           global.image = data;
           
           // if(global.image != null)
           // {
           //   console.log("canvas loaded");
           //   // console.log(image);
           // }  else { console.log("canvas NOT loaded"); }

         });
       } else {console.log("\n\nnothing happens here\n\n")}

       if(global.image != null)
         {console.log(clients[i] + ": order: "+i);
            console.log('image not null');
            io.to(socket.id).emit('draw_current_canvas', {data:global.image});
            global.image = null;

            break;   
         }
       else console.log('image null');
     }
  }


   // add handler for message type "draw_line".
   socket.on('draw_line', function (data) {
      io.emit('draw_line', { line: data.line, settings: data.settings });
   });

   socket.on('draw_circle', function(data){
      io.emit('draw_circle', { x: data.x, y: data.y, r: data.r, settings: data.settings })
   });

   socket.on('draw_rectangle', function(data){
      io.emit('draw_rectangle', { x: data.x, y: data.y, width: data.width, height: data.height, settings: data.settings })
   });

   socket.on('draw_straightLine', function(data){
   io.emit('draw_straightLine', { x1: data.x1, y1: data.y1, x2: data.x2, y2: data.y2, settings: settings})
   });

   socket.on('send_image', function(data){
      io.emit('open_image', {url:data.url})
   });



   
});
