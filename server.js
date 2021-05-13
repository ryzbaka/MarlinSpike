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
const crypto = require("crypto");

app.use(helmet.dnsPrefetchControl());
app.use(helmet.xssFilter());
app.use(helmet.noSniff());
app.use(helmet.frameguard());
//read about these helmet functions, and then include them in the report.
app.use(express.static(__dirname+"/public/"));
// app.use(helmet()) -> currently uncommenting this line effects website's access to js libraries the website is using through CDNs.
const User = require("./models/Users");
const Conversation = require("./models/Conversations");
const Key = require("./models/Keys")
const { Console } = require('console');

app.use(bodyParser.json());
require("dotenv").config({path: path.join(__dirname,".env")});
//Encryption Helper Functions
function generateKeyPair(username1, username2){
	const keyObject = {}
	//Generating two diffie hellman object that are bound together.
	const user1 = crypto.createDiffieHellman(256);
	const user2 = crypto.createDiffieHellman(user1.getPrime(), user1.getGenerator());
	//Generating keys
	user1.generateKeys();
	user2.generateKeys();
	//Generating IV for AES-256
	const shared_IV = crypto.randomBytes(16);
	keyObject.user1 = {
		username: username1,
		publicKey: user1.getPublicKey().toString("hex"),
		privateKey: user1.getPrivateKey().toString("hex"),
		IV: shared_IV.toString("hex"),
		prime:user1.getPrime().toString("hex"),
		generator:user1.getGenerator().toString("hex")
	}
	keyObject.user2 = {
		username: username2,
		publicKey: user2.getPublicKey().toString("hex"),
		privateKey: user2.getPrivateKey().toString("hex"),
		IV: shared_IV.toString("hex"),
		prime:user1.getPrime().toString("hex"),
		generator:user1.getGenerator().toString("hex")
	}
	const shared_secret_1 = user1.computeSecret(Buffer.from(keyObject.user2.publicKey,"hex"));
	const shared_secret_2 = user2.computeSecret(Buffer.from(keyObject.user1.publicKey,"hex"));
	if(shared_secret_1.toString("hex")==shared_secret_2.toString("hex")){
	console.log("Key-pair generation successful");
	console.log(keyObject);
	}
	return keyObject
}
//Encrpytion test routes
app.get("/testKeyPairGeneration",(req,res)=>{
	generateKeyPair("testuser1","tesruser2");
	res.send("done.")
})
//Sockets
io.sockets.on('connection',(socket)=>{
	console.log(`connected to socket client instance ${socket.id}`);
	socket.on("connected-to-server",({username})=>console.log(`connected to frontend : ${username}`));	
	socket.on("client-sent-message",({sender,receiver,message})=>{
		const roomName = [sender,receiver].sort().join("");
		console.log(`${sender} sent a message to ${receiver} on ${roomName}: ${message}`);
		io.to(roomName).emit("server-sent-message",{sender:sender,receiver:receiver,message:message})
	})
	socket.on("join-contact-room",({username1, username2})=>{
		const roomName = [username1,username2].sort().join("");
		console.log(`Received request from ${username1} to join room : ${roomName}`);
		socket.join(roomName);
		console.log(`${username1} joined room : ${roomName}`);
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
			res.send(true)
		}else{
			res.send(false)
		}
	})
})

app.post("/users/addContact",async ({body:{user1,user2,flush}},res)=>{
	const user1_contacts = await User.findOne({username:user1});
	const user2_contacts = await User.findOne({username:user2});
	//1)Generate key pair for user1 and user2 (diffie hellman)
	//2) Temporarily store key pair in mongodb.
	//3) Whenever a user tries to talk to someone for the first time by clicking their name in the contacts, the 
	// following things will get stored on their local leveldb database:
	// * Their private key from the key pair
	// After a user obtains their private key from mongo, that particular key will be deleted.
	// When both users have obtained their key, their private keys will be deleted.
	// Each user will store their own and their contact's public keys with them in MongoDB (revamp contacts object)
	// Will have to convert contacts an array of contact objects which contain their username and their public key.
	// Will have to add a model that temporarily stores private keys and a secure post request to fetch the same.
	// When a user clicks a new contact, marlinspike will look for the private key in the browser. If its not there, it will 
	// try fetching from the temp secret key storage model, if still not found, raise error that private key not found.
	// Once a user has their contact's public key, their own public key and private key they will obtain the shared secret key. 
	// This secret key will be use to encrypt and decrypt shared secret keys.
	// This gonna take a while boyo :), probably a whole day,
	if(flush){
		//flush deletes both user's contacts (this feature is only for developer convenience and should be removed in production)
		user1_contacts.contacts = [];
		user2_contacts.contacts = [];
	}else{
		const keyPairObject = await generateKeyPair(user1,user2);
		const newConversation = new Conversation({
			participants :[user1,user2].sort(),
			log:[]
		})
		console.log(newConversation)
		newConversation.save();
		console.log("no new users added.")
		console.log("Key pair generated.")
		// console.log(keyPairObject)
		const contact1 = {
				username:keyPairObject.user2.username,
				contactPublicKey:keyPairObject.user2.publicKey,
				userPublicKey:keyPairObject.user1.publicKey,
				sharedIV:keyPairObject.user2.IV,
				sharedPrime:keyPairObject.user1.prime,
				sharedGenerator:keyPairObject.user1.generator
		}//contact to be added to user1's contacts
		const contact2 = {
			username:keyPairObject.user1.username,
			contactPublicKey:keyPairObject.user1.publicKey,
			userPublicKey:keyPairObject.user2.publicKey,
			sharedIV:keyPairObject.user1.IV,
			sharedPrime:keyPairObject.user2.prime,
			sharedGenerator:keyPairObject.user2.generator
		}//contact to be added to user2's contacts
		user1_contacts.contacts.push(contact1);
		user2_contacts.contacts.push(contact2)
		console.log(user2_contacts)
		console.log(user1_contacts)
		const secretKeys = new Key({
			participants : [user1,user2].sort(),
			privateKey1:{
				username:user1,
				key:keyPairObject.user1.privateKey
			},
			privateKey2:{
				username:user2,
				key:keyPairObject.user2.privateKey
			}
		});
		console.log(secretKeys)
		user1_contacts.save();
		user2_contacts.save();
		secretKeys.save()
	}
	res.json({message:"Done.",type:"success"})
})

app.post("/users/getContacts",({body:{username}},res)=>{
	User.findOne({username:username}).exec((err,resultant)=>{
		if(err){
			res.json({message:err,type:"error"})
		}
		if(resultant){
			res.json({message:"Fetched contacts",type:"success",data:resultant})
		}
	})
})

app.post("/users/getMessages",async ({body:{username1,username2,n}},res)=>{
	//decrypt message here.
	const parts = [username1, username2].sort();
	const result = await Conversation.findOne({participants:parts});
	res.json({log:result})
})

app.post("/users/addMessage",async ({body:{sender,receiver,message}},res)=>{
	//Encrypt message here.
	try{
	const parts = [sender,receiver].sort();
	const result = await Conversation.findOne({participants:parts});
	const messageObj = {
		sender:sender,
		receiver:receiver,
		message:message
	}
	console.log(messageObj)
	result.log.push(messageObj);
	result.save()
	res.json({message:"Added message to log",type:"success"})
	}catch(err){
		res.json({message:`Error adding message to log : ${err}`,type:"error"})
	}
})

app.post("/fetchKey",async ({body:{username1,username2}},res)=>{
	//username1 is always going to be the one who's private key you want.
	const parts = [username1,username2].sort();
	const keys = await Key.findOne({participants:parts});
	let required_key;
	if(keys.privateKey1.username===username1){
		required_key = keys.privateKey1.key;
	}else{
		required_key = keys.privateKey2.key;
	}
	res.json({key:required_key})
})

app.post("/fetchPublicKey",async ({body:{username1,username2}},res)=>{
	//username1 is always going to be from localStorage.
	const result = await User.findOne({username:username1});
	for(let i=0;i<result.contacts.length;i++){
		if(result.contacts[i].username==username2){
			res.json(result.contacts[i])
		}else if(i==result.contacts.length-1){
			res.json({message:"Contact not found."})
		}
	}
})
//
mongoose.connect(process.env.DB_CONNECTION,{
	useNewUrlParser: true,
	useUnifiedTopology: true
}).then(()=>console.log("Connected to MongoDB cluster.")).catch((err)=>console.error(err));

server.listen(PORT, ()=>console.log(`Server listening on port: ${PORT}`));



