const mongoose = require("mongoose");

const UsersSchema = mongoose.Schema({
    username:String,
    hash:String,
    contacts:[
        {
            username:String
        }
    ]
});

module.exports = mongoose.model("Users",UsersSchema);