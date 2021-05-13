const mongoose = require("mongoose");

const UsersSchema = mongoose.Schema({
    username:String,
    hash:String,
    contacts:[{
        username: String,
        contactPublicKey: String,
        userPublicKey: String,
        sharedIV:String,
        sharedPrime:String,
        sharedGenerator:String
    }]
});

module.exports = mongoose.model("Users",UsersSchema);