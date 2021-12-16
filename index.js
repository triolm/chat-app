const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const mongoose = require('mongoose');
const session = require("express-session")
const { User, Room } = require('./schemas.js')
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
const ejs = require("ejs");
const { findById } = require('./schemas.js');

app.use(session({
    secret: 'secret',
    proxy: true,
    resave: true,
    saveUninitialized: true

}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.set("views", path.join(__dirname, "views"))
app.set("view engine", "ejs")

isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        console.log(req.user);
        return res.redirect('/login');
    }
    next();
}

app.get("/", isLoggedIn, async (req, res) => {
    const user = await User.findById(req.user._id).populate("rooms");
    res.render('index', { rooms: user.rooms })
})

app.get('/joinRoom/:id', isLoggedIn, async (req, res) => {
    const room = await Room.findById(req.params.id)
    const user = await User.findById(req.user._id);
    user.rooms.push(room._id)
    await user.save();
    res.redirect("/")
});

app.get("/createroom/:name", isLoggedIn, async (req, res) => {
    const room = new Room({ name: req.params.name })
    await room.save();
    const user = await User.findById(req.user._id);
    user.rooms.push(room._id)
    await user.save();
    res.send(room._id)
})

app.get("/login", (req, res) => {
    res.render('login')
})

app.get('/register', (req, res) => {
    res.render('register')
})

app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    const user = new User({ username: req.body.username })
    const registeredUser = await User.register(user, password);
    req.login(registeredUser, err => {
        if (err) return next(err);
        res.redirect('/');
    })
    passport.authenticate()

})

app.post('/login',
    passport.authenticate('local', { failureRedirect: '/login' }),
    (req, res) => {
        req.session.redirect ? res.redirect(req.session.redirect) : res.redirect('/');
    });


io.on('connection', (socket) => {
    console.log('a user connected');

    socket.on('msg', (msg) => {
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

