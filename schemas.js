const mongoose = require("mongoose");
const passportLoocalMongoose = require("passport-local-mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    username: String,
});

UserSchema.plugin(passportLoocalMongoose);

module.exports = mongoose.model("User", UserSchema);