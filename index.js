const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);


const path = require("path")
const ejs = require("ejs")

app.set("views", path.join(__dirname, "views"))
app.set("view engine", "ejs")

app.get("/", (req, res) => {
    res.render('index')
})

io.on('connection', (socket) => {
    console.log('a user connected');

    socket.on('msg', (msg) => {
        console.log(msg)
        io.to([...socket.rooms][1]).emit("msg", msg)
        console.log(socket.rooms)
    })

    socket.onAny((e, msg) => {
        if (e == "msg") return
        socket.leave([...socket.rooms][1])
        socket.join(e)

    })
});

server.listen(3000, () => {
    console.log('listening on *:3000');
});