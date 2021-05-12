const mongoose = require("mongoose");

const KeysSchema = mongoose.Schema({
    participants : [String], //sorted list of participating usernames.
    privateKey1:{
        username:String,
        key:String
    },
    privateKey2:{
        username:String,
        key:String
    }

});

module.exports = mongoose.model("Keys",KeysSchema);