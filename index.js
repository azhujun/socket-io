const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io').listen(server);
const path = require('path')
const favicon = require('serve-favicon')
const logger = require('morgan')
const socketServer = require('./server/socket');
const cookieParser = require('cookie-parser');

app.use(cookieParser()); 
app.use(express.static('static'))
app.set('port', process.env.PORT || 3000)
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'pug')
app.use(favicon(path.join(__dirname, '/static/favicon.ico')))
app.use(logger('dev'))
app.get('/', function (req, res) {
    res.render('index', { username: req.cookies["ECS[username]"]})
})

app.get('/customer', function (req, res) {
    res.render('customer', { username: req.cookies["ECS[username]"] })
})
app.get('/im', function (req, res) {
    res.render('im', { username: req.cookies["ECS[username]"] })
})

io.on('connection', (socket) => {
    socketServer.init(socket, io)
});

server.listen(3839);