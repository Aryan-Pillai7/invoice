CREATE TABLE "User" (
    user_id SERIAL PRIMARY KEY,
    user_name VARCHAR(100),
    user_email VARCHAR(100)
);

CREATE TABLE Customer (
    customer_id SERIAL PRIMARY KEY,
    customer_name VARCHAR(100),
    customer_phone VARCHAR(15),
    customer_address TEXT,
    user_id INT REFERENCES "User"(user_id)
);

CREATE TABLE Product (
    product_id SERIAL PRIMARY KEY,
    product_name VARCHAR(100),
    price DECIMAL(10, 2)
);

CREATE TABLE Invoice (
    invoice_id SERIAL PRIMARY KEY,
    invoice_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_amount DECIMAL(10, 2),
    customer_id INT REFERENCES Customer(customer_id)
);

CREATE TABLE Invoice_Item (
    invoice_item_id SERIAL PRIMARY KEY,
    invoice_id INT REFERENCES Invoice(invoice_id),
    product_id INT REFERENCES Product(product_id),
    quantity INT,
    line_total DECIMAL(10, 2)
);
