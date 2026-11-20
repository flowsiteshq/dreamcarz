import { readFile } from "node:fs/promises";
import mysql from "mysql2/promise";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");

const migration = await readFile(new URL("../drizzle/0063_fleet_tickets.sql", import.meta.url), "utf8");
const [createTable, createIndex] = migration.trim().split("--> statement-breakpoint");
const db = await mysql.createConnection(process.env.DATABASE_URL);
try {
  await db.execute(createTable.replace("CREATE TABLE ", "CREATE TABLE IF NOT EXISTS "));
  const [indexes] = await db.execute("SHOW INDEX FROM fleet_tickets WHERE Key_name = 'fleet_ticket_due_idx'");
  if (!indexes.length) {
    try {
      await db.execute(createIndex);
    } catch (error) {
      if (error.code !== "ER_DUP_KEYNAME") throw error;
    }
  }
  await db.execute("SELECT revision, duplicateKey, transactionId, status, dueAt FROM fleet_tickets LIMIT 0");
  console.log("Fleet ticket schema ready.");
} finally {
  await db.end();
}
