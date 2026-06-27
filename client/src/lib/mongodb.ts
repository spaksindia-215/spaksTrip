import "server-only";
import { MongoClient, type Db } from "mongodb";

const uri = process.env.MONGO_URI ?? process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME ?? "spakstrip";

if (!uri) {
  throw new Error("MONGO_URI or MONGODB_URI environment variable is not set");
}

// Prevent multiple MongoClient instances in Next.js dev hot-reload.
declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    const client = new MongoClient(uri);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  const client = new MongoClient(uri);
  clientPromise = client.connect();
}

export async function getDb(): Promise<Db> {
  const client = await clientPromise;
  return client.db(dbName);
}
