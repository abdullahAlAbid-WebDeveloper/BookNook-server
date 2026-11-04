import express from "express";
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";
import "dotenv/config";
import { jwtVerify, createRemoteJWKSet } from "jose";

const PORT = 5000;

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("hello world");
});

const client = new MongoClient(process.env.MONGODB_URL);
export async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("You successfully connected to MongoDB!");
    return client;
  } catch (err) {
    console.dir(err);
  }
}

const connectClient = await connectToMongoDB();
const db = connectClient.db("bookNook");
const bookDataCollection = db.collection("bookData");
const borrowCollection = db.collection("borrowData");

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ error: "Unauthorized access" });
  }
  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).send({ message: "Unauthorized " });
  }

  const JWKS = createRemoteJWKSet(
    new URL(`${process.env.CLIENT_URL}/api/auth/jwks`),
  );

  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: process.env.CLIENT_URL,
    });
    console.log(payload);

    req.user = payload;
  } catch (err) {
    return res.status(401).send({ message: "Unauthorized access" });
  }
  next();
};

app.post("/bookData", verifyToken, async (req, res) => {
  const AllBookData = req.body;

  const alReadyExists = await bookDataCollection.findOne({
    title: AllBookData.title,
    author: AllBookData.author,
  });
  if (alReadyExists) {
    return res
      .status(400)
      .send({ error: "This book already exists in the database." });
  }

  const result = await bookDataCollection.insertOne(AllBookData);
  res.send(result);
});

app.get("/bookData", async (req, res) => {
  const result = await bookDataCollection.find().toArray();
  res.send(result);
});

app.get("/bookData/:id",verifyToken, async (req, res) => {
  const id = req.params.id;
  console.log(id);

  const result = await bookDataCollection.findOne({ _id: new ObjectId(id) });
  res.send(result);
});

app.post("/bookData/borrow", verifyToken, async (req, res) => {
  const borrowData = req.body;

  const alreadyBorrowed = await borrowCollection.findOne({
    bookId: borrowData.bookId,
    borrowerEmail: borrowData.borrowerEmail,
  });
  if (alreadyBorrowed) {
    return res
      .status(400)
      .send({ error: "This book is already borrowed by you." });
  }

  // Check how many copies are left before allowing a borrow
  const book = await bookDataCollection.findOne({
    _id: new ObjectId(borrowData.bookId),
  });
  const copiesLeft = Number(book?.totalCopies ?? 0);
  if (copiesLeft <= 0) {
    return res
      .status(400)
      .send({ error: "No copies of this book are available right now." });
  }

  const result = await borrowCollection.insertOne(borrowData);

  // Decrease copies left by 1 after a successful borrow
  await bookDataCollection.updateOne(
    { _id: new ObjectId(borrowData.bookId) },
    { $set: { totalCopies: copiesLeft - 1 } },
  );

  res.send(result);
});

app.delete("/bookData/borrow/:id", verifyToken, async (req, res) => {
  const id = req.params.id;

  // Find the borrow record first so we know which book to update
  const borrowData = await borrowCollection.findOne({ _id: new ObjectId(id) });
  const result = await borrowCollection.deleteOne({ _id: new ObjectId(id) });

  // Increase copies left by 1 after returning the book
  if (result.acknowledged && borrowData?.bookId) {
    const book = await bookDataCollection.findOne({
      _id: new ObjectId(borrowData.bookId),
    });
    await bookDataCollection.updateOne(
      { _id: new ObjectId(borrowData.bookId) },
      { $set: { totalCopies: Number(book?.totalCopies ?? 0) + 1 } },
    );
  }

  res.send(result);
});

app.get(`/bookData/borrow/:email`, verifyToken, async (req, res) => {
  const email = req.params.email;

  if (email !== req.user.email) {
    return res.status(403).send({ error: "Forbidden access" });
  }

  const result = await borrowCollection.find({ userEmail: email }).toArray();
  res.send(result);
});

app.get(`/myBooks/:email`, verifyToken, async (req, res) => {
  const email = req.params.email;
  if (email !== req.user.email) {
    return res.status(403).send({ error: "Forbidden access" });
  }
  const result = await bookDataCollection
    .find({ creatorEmail: email })
    .toArray();
  res.send(result);
});

app.patch("/bookData/:id", verifyToken, async (req, res) => {
  const id = req.params.id;
  const updatedData = req.body;
  const result = await bookDataCollection.updateOne(
    { _id: new ObjectId(id) },
    { $set: updatedData },
  );
  res.send(result);
});

app.delete("/bookData/:id", verifyToken, async (req, res) => {
  const id = req.params.id;
  const result = await bookDataCollection.deleteOne({ _id: new ObjectId(id) });
  res.send(result);
});

app.delete("/bookData/borrow", verifyToken, async (req, res) => {
  const id = req.params.id;
  const result = await borrowCollection.deleteOne({ _id: new ObjectId(id) });
  res.send(result);
});

app.listen(PORT, () => {
  console.log(`Server is Running on ${PORT}`);
});

export default app;
