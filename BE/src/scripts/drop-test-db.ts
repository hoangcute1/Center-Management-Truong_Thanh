import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';

dotenv.config();

async function dropTestDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI not found in .env');
    process.exit(1);
  }

  // Connect to the cluster
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas');

    // Get admin database to list all databases
    const adminDb = client.db().admin();
    const dbList = await adminDb.listDatabases();

    console.log('\n📋 Current databases:');
    dbList.databases.forEach((db) => {
      const size = db.sizeOnDisk ?? 0;
      console.log(`  - ${db.name} (${(size / 1024 / 1024).toFixed(2)} MB)`);
    });

    // Check if 'test' database exists
    const testDbExists = dbList.databases.some((db) => db.name === 'test');

    if (testDbExists) {
      console.log('\n🗑️ Dropping "test" database...');
      const testDb = client.db('test');
      await testDb.dropDatabase();
      console.log('✅ "test" database dropped successfully!');
    } else {
      console.log('\n✅ "test" database does not exist');
    }

    // List databases after cleanup
    const newDbList = await adminDb.listDatabases();
    console.log('\n📋 Databases after cleanup:');
    newDbList.databases.forEach((db) => {
      const size = db.sizeOnDisk ?? 0;
      console.log(`  - ${db.name} (${(size / 1024 / 1024).toFixed(2)} MB)`);
    });
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

dropTestDatabase();
