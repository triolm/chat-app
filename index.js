const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const mongoose = require('mongoose');
const session = require("express-session")
const User = require('./schemas.js')
const passport = require('passport')
const LocalStrategy = require('passport-local');


const io = new Server(server);

mongoose.connect('mongodb://localhost:27017/chat', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log("connection open")
    })
    .catch(err => {
        console.log(err)
    })

const path = require("path")
const ejs = require("ejs")

app.use(session({
    secret: 'secret',
    proxy: true,
    resave: true,
    saveUninitialized: true

}));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.set("views", path.join(__dirname, "views"))
app.set("view engine", "ejs")

app.get("/", (req, res) => {
    res.render('index')
})

app.get("/login", (req, res) => {
    res.render('login')
})

app.get('/register', (req, res) => {
    res.render('register')
})

app.post('/register', (req, res) => {
    const { email, username, password } = req.body;
    const user = new User({ username });
    const registered = new User.register(user, password);
})

app.post('/login',
    passport.authenticate('local', { failureRedirect: '/login' }),
    (req, res) => {
        req.session.redirect ? res.redirect(req.session.redirect) : res.redirect('/notes');
    });


io.on('connection', (socket) => {
    console.log('a user connected');

    socket.on('msg', (msg) => {
        console.log(msg)
        io.to([...socket.rooms][1]).emit("msg", msg)
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