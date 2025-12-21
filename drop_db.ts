import { createClient } from '@libsql/client';

const client = createClient({
  url: 'file:sqlite.db',
});

async function dropAll() {
  try {
    // Disable foreign keys to avoid constraints during drop
    await client.execute("PRAGMA foreign_keys = OFF;");
    
    const tables = await client.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';");
    
    for (const row of tables.rows) {
        const tableName = row[0];
        console.log(`Dropping table ${tableName}...`);
        await client.execute(`DROP TABLE IF EXISTS "${tableName}";`);
    }
    
    console.log('All tables dropped.');
  } catch (e) {
    console.error('Error dropping tables:', e);
  }
}

dropAll();
