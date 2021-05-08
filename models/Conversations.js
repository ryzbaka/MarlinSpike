const mongoose = require("mongoose");

const ConversationsSchema = mongoose.Schema({
    participants : [String],
    log : [
        {
            message:String,
            sender:String,
            receiver:String
        }
    ]
});

module.exports = mongoose.model("Conversations",ConversationsSchema);