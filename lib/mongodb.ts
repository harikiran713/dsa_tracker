import { MongoClient, Db } from 'mongodb';

const dbName = process.env.MONGODB_DB_NAME || 'dsa_tracker';

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

function getClientPromise(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('Missing MONGODB_URI environment variable');
  }

  if (process.env.NODE_ENV === 'development') {
    if (!global._mongoClientPromise) {
      const client = new MongoClient(uri);
      global._mongoClientPromise = client.connect();
    }
    return global._mongoClientPromise;
  }

  const client = new MongoClient(uri);
  return client.connect();
}

let indexesEnsured = false;

async function ensureIndexes(db: Db): Promise<void> {
  if (indexesEnsured) return;
  await Promise.all([
    db.collection('users').createIndex({ username: 1 }, { unique: true }),
    db.collection('user_progress').createIndex({ user_id: 1, question_id: 1 }, { unique: true }),
    db.collection('completion_events').createIndex({ id: 1 }, { unique: true }),
    db.collection('completion_events').createIndex({ user_id: 1, completed_at: -1 }),
    db.collection('daily_todos').createIndex({ id: 1 }, { unique: true }),
    db.collection('daily_todos').createIndex({ user_id: 1, date: 1 }),
  ]);
  indexesEnsured = true;
}

export async function getDb(): Promise<Db> {
  const client = await getClientPromise();
  const db = client.db(dbName);
  await ensureIndexes(db);
  return db;
}
