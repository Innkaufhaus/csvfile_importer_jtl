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

const fetch = require('node-fetch');

// POST /api/scan-gtin endpoint
app.post('/api/scan-gtin', async (req, res) => {
    const { gtin } = req.body;
    if (!gtin) {
        return res.status(400).json({ error: 'GTIN is required' });
    }

    const oxylabsUsername = 'innkaufhaus';
    const oxylabsPassword = 'XNA0qcjdjwxqx#yeg';

    try {
        const apiUrl = 'https://realtime.oxylabs.io/v1/queries';

        const body = {
            source: 'amazon_search',
            parse: true,
            parsing_instructions: {
                results: {
                    _fns: [
                        {
                            _fn: 'css',
                            _args: ['.s-result-item[data-component-type="s-search-result"]']
                        }
                    ],
                    _items: {
                        price: {
                            _fns: [
                                { _fn: 'css_one', _args: ['.a-price > span'] },
                                { _fn: 'element_text' },
                                { _fn: 'amount_from_string' }
                            ]
                        },
                        title: {
                            _fns: [
                                { _fn: 'css_one', _args: ['h2 > a > span'] },
                                { _fn: 'element_text' }
                            ]
                        },
                        rating: {
                            _fns: [
                                { _fn: 'css_one', _args: ['i.a-icon-star-small'] },
                                { _fn: 'element_text' },
                                { _fn: 'amount_range_from_string' },
                                { _fn: 'select_nth', _args: [0] }
                            ]
                        },
                        'rating count': {
                            _fns: [
                                { _fn: 'css_one', _args: ['[data-csa-c-content-id="alf-customer-ratings-count-component"]'] },
                                { _fn: 'element_text' },
                                { _fn: 'amount_from_string' }
                            ]
                        }
                    }
                }
            },
            query: gtin,
            domain: 'de',
            locale: 'de-de'
        };

        const response = await fetch(apiUrl, {
            method: 'POST',
            body: JSON.stringify(body),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' + Buffer.from(`${oxylabsUsername}:${oxylabsPassword}`).toString('base64')
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Oxylabs API error: ${response.status} ${errorText}`);
        }

        const data = await response.json();

        res.json(data);
    } catch (error) {
        console.error('Error calling Oxylabs API:', error.message);
        res.status(500).json({ error: 'Failed to fetch data from Oxylabs API', details: error.message });
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
