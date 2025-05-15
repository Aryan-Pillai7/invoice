const pool = require('./db.js'); 
const PDFDocument = require('pdfkit'); 

const loadProducts = async (req, res) => {
    try {
        const result = await pool.query('SELECT product_id AS id, product_name AS name, price FROM product;');
        res.json(result.rows); 
    } catch (err) {
        console.log(err); 
        res.status(500).json({ error : 'Failed to fetch' });
    }
}

const getInvoice = async (req, res) => {
    const { invoice_id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM Invoice WHERE invoice_id = $1', [invoice_id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Invoice not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: err.message });
    }
}

const createInvoice = async (req, res) => {
    console.log('Recieved create invoice request: ', req.body);
    const { customer_name, customer_phone } = req.body; 

    if (!customer_phone || customer_phone.trim() === '') {
        return res.status(400).json({ error: 'Customer phone is required' });
    }

    try {
        // First check if the customer already exists
        let customerResult = await pool.query(
            'SELECT customer_id, customer_name FROM Customer WHERE customer_phone = $1', 
            [customer_phone]
        );

        let customerId;
        
        if (customerResult.rows.length > 0) {
            // Customer exists, use their ID
            customerId = customerResult.rows[0].customer_id;
            
            // Update the customer name if it's different
            if (customerResult.rows[0].customer_name !== customer_name) {
                await pool.query(
                    'UPDATE Customer SET customer_name = $1 WHERE customer_id = $2',
                    [customer_name, customerId]
                );
            }
        } else {
            // Check the structure of the Customer table
            const tableInfo = await pool.query(`
                SELECT column_name, is_nullable, column_default
                FROM information_schema.columns
                WHERE table_name = 'customer'
                ORDER BY ordinal_position
            `);
            
            // Log the table structure for debugging
            console.log('Customer table structure:', tableInfo.rows);
            
            // Create query dynamically based on required fields
            const requiredColumns = tableInfo.rows
                .filter(col => col.is_nullable === 'NO' && col.column_default === null && col.column_name !== 'customer_id')
                .map(col => col.column_name);
            
            // Always include customer_name and customer_phone
            let columns = ['customer_name', 'customer_phone'];
            let values = [customer_name, customer_phone];
            let placeholders = ['$1', '$2'];
            
            // Add any other required columns with default values
            requiredColumns.forEach((col, index) => {
                if (!columns.includes(col)) {
                    columns.push(col);
                    // Use default values for other required columns
                    if (col === 'user_id') {
                        values.push(1);  // Default user_id
                    } else {
                        values.push(null);  // Default value for other columns
                    }
                    placeholders.push(`${index + 3}`);
                }
            });
            
            const query = `
                INSERT INTO Customer (${columns.join(', ')}) 
                VALUES (${placeholders.join(', ')}) 
                RETURNING customer_id
            `;
            
            console.log('Generated INSERT query:', query);
            console.log('With values:', values);
            
            const newCustomerResult = await pool.query(query, values);
            customerId = newCustomerResult.rows[0].customer_id;
        }

        const result = await pool.query(
            'INSERT INTO  Invoice (customer_id, total_amount) VALUES ($1, 0) RETURNING invoice_id', [customerId]
        );

        // Log the result for debugging
        console.log('Invoice created with ID:', result.rows[0].invoice_id);
        
        const invoiceData = {
            invoice_id: result.rows[0].invoice_id,
            customer_name,
            customer_phone
        };
        
        console.log('Sending response:', invoiceData);
        res.status(201).json(invoiceData); 
    } catch (err) {
        console.log(err); 
        res.status(500).json({ error : err.message });
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
        res.status(500).json({ error : err.message});
    }
}; 

const clearInvoice = async (req, res) => {
    const { invoice_id } = req.params; 
    try { 
        await pool.query('DELETE FROM Invoice_Item WHERE invoice_id = $1', [invoice_id]); 
        await pool.query('UPDATE Invoice SET total_amount = 0 WHERE invoice_id = $1', [invoice_id]);
        res.status(200).json({ message : 'Invoice cleared' });  
    } catch(err) {
        res.status(500).json({error : err.message}); 
    }
}; 

// const generatePDF = async (req, res) => { 
//     const { invoice_id } = req.params; 
//     try { 
//         const invoice = await pool.query('SELECT * FROM Invoice WHERE invoice_id = $1',[invoice_id]); 
//         const items = await pool.query(
//             `SELECT p.product_name, i.quantity, i.line_total
//             FROM Invoice_Item i
//             JOIN Product p ON i.product_id = p.product_id
//             WHERE invoice_id = $1`,
//             [invoice_id]
//         );

//         const doc = new PDFDocument(); 
//         res.setHeader('Content-Type', 'application/pdf'); 
//         res.setHeader('Content-Disposition', `attachment; filename=invoice_${invoice_id}.pdf`);
//         doc.pipe(res); 

//         doc.fontSize(16).text(`Invoice #${invoice_id}`, { align: 'center' });
//         doc.text(`Date: ${new Date(invoice.rows[0].invoice_date).toLocaleDateString()}`);
//         doc.text(`Total: ₹${invoice.rows[0].total_amount}`);
        
//         doc.moveDown(); 
//         doc.text('Item:', { underline: true });
//         items.rows.forEach(item => {
//             doc.text(`${item.product_name} x ${item.quantity} = ₹${item.line_total}`);
//         });

//         doc.end(); 
//     } catch (err) { 
//         console.log('PDF Generation Error: ', err); 
//         res.status(500).json({ error : err.message });
//     }
// };

module.exports = {
    loadProducts, 
    createInvoice,
    addItem,
    deleteLastItem,
    clearInvoice,
    // generatePDF 
};
