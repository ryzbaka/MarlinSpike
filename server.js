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
const helmet = require("helmet");

app.use(helmet.dnsPrefetchControl());
app.use(helmet.xssFilter());
app.use(helmet.noSniff());
app.use(helmet.frameguard());
//read about these helmet functions, and then include them in the report.
app.use(express.static(__dirname+"/public/"));
// app.use(helmet()) -> currently uncommenting this line effects website's access to js libraries the website is using through CDNs.
const User = require("./models/Users");

app.use(bodyParser.json());
require("dotenv").config({path: path.join(__dirname,".env")});
//Sockets
io.sockets.on('connection',(socket)=>{
	console.log(`connected to socket client instance ${socket.id}`);
	socket.on("connected-to-server",({username})=>console.log(`connected to frontend : ${username}`));	
	socket.on("client-sent-message",({sender,receiver,message})=>{
		console.log(`${sender} sent a message to ${receiver} : ${message}`);
	})
});
//ROUTES FOR SERVING HTML FILES
app.get("/",(req,res)=>{
	res.sendFile(path.join(__dirname,"/pages/index.html"));
})
app.get("/signup",(req,res)=>{
	res.sendFile(path.join(__dirname,"/pages/signup.html"));
})
app.get("/signin",(req,res)=>{
	res.sendFile(path.join(__dirname,"/pages/signin.html"));
})
app.get("/profile",(req,res)=>{
	res.sendFile(path.join(__dirname,"/pages/profile.html"));
})
//
//ROUTES FOR INTERACTING WITH MONGODB
app.post("/users/signup",async ({body:{username,password}},res)=>{
	/*
	SIGN UP 
	*/
	User.findOne({username:username},"username").exec((err,resultant)=>{
		if(resultant){
			res.json({message:"Username already exists",messagetype:"error"})
		}else{
			bcrypt.genSalt(10,(err,salt)=>{
				bcrypt.hash(password,salt,(err,hash)=>{
					const newUser = new User({
						username:username,
						hash:hash
					});
					newUser.save().then(()=>res.json({message:"User created",messagetype:"success"})).catch(err=>res.send(err))
				})
			});
		}
	})
})

app.post("/users/signin",async ({body:{username,password}},res)=>{
	User.findOne({username:username}).exec(async (err,resultant)=>{
		if(resultant){
			const {hash} = resultant;
			const authenticationSuccessful = await bcrypt.compare(password,hash);
			if(authenticationSuccessful){
				res.json({message:"Authentication successful.",messagetype:"success"})
			}else{
				res.json({message:"Authentication failed.",messagetype:"error"})
			}
		}else{
			res.json({message:"Authentication failed.",messagetype:"error"})
		}
	})
})

app.post("/users/checkExists",async ({body:{username}},res)=>{
	User.findOne({username:username}).exec(async (err,resultant)=>{
		if(err){
			console.error(err)
			res.send(false)
		}
		if(resultant){
			console.log(resultant)
			res.send(true)
		}else{
			res.send(false)
		}
	})
})

app.post("/users/addContact",async ({body:{user1,user2}},res)=>{
	//Add user to contacts of both user1 and user2
	console.log("lmao.")
})
//
mongoose.connect(process.env.DB_CONNECTION,{
	useNewUrlParser: true,
	useUnifiedTopology: true
}).then(()=>console.log("Connected to MongoDB cluster.")).catch((err)=>console.error(err));

server.listen(PORT, ()=>console.log(`Server listening on port: ${PORT}`));



