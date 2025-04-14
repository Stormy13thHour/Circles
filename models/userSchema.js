const mongoose = require('mongoose');

const linkSchema = new mongoose.Schema({
    title: { type: String, required: true },
    url: { type: String, required: true },
    icon: String
}, { _id: true });

const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    bio: String,
    profileImage: String,
    headline: String,
    socials: {
        facebook: String,
        x: String,
        instagram: String,
        linkedin: String,
        github: String
    },
    links: [linkSchema],
    circleMembers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    circleRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    circles: [{
        name: String,
        members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        order: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
    }]
});

module.exports = mongoose.model('User', userSchema);
