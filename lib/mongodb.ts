import { MongoClient, Db } from 'mongodb';

const MONGODB_URI =
  'mongodb+srv://lodeharikiran_db_user:L7RcRnCX7yzudKDr@dsaapp.oef7ffb.mongodb.net/dsa_tracker?retryWrites=true&w=majority';
const DB_NAME = 'dsa_tracker';

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

function getClientPromise(): Promise<MongoClient> {
  if (!global._mongoClientPromise) {
    const client = new MongoClient(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    });
    global._mongoClientPromise = client.connect();
  }
  return global._mongoClientPromise;
}

let indexesEnsured = false;

async function ensureIndexes(db: Db): Promise<void> {
  if (indexesEnsured) return;
  try {
    await Promise.all([
      db.collection('users').createIndex({ username: 1 }, { unique: true }),
      db.collection('user_progress').createIndex({ user_id: 1, question_id: 1 }, { unique: true }),
      db.collection('completion_events').createIndex({ id: 1 }, { unique: true }),
      db.collection('completion_events').createIndex(
        { user_id: 1, question_id: 1 },
        { unique: true }
      ),
      db.collection('completion_events').createIndex({ user_id: 1, completed_at: -1 }),
      db.collection('daily_todos').createIndex({ id: 1 }, { unique: true }),
      db.collection('daily_todos').createIndex({ user_id: 1, date: 1 }),
    ]);
    indexesEnsured = true;
  } catch (error) {
    console.warn('MongoDB index setup skipped:', error);
  }
}

export async function getDb(): Promise<Db> {
  const client = await getClientPromise();
  const db = client.db(DB_NAME);
  await ensureIndexes(db);
  return db;
}
