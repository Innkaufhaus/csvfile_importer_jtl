const express = require('express');
const path = require('path');
const app = express();

// Serve static files from the root directory
app.use(express.static(path.join(__dirname)));

// Serve sample data
app.get('/sample-data.csv', (req, res) => {
    res.sendFile(path.join(__dirname, 'sample-data.csv'));
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
});
