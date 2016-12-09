document.addEventListener("DOMContentLoaded", function() {
   var mouse = { 
      click: false,
      move: false,
      pos: {x:0, y:0},
      pos_prev: false
   };

   var settings = {
      mode: "pencil",
      color: "black",
      lineWidth: 10,
   }



   
   
   

   // get canvas element and create context
   var canvas  = document.getElementById('drawing');
   var context = canvas.getContext('2d');
   var width   = window.innerWidth;
   var height  = window.innerHeight;
   var socket  = io.connect();
   var currCanvas;

   var URL = window.URL || window.URL;
   var input = document.getElementById('input');
   input.addEventListener('change', handleFiles, false);
   function handleFiles(e) {
       // var context = document.getElementById('drawing').getContext('2d');
       var url = URL.createObjectURL(e.target.files[0]);
       socket.emit('send_image', {url: url});
   }

   socket.on('open_image', function(data){
      var img = new Image();
       img.onload = function() {
           context.drawImage(img, 0, 0);    
       }
       img.src = data.url;
   });


   $("#pencil").click(function(){
      settings.mode = "pencil";
   });
   $("#circle").click(function(){
      settings.mode = "circle";
   });
   $("#rectangle").click(function(){
      settings.mode = "rectangle";
   });
   $("#width1").click(function(){
      settings.lineWidth = 10;
   });
   $("#width2").click(function(){
      settings.lineWidth = 20;
   });
   $("#width3").click(function(){
      settings.lineWidth = 30;
   });

   $("#colorpicker").change(function(){
      settings.color = $("#colorpicker").css("background-color");
   });


   
   
   // set canvas to full browser width/height
   canvas.width = width;
   canvas.height = height;

   // register mouse event handlers
   canvas.onmousedown = function(e){
      mouse.pos_prev = {x: mouse.pos.x, y: mouse.pos.y};
      mouse.click = true;
   };
   canvas.onmouseup = function(e){

       if(settings.mode == "circle"){
         socket.emit('draw_circle', {x: mouse.pos_prev.x, y: mouse.pos_prev.y, r: Math.sqrt((mouse.pos.x-mouse.pos_prev.x)*(mouse.pos.x-mouse.pos_prev.x)+(mouse.pos.y-mouse.pos_prev.y)*(mouse.pos.y-mouse.pos_prev.y)), settings: settings });
      }
       if(settings.mode == "rectangle"){
         socket.emit('draw_rectangle', {x: mouse.pos_prev.x, y: mouse.pos_prev.y, width: Math.abs(mouse.pos.x-mouse.pos_prev.x), height: Math.abs(mouse.pos.y-mouse.pos_prev.y), settings: settings});
      }
      mouse.click = false;
   };



   canvas.onmousemove = function(e) {
      // normalize mouse position to range 0.0 - 1.0
      
         mouse.pos.x = e.clientX / width;
         mouse.pos.y = e.clientY / height;
         mouse.move = true;
      
   };
      
   socket.on('start', function(data){
      // var elem = document.getElementById("socketName");
      // elem.innerHTML = data.socketid;
   });

   socket.on('get_current_canvas', function(data){
      currCanvas = canvas.toDataURL('image/png');
      setTimeout(function(){ ;}, 1000);
      socket.emit('received_current_canvas', currCanvas);
      


      // alert('get this canvas');
   });

   socket.on('draw_current_canvas', function(data){
      // console.log(data.socket);
      setTimeout(function(){ ;}, 1000);
      // alert('write to this canvas');
      var image = new Image();
      image.src = data.data;
      context.drawImage(image, 0, 0);
   });
   

   // draw line received from server
	socket.on('draw_line', function (data) {
      var line = data.line;
      context.beginPath();
      context.moveTo(line[0].x * width, line[0].y * height);
      context.lineTo(line[1].x * width, line[1].y * height);
      context.strokeStyle = data.settings.color;
      context.lineWidth=data.settings.lineWidth;
      
      context.stroke();
   });

   socket.on('draw_rectangle', function (data){
      var x = data.x;
      var y = data.y;
      var width = data.width;
      var height = data.height;
      context.rect(x,y,width,height);
      context.strokeStyle = data.settings.color;
      context.lineWidth = data.settings.lineWidth;
      context.stroke();
   });

   socket.on('draw_circle', function(data){
      var x = data.x;
      var y = data.y;
      var r = data.r;
      context.beginPath();
      context.arc(x,y,r,0,2*Math.PI);
      context.strokeStyle = data.settings.color;
      context.lineWidth = data.settings.lineWidth;
      context.stroke();
   });

  socket.on('image', function(data){
    var img = new Image();
    img.src = 'data:image/jpeg;base64,' + data.buffer;
    context.drawImage(img, 0, 0);
  });

   
   // main loop, running every 25ms
   function mainLoop() {
      // check if the user is drawing
      if (mouse.click && mouse.move && mouse.pos_prev) {
         // send line to to the server
         if(settings.mode == "pencil"){

            socket.emit('draw_line', { line: [ mouse.pos, mouse.pos_prev ], settings: settings });
         }
         mouse.move = false;
         mouse.pos_prev = {x: mouse.pos.x, y: mouse.pos.y};
         setTimeout(mainLoop, 25);
      }
   }
   mainLoop();
});