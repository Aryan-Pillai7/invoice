const { Pool } = require('pg'); 

const pool = new Pool({
    user : 'postgres', 
    host : 'localhost', 
    database : 'invoice_db', 
    password : 'amogh', 
    port : 5432,
});

module.exports = pool; 