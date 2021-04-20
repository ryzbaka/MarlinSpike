const profileHeader = document.getElementById("profile-name");
const logoutbtn = document.querySelector(".logout-button");
if(localStorage.getItem("marlinspike-username")===null){
    window.location.replace("/")
}else{
    profileHeader.innerText = localStorage.getItem("marlinspike-username")
}

function logout(){
    localStorage.removeItem("marlinspike-username")
    window.location.replace("/")
}
logoutbtn.addEventListener("click",logout);