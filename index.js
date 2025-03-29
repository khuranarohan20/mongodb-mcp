import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { MongoClient } from "mongodb";
import {
  CreateDocumentSchema,
  DeleteDocumentSchema,
  GetDocumentByIdSchema,
  GetDocumentsSchema,
  UpdateDocumentSchema,
} from "./schema.js";

const MONGO_URI =
  "mongodb+srv://rohankhuranadeviic:p9tka9oDPG73Su7f@cluster0.yehpb.mongodb.net";
const DB_NAME = "youtube";

const mongoClient = new MongoClient(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 10,
  minPoolSize: 2,
  maxIdleTimeMS: 30000,
  connectTimeoutMS: 5000,
});

const server = new McpServer({
  name: "mongodb-connector",
  version: "1.0.0",
});

let db;
async function connectToDatabase() {
  try {
    if (!db) {
      await mongoClient.connect();
      db = mongoClient.db(DB_NAME);
    }
    return true;
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    return false;
  }
}
connectToDatabase();

server.tool(
  "getDocuments",
  "Get documents from a collection",
  GetDocumentsSchema,
  async ({ collection, query = {}, limit = 100, skip = 0 }) => {
    if (!db) {
      await connectToDatabase();
    }
    try {
      const result = await db
        .collection(collection)
        .find(query)
        .limit(limit)
        .skip(skip)
        .toArray();
      return {
        count: result.length,
        documents: result,
      };
    } catch (error) {
      console.error("Error fetching documents:", error);
      return {
        error: error.message || "Error fetching documents",
        count: 0,
        documents: [],
      };
    }
  }
);

server.tool(
  "getDocumentById",
  "Get a single document by ID from a collection",
  GetDocumentByIdSchema,
  async ({ collection, id }) => {
    if (!db) {
      await connectToDatabase();
    }
    try {
      const document = await db
        .collection(collection)
        .findOne({ _id: new ObjectId(id) });
      if (!document) {
        return { error: "Document not found", document: null };
      }
      return { document };
    } catch (error) {
      console.error("Error fetching document:", error);
      return {
        error: error.message || "Error fetching document",
        document: null,
      };
    }
  }
);

server.tool(
  "createDocument",
  "Create a new document in a collection",
  CreateDocumentSchema,
  async ({ collection, document }) => {
    if (!db) {
      await connectToDatabase();
    }
    try {
      const result = await db.collection(collection).insertOne(document);
      return { success: true, document: result };
    } catch (error) {
      console.error("Error creating document:", error);
      return {
        error: error.message || "Error creating document",
        success: false,
      };
    }
  }
);

server.tool(
  "updateDocument",
  "Update an existing document in a collection by ID",
  UpdateDocumentSchema,
  async ({ collection, id, document }) => {
    if (!db) {
      await connectToDatabase();
    }
    try {
      const result = await db
        .collection(collection)
        .updateOne({ _id: new ObjectId(id) }, { $set: document });
      return { document: result, success: result.modifiedCount > 0 };
    } catch (error) {
      console.error("Error updating document:", error);
      return {
        error: error.message || "Error updating document",
        success: false,
      };
    }
  }
);

server.tool(
  "deleteDocument",
  "Delete a document from a collection by ID",
  DeleteDocumentSchema,
  async ({ collection, id }) => {
    if (!db) {
      await connectToDatabase();
    }
    try {
      const result = await db
        .collection(collection)
        .deleteOne({ _id: new ObjectId(id) });
      return { success: result.deletedCount > 0 };
    } catch (error) {
      console.error("Error deleting document:", error);
      return {
        error: error.message || "Error deleting document",
        success: false,
      };
    }
  }
);

process.on("SIGINT", async () => {
  console.log("Closing MongoDB connection...");
  await mongoClient.close();
  console.log("MongoDB connection closed.");
  process.exit(0);
});

const transport = new StdioServerTransport();
server.connect(transport);

connectToDatabase().then(() => {
  console.log("Connected to MongoDB. MCP server is listening...");
});
