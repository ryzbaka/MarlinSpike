const axios = require("axios")
const usernameField = document.getElementById("username");
const passwordField = document.getElementById("password");
const submitBtn = document.querySelector(".submit-button")

function showMessage(heading,message="",type){
    swal(heading,message,type)    
}

function validateForm(){
    username = usernameField.value;
    password = passwordField.value;
    const data = {
        username:username,
        password:password
    }
    console.log(data)
    axios.post("/users/signin",data).then((response)=>{
        const {message,messagetype} = response.data;
        swal(message,"",messagetype).then((response)=>{
            if(message==="Authentication successful."){
            localStorage.setItem("marlinspike-username",username)
            localStorage.setItem("marlinspike-password",password)
            window.location.replace("/profile");
        }
        })
    })
    
}

submitBtn.addEventListener("click",validateForm)