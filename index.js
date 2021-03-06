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
const path = require("path")
const ejs = require("ejs");
const ejsMate = require('ejs-mate');


const io = new Server(server);

mongoose.connect('mongodb://localhost:27017/chat', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log("connection open")
    })
    .catch(err => {
        console.log(err)
    })



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

app.set("views", path.join(__dirname, "public/views"))
app.use(express.static(__dirname + '/public'));


app.set("view engine", "ejs")
app.engine("ejs", ejsMate);

app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    next();
})

isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        console.log(req.user);
        return res.redirect('/login');
    }
    next();
}

app.get("/", isLoggedIn, async (req, res) => {
    const user = await User.findById(req.user._id).populate("rooms");
    res.render('index', { rooms: user.rooms, username: req.user.username })
})

app.post('/joinroom/', isLoggedIn, async (req, res) => {
    const room = await Room.findById(req.body.id)
    const user = await User.findById(req.user._id);
    if (!(room._id in user.rooms)) {
        user.rooms.push(room._id)
    }
    await user.save();
    res.redirect("/")
});

app.get('/joinroom', isLoggedIn, async (req, res) => {
    res.render('joinroom')
})

app.get('/createroom', isLoggedIn, async (req, res) => {
    res.render('newroom')
})

app.post("/createroom/", isLoggedIn, async (req, res) => {
    if (req.body.roomname) {
        const room = new Room({ name: req.body.roomname })
        await room.save();
        const user = await User.findById(req.user._id);
        user.rooms.push(room._id);
        await user.save();
    }
    res.redirect('/');
})

app.get("/login", (req, res) => {
    if (req.user) {
        return res.redirect('/');
    }
    res.render('login');
})

app.get('/register', (req, res) => {
    if (req.user) {
        return res.redirect('/');
    }
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

app.get('/logout', (req, res) => {
    req.logout();
    res.redirect("/login");
})

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

