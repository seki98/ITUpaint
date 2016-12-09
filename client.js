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

      if(settings.mode == "circle" || settings.mode == "rectangle"){
         
         mouse.pos_prev = {x: mouse.pos.x, y: mouse.pos.y};
         //alert("pociatocny bod" + mouse.pos_prev.x);
      }
      mouse.click = true;
   };
   canvas.onmouseup = function(e){

      //alert("zaciatok" + mouse.pos_prev.x + "koniec" + mouse.pos.x);
       if(settings.mode == "circle"){
         //alert("zaciatok" + mouse.pos_prev.x + "koniec" + mouse.pos.x);
         var middleX = mouse.pos_prev.x * canvas.width;
         var middleY = mouse.pos_prev.y * canvas.height;
         var currX = mouse.pos.x * canvas.width;
         var currY = mouse.pos.y * canvas.height;
         var iks = Math.abs(currX - middleX);
         //alert("iks" + iks);
         var ypsilon = Math.abs(currY - middleY);
         var radX = iks*iks;
         var radY = ypsilon*ypsilon;
         var radius = Math.sqrt(radX + radY);
         //alert("predchadzajuca" + mouse.pos_prev.x + "nasledujuca" + mouse.pos.x);
         socket.emit('draw_circle', {x: middleX, y: middleY, r: radius, settings: settings });
        // alert("konec circle");
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
	socket.on('draw_line', function (data){
      var line = data.line;
      context.beginPath();
      context.moveTo(line[0].x * width, line[0].y * height);
      context.lineTo(line[1].x * width, line[1].y * height);
      context.strokeStyle = data.settings.color;
      context.lineWidth = data.settings.lineWidth;
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
     // alert("draw circle x y r" + x + y + r);
      
      context.beginPath();
      context.arc(x,y,r,0,2*Math.PI);
      //context.arc(500,500,100,0,2*Math.PI);

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
      }
      if(settings.mode == "pencil"){
         mouse.pos_prev = {x: mouse.pos.x, y: mouse.pos.y};
      }
      setTimeout(mainLoop, 25);
   }
  
   mainLoop();
});