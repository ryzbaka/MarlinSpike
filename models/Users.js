const mongoose = require("mongoose");

const UsersSchema = mongoose.Schema({
    username:String,
    hash:String,
    contacts:[String]
});

module.exports = mongoose.model("Users",UsersSchema);