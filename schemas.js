const mongoose = require("mongoose");
const passportLoocalMongoose = require("passport-local-mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    rooms: [{ type: String, ref: 'Room' }],
    username: String,
});

UserSchema.plugin(passportLoocalMongoose);

module.exports.User = mongoose.model("User", UserSchema);


const RoomSchema = new Schema({
    name: String
});

module.exports.Room = mongoose.model("Room", RoomSchema);