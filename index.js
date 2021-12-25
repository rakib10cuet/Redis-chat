const express = require("express");
/*Init App*/
const app = express();

/*Set Port*/
const PORT = 5000;
/*Set http request*/
const http = require("http");

/*for redis connection*/
const redis = require("redis");
const client = redis.createClient();

/*View Engine*/
app.set("view engine","ejs");

/*Set Socket.io*/
const socketio = require("socket.io");
const server = http.createServer(app);
const io = socketio(server).listen(server);

/*Retrieve Message from Redis*/
function sendMessage(socket) {
   client.lrange("messages", "0", "-1", (err, data) => {
      data.map(x => {
         const usernameMessage = x.split(":");
         const redisUsername = usernameMessage[0];
         const redisMessage = usernameMessage[1];
         socket.emit("message", {
            from: redisUsername,
            message: redisMessage
         });
      });
   });
}
/*for opening event for io*/
io.on("connection",socket=>{
   sendMessage(socket);
   socket.on("message",({message,from})=>{
      client.rpush("messages",`${from}:${message}`); /*redis store data*/
      io.emit("message",{from,message});
   });
});

/*Routing*/
app.get("/chat",(req,res)=>{
   const username = req.query.username;

   io.emit("joined",username);
   res.render("chat",{username});
});
app.get("/", (req, res) => {
   res.render("index");
});

/*Listening*/
server.listen(PORT,()=>{

   console.log(`Server At ${PORT}`);
});