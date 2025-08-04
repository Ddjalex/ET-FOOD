import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Use in-memory storage for development if no database URL is provided
export let db: ReturnType<typeof drizzle> | null = null;
export let pool: Pool | null = null;

if (process.env.DATABASE_URL) {
  try {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    db = drizzle({ client: pool, schema });
    console.log('PostgreSQL database connected successfully');
  } catch (error) {
    console.error('Failed to connect to PostgreSQL database:', error);
  }
} else {
  console.log('No DATABASE_URL provided, using in-memory storage for development');
}
