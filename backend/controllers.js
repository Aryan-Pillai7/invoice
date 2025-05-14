const pool = require('./db.js'); 
const PDFdoc = require('pdfkit'); 

const createInvoice = async (req, res) => {
    const { customer_id } = req.body; 
    try {
        const result = await pool.query(
            'INSERT INTO Invoice (customer_id, total_amount) VALUES ($1, 0) RETURNING *',
            [customer_id]
        ); 
        res.status(201).json(result.rows[0]); 
    } catch(err) { 
        res.status(500).json({ error : err.Message }); 
    }
}; 

const addItem = async (req, res) => {
    const { invoice_id, product_id, quantity } = req.body; 

    try {
        const priceRes = await pool.query('SELECT price FROM Product WHERE product_id = $1', [product_id]);
        const price = priceRes.rows[0].price; 
        const lineTotal = quantity * price; 

        await pool.query(
            'INSERT INTO Invoice_Item (invoice_id, product_id, quantity, lineTotal) VALUES($1, $2, $3, $4)', 
            [invoice_id, product_id, quantity, lineTotal] 
        ); 

        await pool.query(
            'UPDATE Invoice SET total_amount = total_amount + $1 WHERE invoice_id = $2', 
            [lineTotal, invoice_id]
        );

        res.status(200).json({ 'message' : 'Item Added'}); 
    } catch(err) {
        res.status(500).json({ error : err.message }); 
    }
}; 

const deleteLastItem = async (req, res) => {
    const invoice_id = req.params.invoice_id; 
    try { 
        const item = await pool.query(
            `SELECT * FROM Invoice_Item WHERE invoice_id = $1 ORDER BY invoice_item_id DESC LIMIT 1`, 
            [invoice_id]
        ); 
        if (item.rows.length===0) return res.status(404).json({ error : 'No item found' }); 

        const {invoice_item_id, lineTotal} = item.rows[0]; 

        await pool.query('DELETE FROM Invoice_Item WHERE invoice_item_id = $1', [invoice_item_id]); 
        await pool.query('UPDATE Invoice SET total_amount = total_amount - $1 WHERE invoice_id=$2', [lineTotal, invoice_id]); 

        res.status(200).json({ message : 'Last Item deleted'}); 
    } catch(err) {
        res.status(500).json({ error : err.Message});
    }
}; 

const clearInvoice = async (req, res) => {
    const { invoice_id } = req.params; 
    try { 
        await pool.query('DELETE FROM Invoice_Item WHERE invoice_id = $1', [invoice_id]); 
        await pool.query('UPDATE Invoice SET total_amount = 0 WHERE invoice_id = $1', [invoice_id]);
        res.status(200).json({ message : 'Invoice cleared' });  
    } catch(err) {
        res.status(500).json({error : err.Message}); 
    }
}; 

const generatePDF = async (req, res) => { 
    const { invoice_id } = req.params; 
    try { 
        const invoice = await pool.query('SELECT * FROM Invoice WHERE invoice_id = $1',[invoice_id]); 
        const items = await pool.query(
            `SELECT p.product_name, i.quantity, i.line_total
            FROM Invoice_Item i
            JOIN Product p ON i.product_id = p.product_id
            WHERE invoice_id = $1`,
            [invoice_id]
        );

        const doc = new PDFDocument(); 
        res.setHeader('Content-Type', 'application/pdf'); 
        res.setHeader('Content-Disposition', `attachment; filename=invoice_${invoice_id}.pdf`);
        doc.pipe(res); 

        doc.fontSize(16).text(`Invoice #${invoice_id}`, { align: 'center' });
        doc.text(`Date: ${new Date(invoice.rows[0].invoice_date).toLocaleDateString()}`);
        doc.text(`Total: ₹${invoice.rows[0].total_amount}`);
        
        doc.moveDown(); 
        doc.text('Item:', { underline: true });
        items.rows.forEach(item => {
            doc.text(`${item.product_name} x ${item.quantity} = ₹${item.line_total}`);
        });

        doc.end(); 
    } catch (err) { 
        res.status(500).json({ error : err.message });
    }
};

module.exports = {
    createInvoice,
    addItem,
    deleteLastItem,
    clearInvoice,
    generatePDF 
};
