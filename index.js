// var server = require('http').createServer();
// var io = require('socket.io')(server);
// io.on('connection', function(client){
//   console.log("connected",client)
//   client.on('t', function(data){console.log("temperature",data)});
//   client.on('event', function(data){console.log("event",data)});
//   client.on('disconnect', function(){console.log("disconnect",client)});
// });
// server.listen(4897);
var ws = require("nodejs-websocket")

global_counter = 0;
  all_active_connections = {};

// // Scream server example: "hi" -> "HI!!!"
// var server = ws.createServer(function (conn) {
//     conn.on('connect', function()
//       {
//           var id = global_counter++;
//           all_active_connections[id] = conn;
//           conn.id = id;
//             console.log("connect: "+conn.id)
//       })
//       .on('text', function (data) {
//         console.log('text',data,all_active_connections)
//         server.connections.forEach(function (connection) {
//           console.log("send",connection.id,conn.id,connection.id!=conn.id)
//           if(connection.id!=conn.id)
//         		connection.sendText(data)
//         	})
//
//     }).on('close', function() {
//       console.log("close: "+conn.id)
//         delete all_active_connections[conn.id];
//     });
// }).listen(4897)

const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 4897 });

var table = [];

function search_interval(int){
  for(let i=0;i<table.length;i++){
      console.log(Math.floor(Math.abs(table[i].t1-table[i].t2)))
      if(Math.floor(Math.abs(table[i].t1-table[i].t2))==Math.floor(int))
      return false;
    }
    return true;
}

function check_v_empty(){
  for(let i=0;i<table.length;i++){
    if(table[i].v==0) {
      wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
          client.send("lt5");
        }
      });
      return;
    }
  }
  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send("lf5");
    }
  });
}
// Broadcast to all.
wss.broadcast = function broadcast(data) {

    wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });


};

wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(data) {
    console.log("message",data);
    if(data=="get_table"){
        ws.send(JSON.stringify({table:table}));
    }else if(data=="reset"){
        table = [];
        console.log("reseting")
        wss.clients.forEach(function each(client) {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({table:[]}));
          }
        });
    }else{
      try{
        var d = JSON.parse(data);
        if(typeof d.t1!='undefined'&& typeof d.t2!='undefined'){

          if(Math.floor(Math.abs(d.t1-d.t2))%5==0 && search_interval(Math.abs(d.t1-d.t2))){
                  table.push({
                    t1:Math.floor(d.t1*100)/100,t2:Math.floor(d.t2*100)/100,v:0
                  })
                  check_v_empty();
                  //console.log("added",table);
          }
        }else    if(typeof d.set_v!='undefined'){
          for(let i=0;i<table.length;i++){
            if(table[i].t1 == d.set_v.t1 && table[i].t2 == d.set_v.t2)
             table[i].v = d.set_v.v;
          }
          check_v_empty();
        }

      }catch(ex){
        console.log("Exception parse data",ex,data);
      }
      wss.clients.forEach(function each(client) {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(data);
        }
      });
    }


  });
});
