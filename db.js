import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const db = new pg.Client({
   user: process.env.DB_USER ,
  
   database: process.env.DB_NAME ,
   password: process.env.DB_PASSWORD ,
   port: process.env.DB_PORT

})

db.connect();

export default db ;