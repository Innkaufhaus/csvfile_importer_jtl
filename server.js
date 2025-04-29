const express = require('express');
const path = require('path');
const axios = require('axios');
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.json());

// Serve static files from the root directory
app.use(express.static(path.join(__dirname)));

// Serve sample data
app.get('/sample-data.csv', (req, res) => {
    res.sendFile(path.join(__dirname, 'sample-data.csv'));
});

// POST /api/scan-gtin endpoint
app.post('/api/scan-gtin', async (req, res) => {
    const { gtin } = req.body;
    if (!gtin) {
        return res.status(400).json({ error: 'GTIN is required' });
    }

    const oxylabsUsername = 'innkaufhaus';
    const oxylabsPassword = 'XNA0qcjdjwxqx#yeg';

    try {
        // Example Oxylabs e-commerce scraper API URL and parameters
        const apiUrl = 'https://api.oxylabs.io/v1/ecommerce/scraper';

        // Construct request payload
        const payload = {
            gtin: gtin,
            // Add other parameters as needed
        };

        // Make authenticated request to Oxylabs API
        const response = await axios.post(apiUrl, payload, {
            auth: {
                username: oxylabsUsername,
                password: oxylabsPassword
            }
        });

        // Return scraped data
        res.json(response.data);
    } catch (error) {
        console.error('Error calling Oxylabs API:', error.message);
        res.status(500).json({ error: 'Failed to fetch data from Oxylabs API' });
    }
});

// Handle all other routes by serving index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Get port from environment variable or use 3000 as default
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log('Available routes:');
    console.log('  - / (main application)');
    console.log('  - /sample-data.csv (sample data file)');
    console.log('  - POST /api/scan-gtin (GTIN scan API)');
});
