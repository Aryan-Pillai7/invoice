let invoiceId = null;
let products = [];
let totalAmount = 0;
let invoiceItems = [];

async function createInvoice() {
    const customerName = document.getElementById('customerNameInput').value.trim();
    const customerPhone = document.getElementById('customerPhoneInput').value.trim();

    if (!customerPhone) {
        alert('Please enter customer phone number first.');
        return;
    }

    const res = await fetch('http://localhost:5000/api/invoice/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            customer_name: customerName, 
            customer_phone: customerPhone            
        })
    });
    const data = await res.json();
    invoiceId = data.invoice_id;
    totalAmount = 0;  // Reset total amount for new invoice
    invoiceItems = [];

    alert(`Invoice created! for ${customerPhone}`);
    document.getElementById('invoiceContainer').innerHTML = '';
    const container = document.getElementById('invoiceContainer');
    container.innerHTML = `<div class="invoice-header">Customer: ${customerName} (${customerPhone})</div>`;
    updateInvoiceDisplay();
}

async function loadProducts() {
    // Simulate fetching from DB
    const res = await fetch('http://localhost:5000/api/invoice/products'); 
    products = await res.json(); 

    const select = document.getElementById('productSelect');
    select.innerHTML = ''; 

    products.forEach(p => {
        const option = document.createElement('option');
        option.value = p.id;
        option.textContent = `${p.name} - ₹${p.price}`;
        select.appendChild(option);
    });
}

async function addItem() { 
    console.log("Add item - scripts.js");

    const productId = document.getElementById('productSelect').value;
    const quantity = document.getElementById('quantityInput').value;

    console.log('Current InvoiceId: ', invoiceId);

    if (!invoiceId) return alert('Please create an invoice first.');
    if (!productId || quantity <= 0) return alert('Select a valid item and quantity.');

    const res = await fetch('http://localhost:5000/api/invoice/add-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            invoice_id: invoiceId,
            product_id: parseInt(productId),
            quantity: parseInt(quantity)
        })
    });

    const responseData = await res.json();
    const product = products.find(p => p.id == productId);
    const lineTotal = responseData.lineTotal || (product.price * quantity);

    totalAmount += lineTotal;
    invoiceItems.push({ name: product.name, quantity: parseInt(quantity), price: product.price, lineTotal });
    updateInvoiceDisplay();
}

function updateInvoiceDisplay() {
    const container = document.getElementById('invoiceContainer');
    // Keep the header if present
    const header = container.querySelector('.invoice-header');
    container.innerHTML = '';
    if (header) container.appendChild(header);

    // Render all items as a list
    if (invoiceItems.length > 0) {
        const table = document.createElement('table');
        table.className = 'invoice-table';
        table.innerHTML = `<tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr>`;
        invoiceItems.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `<td>${item.name}</td><td>${item.quantity}</td><td>₹${item.price}</td><td>₹${item.lineTotal}</td>`;
            table.appendChild(row);
        });
        container.appendChild(table);
    }

    // Render total at the end
    let totalElement = document.getElementById('invoiceTotalAmount');
    if (!totalElement) {
        totalElement = document.createElement('div');
        totalElement.id = 'invoiceTotalAmount';
        totalElement.className = 'invoice-total';
    }
    totalElement.innerHTML = `<strong>Total Amount: ₹${totalAmount}</strong>`;
    container.appendChild(totalElement);
}

async function deleteLastItem() {
    console.log('Delete last item called, invoiceId:', invoiceId);
    
    if (!invoiceId) {
        alert('Create an invoice first.');
        return;
    }
    
    try {
        const res = await fetch(`http://localhost:5000/api/invoice/delete-last-item/${invoiceId}`, {
            method: 'DELETE'
        });
        
        const responseData = await res.json();
        console.log('Delete response:', responseData);
        
        if (!res.ok) {
            throw new Error(responseData.error || 'Failed to delete item');
        }

        // Get the line total from the response
        const lineTotal = responseData.lineTotal;
        if (lineTotal !== undefined) {
            totalAmount = Math.max(0, totalAmount - lineTotal);  // Ensure total doesn't go below 0
            invoiceItems.pop(); // Remove last item
            console.log('Updated total amount:', totalAmount);
        }
        updateInvoiceDisplay();
    } catch (error) {
        console.error('Error deleting item:', error);
        alert(`Error deleting item: ${error.message}`);
    }
}

async function clearInvoice() {
    console.log('Clear invoice called, invoiceId:', invoiceId);
    
    if (!invoiceId) {
        alert('Create an invoice first.');
        return;
    }
    
    try {
        const res = await fetch(`http://localhost:5000/api/invoice/clear/${invoiceId}`, {
            method: 'DELETE'
        });
        
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || 'Failed to clear invoice');
        }
        
        totalAmount = 0;  // Reset total amount when clearing invoice
        invoiceItems = [];
        // Keep the header but remove all items
        updateInvoiceDisplay();
    } catch (error) {
        console.error('Error clearing invoice:', error);
        alert(`Error clearing invoice: ${error.message}`);
    }
}

// async function generatePDF() {
//     if (!invoiceId) return alert('Create an invoice first.');
//     window.open(`http://localhost:5000/api/invoice/generate-pdf/${invoiceId}`, '_blank');
// }

window.onload = loadProducts;
