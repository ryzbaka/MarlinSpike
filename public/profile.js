const swal = require("sweetalert2")
const axios = require("axios")

const profileHeader = document.getElementById("profile-name");
const logoutbtn = document.querySelector(".logout-button");
const sendMessageButton = document.querySelector("#send-button")
const messageInput = document.querySelector(".message-input");
const addContactButton = document.querySelector(".add-contact-button")
const transcriptContainer = document.querySelector(".transcript-container");
const contactsContainer = document.querySelector(".contacts-container");
transcriptContainer.scrollTop = transcriptContainer.scrollHeight;
let currentContact="null";

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
socket.on("server-sent-message",({sender,receiver,message})=>{
    if([sender,receiver].includes(currentContact)){
        if(sender===localStorage.getItem("marlinspike-username")){
            addMessageToTranscriptContainer(sender+": "+message,"sent-message");
        }else{
            addMessageToTranscriptContainer(sender+": "+message,"received-message");
        }
    }
    axios.post("/users/addMessage",{
        sender:sender,
        receiver:receiver,
        message:message
    })
})

function addMessageToTranscriptContainer(message, type){
    const messageContainer = document.createElement("div");
    messageContainer.classList.add(type);
    const messageText = document.createElement("p");
    messageText.innerText = message;
    messageContainer.appendChild(messageText);
    transcriptContainer.appendChild(messageContainer);
    transcriptContainer.scrollTop=transcriptContainer.scrollHeight;
}

sendMessageButton.addEventListener("click",()=>{
    const messageText = messageInput.value;
    // addMessageToTranscriptContainer(messageText,"sent-message")
    socket.emit("client-sent-message",{
        sender:localStorage.getItem("marlinspike-username"),
        receiver:currentContact,
        message:messageText
    })
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
        const raw_contacts = data.data.contacts;
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
        const log = data.log.log;
        log.forEach(({sender,receiver,message},index)=>{
            const messageContainer = document.createElement("div");
            if(sender===localStorage.getItem("marlinspike-username")){
                messageContainer.classList.add("sent-message")
            }else{
                messageContainer.classList.add("received-message")
            }
            const messageText = document.createElement("p");
            messageText.innerText =sender+": "+message;
            messageContainer.appendChild(messageText);
            transcriptContainer.appendChild(messageContainer)
        })
        transcriptContainer.scrollTop = transcriptContainer.scrollHeight;
        socket.emit("join-contact-room",{username1:localStorage.getItem("marlinspike-username"),username2:contactName});
    })
}
addContactButton.addEventListener("click",addContact)