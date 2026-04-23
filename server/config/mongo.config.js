// Initialize MongoDB
const mongoClient = new MongoClient(process.env.MONGODB_URI);
let mongoDb;

export async function connectMongo() {
  if (!mongoDb) {
    await mongoClient.connect();
    mongoDb = mongoClient.db(); // Connects to the DB in your URI
    console.log("Connected to MongoDB");
  }
  return mongoDb;
}
