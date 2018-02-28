
var jsonweb   = require('jsonwebtoken');
var config    = require('../../config');
var secretKey = config.secretKey;

//Create Token
function createToken(user){

	var token = jsonweb.sign({
		id: user._id,
		name: user.name,
		username: user.username
	}, secretKey, {
		expiresIn: 14400
	});

	return token;
}

//Route
module.exports = function(express, User, Story){
	var api = express.Router();

	api.post('/signup', function(req, res){
		var user = new User({
			name: req.body.name,
			username: req.body.username,
			password: req.body.password
		});

		user.save(function(err){
			if(err) res.send(err);
			res.json({message: "User has been created"});		
		});
	});

	api.post("/login", function(req, res){
		User.findOne({username: req.body.username})
			.select('password')
			.exec(function(err, user){
				if(err) res.send(err);
				if(!user) res.send({status: 0, msg: "Doesn't Exist"});
				else {
					var valid = user.comparePassword(req.body.password);
					if(!valid) res.send({status: 0, msg: "Invalid Password"});
					else {
						res.json({
							status: 1,
							msg: "Logged",
							token: createToken(user)
						});
					}
				}
			});
	});

	api.get("/users", function(req, res){
		User.find({}, '__id name username', function(err, users){
			if(err) res.send(err);
			res.json(users);
		});
	});

	// Middleware

	api.use(function(req, res, next){
		var token = req.body.token || req.query.token || req.headers['x-access-token'];
		if(token){
			jsonweb.verify(token, secretKey, function(err, decoded){
				if(err) res.status(405).send({msg: "Failed Authenticate"});
				else {
					req.decoded = decoded;
					next();
				}
			});
		} else res.status(403).send({msg: "No token"});
	});	

	api.get('/cekToken', function(req, res){
		res.end("Token Already Set");
	});

	api.get('/getUser', function(req, res){
		User.find({_id: req.decoded.id}, function(err, users){
			if(err) res.send(err);
			res.json(users);
		});
	});

	api.post('/insertStory', function(req, res){
		var story = new Story({
			creator: req.decoded.id,
			story: req.body.story
		});

		story.save(function(err){
			if(err) res.send(err);
			story.populate('creator', function(err, stories){
				res.json(stories);
			});	
		});
	});

	api.get('/getStories', function(req, res){
		Story.find().sort([['date', -1]]).populate('creator').exec(function(err, stories){
			if(err) res.send(err);
			res.json(stories);
		});
	});

	api.get('/getStory/:id', function(req, res){
		Story.findOne({_id: req.params.id}, function(err, story){
			if(err) res.send(err);
			res.json(story);
		});
	});

	api.post('/editStory', function(req, res){
		Story.findOne({_id: req.body.id}, function(err, data){
			Story.update({_id: req.body.id}, {
				creator: data.creator,
				story: req.body.story
			}, function(err){
				if(err) res.send(err);
				res.json({message: "Story Updated"});		
			});
		});
	});

	api.post('/deleteStory', function(req, res){
		Story.remove({_id: req.body.id}, function(err){
			if(err) res.send(err);
			else res.send({msg: "Story Deleted"});
		});
	});

	return api;
}