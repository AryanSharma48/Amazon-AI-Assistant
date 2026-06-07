const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const handleAPIRequest = require('./api/apiCall');

// 1. Validate API Key on Startup
if (!process.env.API_KEY) {
    console.error("FATAL ERROR: API_KEY environment variable is not defined.");
    process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 8080;

// 2. Restrict CORS to browser extensions and local development
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || origin.startsWith('chrome-extension://') || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
            callback(null, true);
        } else {
            callback(new Error('CORS Policy: Access denied for this origin.'));
        }
    }
}));

app.use(express.json({ limit: '10mb' }));

// 3. Define Rate Limiter
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: { 
        success: false, 
        error: "Too many requests, please try again after 15 minutes." 
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

app.get('/health', (req, res) => {
    res.json({ success: true, message: "Server is healthy" });
});

app.post("/api/summarize", apiLimiter, async (req, res) => {
    try {
        const summary = await handleAPIRequest(req.body.reviewArr);
        res.json({ success: true, answer: summary });
    } catch (err) {
        console.error('[Backend] Error in /api/summarize:', err.message);
        res.status(500).json({ 
            success: false, 
            error: err.message || "Internal Server Error" 
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
