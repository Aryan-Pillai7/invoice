let invoiceId = null;
let products = [];

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
        }) // Default customer_id for demo
    });
    const data = await res.json();
    invoiceId = data.invoice_id;

    alert(`Invoice created! for ${customerPhone}`);
    document.getElementById('invoiceContainer').innerHTML = '';
    container.innerHTML = `<div class="invoice-header">Customer: ${customerName} (${customerPhone})</div>`;
};

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

    totalAmount+=lineTotal;
    
    const container = document.getElementById('invoiceContainer');
    const div = document.createElement('div');
    div.className = 'invoice-item'; 
    div.innerHTML = `<strong>${product.name}</strong> × ${quantity} = ₹${lineTotal}`;
    container.appendChild(div);

    updateTotalDisplay();
}

function updateTotalDisplay() {
    let totalElement = document.getElementById('invoiceTotalAmount');
    if (!totalElement) {
        totalElement = document.createElement('div');
        totalElement.id = 'invoiceTotalAmount';
        totalElement.className = 'invoice-total';
        document.getElementById('invoiceContainer').appendChild(totalElement);
    }
    totalElement.innerHTML = `<strong>Total Amount: ₹${totalAmount}</strong>`;
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
        
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || 'Failed to delete item');
        }
        const container = document.getElementById('invoiceContainer');
        // Find the last invoice-item element and remove it
        const items = container.querySelectorAll('.invoice-item');
        if (items.length > 0) {
            items[items.length - 1].remove();
            console.log('item deleted: ', item);
        } else {
            alert('No items to delete');
        }
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
        
        // Keep the header but remove all items
        const container = document.getElementById('invoiceContainer');
        const header = container.querySelector('.invoice-header');
        container.innerHTML = '';
        if (header) {
            container.appendChild(header);
        }
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
