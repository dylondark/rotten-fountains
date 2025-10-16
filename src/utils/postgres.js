import { Pool } from "pg";

// Read from environment variables so credentials are not hard-coded.
// Create a `.env` or set the corresponding env vars in your environment.
const pool = new Pool({
    host: process.env.PGHOST || "localhost",
    port: parseInt(process.env.PGPORT || "5432", 10),
    user: process.env.PGUSER || "postgres",
    password: process.env.PGPASSWORD || "admin",
    database: process.env.PGDATABASE || "restapi",
});

export default pool;