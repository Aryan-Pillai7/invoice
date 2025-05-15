const express = require('express');
const router = express.Router(); 

const {
    loadProducts, 
    createInvoice, 
    addItem, 
    deleteLastItem, 
    clearInvoice, 
    // generatePDF
} = require('./controllers.js'); 

router.get('/products', loadProducts);
router.post('/create', createInvoice); 
router.post('/add-item', addItem); 
router.delete('/delete-last-item/:invoice_id', deleteLastItem); 
router.delete('/clear/:invoice_id', clearInvoice); 
// router.get('/generate-pdf/:invoice_id', generatePDF); 

module.exports = router; 