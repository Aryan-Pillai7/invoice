const express = require('express');
const router = express.Router(); 

const {
    createInvoice, 
    addItem, 
    deleteLastItem, 
    clearInvoice, 
    generatePDF
} = require('./controllers.js'); 

router.post('/create', createInvoice); 
router.post('/add-item', addItem); 
router.delete('/delete-last-item/:invoice_id', deleteLastItem); 
router.delete('/clear/:invoice_id', clearInvoice); 
router.get('/generate-pdf/:invoice_id', generatePDF); 

module.exports = router; 