const PORT = 2300;

const express = require('express');
const app = express();
const http = require('http')
const bodyParser = require('body-parser');
const path = require("path");
const mongoose = require('mongoose');
const bcrypt = require("bcryptjs");
const server = http.createServer(app);
const io = require('socket.io')(server);
app.use(express.static(__dirname+"/public/"));

const User = require("./models/Users");

app.use(bodyParser.json());
require("dotenv").config({path: path.join(__dirname,".env")});

//ROUTES FOR SERVING HTML FILES
app.get("/",(req,res)=>{
	res.sendFile(path.join(__dirname,"index.html"));
})
//
//ROUTES FOR INTERACTING WITH MONGODB
app.post("/users/signup",async ({body:{username,password}},res)=>{
	User.findOne({username:username},"username").exec((err,resultant)=>{
		if(resultant){
			res.send("Username already exists")
		}else{
			bcrypt.genSalt(10,(err,salt)=>{
				bcrypt.hash(password,salt,(err,hash)=>{
					const newUser = new User({
						username:username,
						hash:hash
					});
					newUser.save().then(()=>res.send("User created.")).catch(err=>res.send(err))
				})
			});
			// const newUser = new User({
			// 	username:username,
			// 	hash:password
			// });
			// newUser.save().then(()=>res.send("User created.")).catch(err=>res.send(err));
		}
	})
})
//
mongoose.connect(process.env.DB_CONNECTION,{
	useNewUrlParser: true,
	useUnifiedTopology: true
}).then(()=>console.log("Connected to MongoDB cluster.")).catch((err)=>console.error(err));

server.listen(PORT, ()=>console.log(`Server listening on port: ${PORT}`));



