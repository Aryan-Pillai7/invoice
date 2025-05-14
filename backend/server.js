
const express = require('express'); 
const cors = require('cors'); 
const bodyParser = require('body-parser'); 
const path = require('path');   

const invoiceRoutes = require('./routes.js'); 

const app = express(); 

app.use((req, res, next) => {
    res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self' 'unsafe-inline'; font-src 'self' data:; style-src 'self' 'unsafe-inline';"
    );
    next();
});

app.use(cors()); 
app.use(bodyParser.json()); 

app.use(express.static('frontend'));

app.use('/api/invoice', invoiceRoutes);

app.get('/api/invoice', (req, res) => {
    res.json({ message : 'Invoice API is running. Use specific endpoints for operation'});
});

// app.get('/', (req, res) => {
//     res.send('Invoice Generator API is running. Use /api/invoice endpoints to interact with the API.');
// });

app.get('/{*any}', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

app.use((req, res) => {
    console.log(`404 not found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ 
        error: 'Not found', 
        message: `The requested endpoint ${req.originalUrl} does not exist`
    });
});

app.listen(5000, () => {
    console.log('Server running on port 5000'); 
}); 