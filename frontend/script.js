let invoiceId = null;
let products = [];

async function createInvoice() {
    const res = await fetch('http://localhost:5000/api/invoice/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_id: 1 }) // Default customer_id for demo
    });
    const data = await res.json();
    invoiceId = data.invoice_id;
    alert('Invoice created!');
    document.getElementById('invoiceContainer').innerHTML = '';
}

async function loadProducts() {
    // Simulate fetching from DB
    products = [
        { id: 1, name: 'Keyboard', price: 1200 },
        { id: 2, name: 'Mouse', price: 800 },
        { id: 3, name: 'Monitor', price: 8500 }
    ];
    const select = document.getElementById('productSelect');
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

    const item = await res.json();
    const product = products.find(p => p.id == productId);

    const container = document.getElementById('invoiceContainer');
    const div = document.createElement('div');
    div.className = 'invoice-item';
    div.innerHTML = `<strong>${product.name}</strong> × ${quantity} = ₹${product.price * quantity}`;
    container.appendChild(div);
}

async function deleteLastItem() {
    if (!invoiceId) return alert('Create an invoice first.');
    await fetch(`http://localhost:5000/api/invoice/delete-last-item/${invoiceId}`, {
        method: 'DELETE'
    });
    const container = document.getElementById('invoiceContainer');
    container.lastChild?.remove();
}

async function clearInvoice() {
    if (!invoiceId) return alert('Create an invoice first.');
    await fetch(`http://localhost:5000/api/invoice/clear/${invoiceId}`, {
        method: 'DELETE'
    });
    document.getElementById('invoiceContainer').innerHTML = '';
}

async function generatePDF() {
    if (!invoiceId) return alert('Create an invoice first.');
    window.open(`http://localhost:5000/api/invoice/generate-pdf/${invoiceId}`, '_blank');
}

window.onload = loadProducts;
