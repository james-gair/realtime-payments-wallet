import postgres from "postgres";
import dotenv from "dotenv";

dotenv.config();

// Create a typed SQL client
const sql = postgres({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT),
  database: process.env.PGDATABASE,
  username: process.env.PGUSER,
  password: process.env.PGPASSWORD,
});

export default sql;
