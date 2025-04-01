const express = require('express');
const router = express.Router();
const User = require('../models/userSchema');
const multer = require("multer");
const path = require("path");

// Multer setup for profile image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/"),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

// Get user by email
router.get('/email/:email', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.params.email.toLowerCase() });
        if (!user) return res.status(404).json({ error: "User not found" });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create user
router.post("/", async (req, res) => {
    try {
        let { username, email, name, profileImage } = req.body;
        if (!username || !email) {
            return res.status(400).json({ error: "Username and email are required." });
        }
        username = username.startsWith("@") ? username : `@${username}`;
        const existing = await User.findOne({ username });
        if (existing) {
            return res.status(400).json({ error: "That ID is already taken." });
        }
        const newUser = new User({
            username,
            email,
            name: name || username,
            profileImage: profileImage || "/uploads/default.png",
        });
        const saved = await newUser.save();
        res.status(201).json(saved);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all users
router.get("/", async (req, res) => {
    try {
        const users = await User.find({});
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update user profile
router.patch("/:id", async (req, res) => {
    try {
        const updateFields = {
            name: req.body.name,
            bio: req.body.bio,
            headline: req.body.headline,
        };

        if (req.body.socials) {
            updateFields.socials = req.body.socials;
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            updateFields,
            { new: true }
        );

        if (!updatedUser) return res.status(404).json({ error: "User not found" });
        res.json(updatedUser);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// Upload profile image
router.post("/:userId/profile-image", upload.single("image"), async (req, res) => {
    try {
        const imagePath = `/uploads/${req.file.filename}`;
        const user = await User.findByIdAndUpdate(
            req.params.userId,
            { profileImage: imagePath },
            { new: true }
        );
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add a new link
router.post("/:userId/links", async (req, res) => {
    try {
        const { title, url } = req.body;
        if (!title || !url) {
            return res.status(400).json({ error: "Title and URL are required." });
        }
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }
        user.links.push({ title, url });
        const updatedUser = await user.save();
        res.status(201).json(updatedUser);
    } catch (error) {
        console.error("Error adding link:", error);
        res.status(500).json({ error: "Server error while adding link." });
    }
});

// Delete a link
router.delete("/:userId/links/:linkId", async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) return res.status(404).json({ error: "User not found" });

        user.links = user.links.filter(link => link._id.toString() !== req.params.linkId);
        await user.save();

        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Save all links
router.patch("/:userId/links/save", async (req, res) => {
    try {
        const { links } = req.body;
        const user = await User.findByIdAndUpdate(
            req.params.userId,
            { links },
            { new: true }
        );
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// LAST: Get user by username (must come last to prevent conflict with above routes)
router.get("/:username", async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username })
            .populate('circle', 'username name profileImage');
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;