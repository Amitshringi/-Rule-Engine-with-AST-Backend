const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config(); // Load environment variables from .env file

const ruleRoutes = require('./routes/rules');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(helmet()); // Adds extra security by setting HTTP headers
app.use(express.json()); // Parse incoming JSON data

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('MongoDB Connected Successfully'))
    .catch((error) => {
        console.error('MongoDB Connection Error: ', error);
        process.exit(1); // Exit the process if MongoDB connection fails
    });

// Routes
app.use('/api/rules', ruleRoutes);

// Server Start with Error Handling
app.listen(PORT, (error) => {
    if (error) {
        console.error('Error starting the server: ', error);
        process.exit(1);
    }
    console.log(`Server is running on port ${PORT}`);
});
