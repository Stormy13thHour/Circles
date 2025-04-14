const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');
require('dotenv').config()
const cors = require('cors')

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

app.use(cors({
    origin: ['http://localhost:3000', 'https://your-frontend.web.app']
}))


mongoose.connect(process.env.MONGO_URI)


mongoose.connection.on('connected', () => {
    console.log('Connected to MongoDB successfully');
});
mongoose.connection.on('error', (err) => {
    console.log('MongoDB connection error:', err);
});

app.use('/api/users', userRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
