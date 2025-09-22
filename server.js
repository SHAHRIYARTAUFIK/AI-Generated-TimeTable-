// Import necessary packages
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
// We remove `node-fetch` from here because we will import it dynamically.

// Load environment variables from the .env file
dotenv.config();

// Create an Express application
const app = express();
const PORT = 3000; // The port our server will run on

// Middleware setup
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Allow the server to understand JSON in request bodies

// --- NEW: Helper function for waiting ---
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// --- NEW: Health Check Endpoint ---
app.get('/', (req, res) => {
    res.send('Proxy server is running!');
});

// Define the proxy endpoint that our frontend will call
app.post('/api/gemini', async (req, res) => {
    console.log('Received a request to /api/gemini');

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'AIzaSy...your...actual...api...key...here') {
        console.error('🔴 ERROR: GEMINI_API_KEY is not set or is still a placeholder in the .env file.');
        return res.status(500).json({ error: 'Server configuration error: API key is missing.' });
    }

    try {
        const fetch = (await import('node-fetch')).default;
        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;
        const { prompt, generationConfig } = req.body;

        if (!prompt) {
            console.error('🔴 ERROR: No prompt was received from the frontend.');
            return res.status(400).json({ error: 'Bad Request: No prompt provided.' });
        }

        const payload = {
            contents: [{ parts: [{ text: prompt }] }],
        };
        if (generationConfig) {
            payload.generationConfig = generationConfig;
        }

        // --- NEW: Retry logic with exponential backoff ---
        const maxRetries = 5;
        let lastError = null;

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            console.log(`Sending request to Gemini API (Attempt ${attempt + 1})...`);
            try {
                const apiResponse = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });

                if (apiResponse.ok) {
                    const data = await apiResponse.json();
                    console.log('✅ Successfully received response from Gemini. Sending back to client.');
                    return res.json(data); // Success, send response and exit function
                }
                
                // If we get a 429 error, we wait and retry.
                if (apiResponse.status === 429) {
                    const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000; // Exponential delay + jitter
                    console.warn(`🟡 WARN: Received 429 (Too Many Requests). Retrying in ${Math.round(delay / 1000)}s...`);
                    await sleep(delay);
                    continue; // Go to the next attempt
                }
                
                // For other errors, we fail immediately.
                const errorBody = await apiResponse.text();
                console.error(`🔴 ERROR: Gemini API responded with status ${apiResponse.status}.`);
                console.error('Error Body:', errorBody);
                lastError = new Error(`API Error: ${apiResponse.status}`);
                break; // Exit the loop for non-retriable errors

            } catch (networkError) {
                lastError = networkError;
                console.error('🔴 Network error during fetch:', networkError.message);
                break; // Exit loop on network errors
            }
        }
        
        // If the loop finishes without a successful response, throw the last known error.
        throw lastError || new Error("Exhausted all retries without a successful response.");

    } catch (error) {
        console.error("🔴 CATCH BLOCK ERROR in /api/gemini:", error.message);
        res.status(500).json({ error: 'Failed to fetch from the AI API due to an internal server error.' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`✨ Server is running on http://localhost:${PORT}`);
    console.log('Waiting for requests...');
});

