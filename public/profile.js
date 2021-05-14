const swal = require("sweetalert2")
const axios = require("axios")
const levelup = require("levelup")
const leveljs = require("level-js")
const crypto = require("crypto")

const db = levelup(leveljs('test.db',{valueEncoding:'json'}));

const profileHeader = document.getElementById("profile-name");
const logoutbtn = document.querySelector(".logout-button");
const sendMessageButton = document.querySelector("#send-button")
const messageInput = document.querySelector(".message-input");
const addContactButton = document.querySelector(".add-contact-button")
const transcriptContainer = document.querySelector(".transcript-container");
const contactsContainer = document.querySelector(".contacts-container");
transcriptContainer.scrollTop = transcriptContainer.scrollHeight;
let currentContact="null";
let currentSecret = "null";

let socket;
if(localStorage.getItem("marlinspike-username")===null){
    window.location.replace("/")
}else{
    profileHeader.innerText = localStorage.getItem("marlinspike-username")
    socket = io();
}
updateContacts();

function logout(){
    localStorage.removeItem("marlinspike-username")
    window.location.replace("/")
}
logoutbtn.addEventListener("click",logout);


socket.on("connect",()=>{
    socket.emit("connected-to-server",{username:localStorage.getItem("marlinspike-username")})
})
socket.on("disconnect",()=>swal.fire("Disconnected from Marlinspike servers.","Check you internet connection.","error"))
socket.on("server-sent-message",async ({sender,receiver,message})=>{
    console.log(`message from server :${message}`);
    const decrypted = await decryptMessage(message);
    if([sender,receiver].includes(currentContact)){
        if(sender===localStorage.getItem("marlinspike-username")){
            addMessageToTranscriptContainer(sender+": "+decrypted,"sent-message");
        }else{
            addMessageToTranscriptContainer(sender+": "+decrypted,"received-message");
        }
    }
})

async function addMessageToTranscriptContainer(message, type){
    const messageContainer = document.createElement("div");
    messageContainer.classList.add(type);
    const messageText = document.createElement("p");
    messageText.innerText = message;
    messageContainer.appendChild(messageText);
    transcriptContainer.appendChild(messageContainer);
    transcriptContainer.scrollTop=transcriptContainer.scrollHeight;
}

sendMessageButton.addEventListener("click",async ()=>{
    const messageText = messageInput.value;
    const encryptedText = await encryptMessage(messageText);
    // addMessageToTranscriptContainer(messageText,"sent-message")
    // query receiver's public key and then encrypt
    //messageText has to get encrypted using current secret here
    //check if currentContact and currentSecret are not null
    if((currentContact!="null")&&(currentSecret!="null")){
    axios.post("/users/addMessage",{
        sender:localStorage.getItem("marlinspike-username"),
        receiver:currentContact,
        message:encryptedText
    })
    socket.emit("client-sent-message",{
        sender:localStorage.getItem("marlinspike-username"),
        receiver:currentContact,
        message:encryptedText
    })
}else{
    swal.fire("Did not send message, check currentContact and currentSecret","This is a developer error,","error")
}
})

async function addContact(){
    const {value} = await swal.fire({
        title:"Enter contact's username.",
        input:"text",
        inputLabel:"Contact username",
        showCancelButton: true,
        inputValidator:(value)=>{
            if(!value){
                return 'You need to enter a valid username.'
            }

        }
    });
    console.log(value)
    axios.post("/users/checkExists",{
        username:value
    }).then(({data})=>{
        if(!data){
            swal.fire("Username not found","Please enter a valid username.","error")
        }else{
            swal.fire("Found user","yay!","success")
            const addContactData = {
                user1: localStorage.getItem("marlinspike-username"),
                user2: value
            }
            console.log(addContactData);
            axios.post("/users/addContact",addContactData).then(({data})=>{
                swal.fire(data.message,"Added user to contacts if it wasn't already there.","success")
                // fetchContacts();
                updateContacts()
            });
        }
    })
}
function updateContacts(){
    const username = localStorage.getItem("marlinspike-username");
    fetchContacts(username)
}
function fetchContacts(username){
    axios.post("/users/getContacts",{username:username})
    .then(({data})=>{
        const raw_contacts = data.data.contacts.map(o=>o.username);
        const distinct = (value,index,self)=>{
            return self.indexOf(value)==index;
        }
        const contacts = raw_contacts.filter(distinct);
        // console.log(`Contacts:`);
        contactsContainer.innerHTML = ""
        contacts.forEach((el,index)=>{
            const contactContainer = document.createElement("div");
            contactContainer.classList.add("contact");
            contactContainer.classList.add("waves-effect");
            contactContainer.classList.add("waves-light");
            contactContainer.classList.add("hoverable");
            const contactText = document.createElement("p");
            contactText.innerText = el;
            contactContainer.appendChild(contactText);
            contactsContainer.appendChild(contactContainer);
            contactContainer.addEventListener("click",contactButtonHandler);
        })
    })
}
function contactButtonHandler(e){
    const contactName = e.target.innerText;
    const username = localStorage.getItem("marlinspike-username");
    const data = {
        username1: username,
        username2: contactName,
        n:5
    }
    currentContact = contactName;
    axios.post("/users/getMessages",data).then(({data})=>{
        transcriptContainer.innerHTML = ""
        // console.log(data)
        const log = data.log.log;
        log.forEach(async ({sender,receiver,message},index)=>{
            const messageContainer = document.createElement("div");
            if(sender===localStorage.getItem("marlinspike-username")){
                messageContainer.classList.add("sent-message")
            }else{
                messageContainer.classList.add("received-message")
            }
            const messageText = document.createElement("p");
            const decryptedmessage = await decryptMessage(message)
            messageText.innerText =sender+": "+decryptedmessage;
            messageContainer.appendChild(messageText);
            transcriptContainer.appendChild(messageContainer)
            transcriptContainer.scrollTop = transcriptContainer.scrollHeight;
        })
        console.log(`emitting join contact room for ${currentContact}`)
    })
    socket.emit("join-contact-room",{username1:localStorage.getItem("marlinspike-username"),username2:contactName});
    transcriptContainer.scrollTop = transcriptContainer.scrollHeight;
    verifyKeyChain();
}
async function verifyKeyChain(){
    db.get(`secret-${currentContact}-${localStorage.getItem("marlinspike-username")}`,{asBuffer:false},(err,secret)=>{
        if(err){
            axios.post("/fetchKey",{username1:localStorage.getItem("marlinspike-username"),username2:currentContact}).then(({data:{key}})=>{
                db.put(`secret-${currentContact}-${localStorage.getItem("marlinspike-username")}`,key,err=>{
                    if(err){
                        console.log(err)
                    }else{
                        console.log(`[fetched from db] Your key for communicating with ${currentContact} is : ${key}`);
                        currentSecret = key;
                        swal.fire(`Set up secure chat with ${currentContact}`,`Please note that you can only read and send messages from this browser.`,`info`)
                    }
                })
            })     
        }else{
            console.log(`[fetched from level] Your key for communicating with ${currentContact} is : ${secret}`)
            currentSecret = secret;
        }
    })
    transcriptContainer.scrollTop = transcriptContainer.scrollHeight;
}
addContactButton.addEventListener("click",addContact)

async function decryptMessage(encrypted_text){
    const secretKey = currentSecret;
    const {data:{userPublicKey,contactPublicKey,sharedIV,sharedPrime,sharedGenerator}} = await axios.post("/fetchPublicKey",{
        username1:localStorage.getItem("marlinspike-username"),
        username2:currentContact
    });
    const dfObject = crypto.createDiffieHellman(Buffer.from(sharedPrime,"hex"),Buffer.from(sharedGenerator,"hex"));
    dfObject.setPublicKey(Buffer.from(userPublicKey,"hex"));//our public key for this conversation
    dfObject.setPrivateKey(Buffer.from(secretKey,"hex"));//our private key for this conversation
    const sharedSecret=dfObject.computeSecret(Buffer.from(contactPublicKey,"hex"))
    const decipher = crypto.createDecipheriv("aes-256-cbc",sharedSecret,Buffer.from(sharedIV,"hex"));
    let decrypted = decipher.update(encrypted_text,'base64','utf8');
    return (decrypted+decipher.final("utf8"))
}
async function encryptMessage(text){
    const secretKey = currentSecret;
    const {data:{userPublicKey,contactPublicKey,sharedIV,sharedPrime,sharedGenerator}} = await axios.post("/fetchPublicKey",{
        username1:localStorage.getItem("marlinspike-username"),
        username2:currentContact
    });
    const dfObject = crypto.createDiffieHellman(Buffer.from(sharedPrime,"hex"),Buffer.from(sharedGenerator,"hex"));
    dfObject.setPublicKey(Buffer.from(userPublicKey,"hex"));//our public key for this conversation
    dfObject.setPrivateKey(Buffer.from(secretKey,"hex"));//our private key for this conversation
    const sharedSecret=dfObject.computeSecret(Buffer.from(contactPublicKey,"hex"))
    //add aes-256 encryption using shared secret to return encrypted hex. 
    let  cipher = crypto.createCipheriv("aes-256-cbc",sharedSecret,Buffer.from(sharedIV,"hex"));
    let encryptedMessage = cipher.update(text,"utf8","base64");
    encryptedMessage+=cipher.final("base64");
    // console.log(encryptedMessage)
    return encryptedMessage
}