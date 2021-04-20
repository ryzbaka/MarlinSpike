const axios = require("axios")
const usernameField = document.getElementById("username");
const passwordField = document.getElementById("password")
const passwordField2 = document.getElementById("password2")
const submitBtn = document.querySelector(".submit-button")

function showMessage(heading,message="",type){
    swal(heading,message,type)    
}

function validateForm(){
    username = usernameField.value;
    password = passwordField.value;
    password2 = passwordField2.value;
    if(username.length<8){
        showMessage("Uh oh!","Username cannot be less than 8 characters","error");
    }
    else if(password.length<8){
        showMessage("Uh oh!","Password cannot be less than 8 characters","error");
    }
    else if(password!==password2){
        showMessage("Uh oh!","Passwords do not match","error");
    }
    else{
        const data = {
            username:username,
            password:password
        }
        axios.post("/users/signup",data).then((response)=>{
            const {message,messagetype} = response.data;
            swal(message,"",messagetype)
        })
    }
}

submitBtn.addEventListener("click",validateForm)