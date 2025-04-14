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

// Send Circle Request
router.post("/circle/request", async (req, res) => {
    const { fromUserId, toUserId } = req.body;
    try {
        const toUser = await User.findById(toUserId);
        if (!toUser) return res.status(404).json({ error: "User not found" });

        if (toUser.circleRequests.includes(fromUserId) || toUser.circleMembers.includes(fromUserId)) {
            return res.status(400).json({ error: "Already requested or connected" });
        }

        toUser.circleRequests.push(fromUserId);
        await toUser.save();

        res.json({ message: "Request sent" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Accept Circle Request
router.post("/circle/accept", async (req, res) => {
    const { fromUserId, toUserId } = req.body;
    try {
        const fromUser = await User.findById(fromUserId);
        const toUser = await User.findById(toUserId);

        if (!fromUser || !toUser) return res.status(404).json({ error: "User not found" });

        if (!toUser.circleRequests.includes(fromUserId)) {
            return res.status(400).json({ error: "No such request" });
        }

        toUser.circleMembers.push(fromUserId);
        fromUser.circleMembers.push(toUserId);
        toUser.circleRequests = toUser.circleRequests.filter(id => id.toString() !== fromUserId);

        await fromUser.save();
        await toUser.save();

        res.json({ message: "Connection accepted" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Decline Circle Request
router.post("/circle/decline", async (req, res) => {
    const { fromUserId, toUserId } = req.body;
    try {
        const toUser = await User.findById(toUserId);
        if (!toUser) return res.status(404).json({ error: "User not found" });

        toUser.circleRequests = toUser.circleRequests.filter(id => id.toString() !== fromUserId);
        await toUser.save();

        res.json({ message: "Request declined" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create a new circle
router.post('/:userId/circles', async (req, res) => {
    try {
        const { name } = req.body;
        const user = await User.findById(req.params.userId);
        if (!user) return res.status(404).json({ error: "User not found" });

        user.circles.push({ name, members: [], order: [] });
        await user.save();
        res.status(201).json(user.circles);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update circle name or reorder members
router.patch('/:userId/circles/:circleIndex', async (req, res) => {
    try {
        const { name, order } = req.body; // Optional
        const user = await User.findById(req.params.userId);
        if (!user || !user.circles[req.params.circleIndex])
            return res.status(404).json({ error: "Circle not found" });

        if (name) user.circles[req.params.circleIndex].name = name;
        if (order) user.circles[req.params.circleIndex].order = order;

        await user.save();
        res.json(user.circles[req.params.circleIndex]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add member to a circle
router.post('/:userId/circles/:circleIndex/members', async (req, res) => {
    try {
        const { memberId } = req.body;
        const user = await User.findById(req.params.userId);
        const circle = user?.circles[req.params.circleIndex];
        if (!user || !circle) return res.status(404).json({ error: "Circle not found" });

        if (!circle.members.includes(memberId)) {
            circle.members.push(memberId);
            circle.order.push(memberId);
            await user.save();
        }

        res.json(circle);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Remove member from a circle
router.delete('/:userId/circles/:circleIndex/members/:memberId', async (req, res) => {
    try {
        const { userId, circleIndex, memberId } = req.params;
        const user = await User.findById(userId);
        const circle = user?.circles[circleIndex];
        if (!user || !circle) return res.status(404).json({ error: "Circle not found" });

        circle.members = circle.members.filter(id => id.toString() !== memberId);
        circle.order = circle.order.filter(id => id.toString() !== memberId);

        await user.save();
        res.json(circle);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete a whole circle
router.delete('/:userId/circles/:circleIndex', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user || !user.circles[req.params.circleIndex])
            return res.status(404).json({ error: "Circle not found" });

        user.circles.splice(req.params.circleIndex, 1);
        await user.save();
        res.json(user.circles);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
