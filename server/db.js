//substituir o db.js :

require("dotenv").config();
const { Pool } = require("pg");

const isProduction = process.env.NODE_ENV === "production";
console.log(isProduction,process.env.PGPASSWORD)
const pool = new Pool(
  isProduction
    ? {
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      },
      family: 4 // 👈 FORÇA IPv4 (ESSENCIAL no Render)

    }
    : {
      host: process.env.PGHOST,
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      database: process.env.PGDATABASE,
      port: process.env.PGPORT
    }
);

console.log("🔥 DB CONFIG:1", {
  nodeEnv: process.env.NODE_ENV,
  usandoDatabaseUrl: !!process.env.DATABASE_URL
});


module.exports = pool;