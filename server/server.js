/*
	Final per il corso Programmazione di Interfacce
	Progetto di Gaspare Ferraro mat n°520549
*/

var WebSocketServer = require('ws').Server, 
    wss = new WebSocketServer({ port: 6060 });

// Broadcast to all.
wss.broadcast = function broadcast(data) {
  wss.clients.forEach(function each(client) {
    client.send(data);
  });
};

var  globalId = 0 ;
var      type = [];
var     allWs = [];
var  clientId = [];
var  clientWs = [];
var  serverId = [];
var  serverWs = [];
var inputData = [];
var    sClose = [];

function sendAllServer(data)
{
	for(var i=0; i<serverWs.length; i++)
		if(!sClose[i])
			try {
				serverWs[i].send(JSON.stringify(data));
			}
			catch(e){  }
}

setInterval(function(){
	sendAllServer(inputData);
},32);

wss.on('connection', function connection(ws) {
  
  allWs.push(ws);
  type[globalId] = -1 ;
  clientId[globalId] = -1 ;
  serverId[globalId] = -1 ;
  ws.on('close', (function(id,wsc){
	return function(){
		if(type[id]==1)
		{
			console.log("\tCLOSE CLIENT["+clientId[id]+"]");
			inputData[clientId[id]].offline = true ;

		}
		else if(type[id]==2)
		{
			console.log("\tCLOSE SERVER["+serverId[id]+"]");
			if( serverId[id] && sClose[serverId[id]] )
				sClose[serverId[id]] = true ;
		}
	};
  })(globalId,ws));

  ws.on('message',(function(id,wsc){ 
	return function (data) {
		if(type[id]==-1)
		{
			if(data=="CLIENT")
			{
				type[id] = 1 ;
				var idScelto = -1 ;
				for(var i=0; i<inputData.length; i++)
				{
					if(inputData[i] != undefined && inputData[i].offline )
					{
						idScelto = i ;
						break ;
					}
				}
				if(idScelto == -1) idScelto = inputData.length ;
				clientId[id] = idScelto ;
				inputData[idScelto] = { offline: false };
				clientWs[idScelto] = wsc;

				wsc.send("Player " + (clientId[id]+1));
				console.log("NEW CLIENT["+clientId[id]+"]");
			}	
			else if(data=="SERVER")
			{
				type[id] = 2 ;
				serverId[id] = serverWs.length ;
				sClose[serverId[id]] = false ;
				serverWs.push(wsc);
				console.log("NEW SERVER["+serverId[id]+"]");
				// inputData = [] ;
				// clientWs  = [] ;
			}
		}
		else
		{	
			if(type[id]==1)
			{
				var dt = JSON.parse(data);
				if( dt.event )
				{
					dt.client = clientId[id] ;
					//console.log(dt);
					sendAllServer(dt);
					return ;
				}
				inputData[clientId[id]] = JSON.parse(data);
				inputData[clientId[id]].offline = false ;
			}
			else
			{
				var msg = JSON.parse(data);
				if( msg.type && msg.type == "news" )
				{
					var to = parseInt(msg.to);
					var info = msg.info ;
					if( to >= 0 && to < clientWs.length )
						clientWs[to].send(info);
				}
			}
		}
	}
  })(globalId++,ws));

});
