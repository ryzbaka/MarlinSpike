const swal = require("sweetalert2")
const axios = require("axios")

const profileHeader = document.getElementById("profile-name");
const logoutbtn = document.querySelector(".logout-button");
const sendMessageButton = document.querySelector("#send-button")
const messageInput = document.querySelector(".message-input");
const addContactButton = document.querySelector(".add-contact-button")
const transcriptContainer = document.querySelector(".transcript-container");
transcriptContainer.scrollTop = transcriptContainer.scrollHeight;

let socket;
if(localStorage.getItem("marlinspike-username")===null){
    window.location.replace("/")
}else{
    profileHeader.innerText = localStorage.getItem("marlinspike-username")
    socket = io();
}

function logout(){
    localStorage.removeItem("marlinspike-username")
    window.location.replace("/")
}
logoutbtn.addEventListener("click",logout);


socket.on("connect",()=>{
    socket.emit("connected-to-server",{username:"testpilot"})
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
    addMessageToTranscriptContainer(messageText,"sent-message")
    socket.emit("client-sent-message",{
        sender:localStorage.getItem("marlinspike-username"),
        receiver:"Alice",
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
        }
    })
}

addContactButton.addEventListener("click",addContact)