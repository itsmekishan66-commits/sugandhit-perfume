import 'dotenv/config';
import app from './app.js';
import { pool } from './config/db.js';
const port = process.env.PORT || 4000;
const start = async () => {
    try {
        await pool.query('SELECT 1');
        console.log('PostgreSQL connected');
    }
    catch (error) {
        console.error('PostgreSQL connection failed:', error.message);
        process.exit(1);
    }
    app.listen(port, () => console.log('server started on port :' + port));
};
start();
