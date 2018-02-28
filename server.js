
//------- Import

var fs         = require('fs');
var express    = require('express');
var app 	   = express();
var morgan     = require('morgan');
var bodyParser = require('body-parser');
var config     = require('./config.js');
var http	   = require('http').Server(app);
var io 		   = require('socket.io')(http);

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(morgan('dev'));

//------- Angular

app.use(express.static(__dirname + "/quickstart"));
app.use(express.static(__dirname + "/quickstart/src"));

//------- Socket

io.on('connection', function(socket){
	socket.on('newStory', function(){
		io.emit('newStory');
	});
});

//------- Database

var mongoose     = require('mongoose');
mongoose.Promise = require('bluebird');
mongoose.connect(config.database, function(err){
	if(err) console.log(err);
	else console.log("Connected to database");
});

var User  = require('./core/models/user');
var Story = require('./core/models/story');

//------- Route

var api = require('./core/route/api')(express, User, Story);
app.use('/api', api);

app.get('*', function(req, res){
	res.sendFile(__dirname + "/quickstart/src/index.html");
});

//------- Server

http.listen(config.port, function(err){
	if(err) console.log(err);
	else console.log("Listening Port 8000");
});