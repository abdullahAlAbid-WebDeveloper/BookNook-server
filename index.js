import express from "express";
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";
import "dotenv/config";

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

app.post("/bookData", async (req, res) => {
  const AllBookData = req.body;

 const alReadyExists = await bookDataCollection.findOne({ title: AllBookData.title, author: AllBookData.author });
  if (alReadyExists) {
    return res.status(400).send({ error: "This book already exists in the database." });
  }

  const result = await bookDataCollection.insertOne(AllBookData);
  res.send(result);
});

app.get("/bookData", async (req, res) => {

  
  const result = await bookDataCollection.find().toArray();
  res.send(result);
});

app.get("/bookData/:id", async (req, res) => {
  const id = req.params.id;
  console.log(id);

  const result = await bookDataCollection.findOne({ _id: new ObjectId(id) });
  res.send(result);
});

app.post("/bookData/borrow", async (req, res) => {
  const borrowData = req.body;

const alreadyBorrowed = await borrowCollection.findOne({
    bookId: borrowData.bookId,
    borrowerEmail: borrowData.borrowerEmail,
  });
  if (alreadyBorrowed) {
    return res.status(400).send({ error: "This book is already borrowed by you." });
  }

  const result = await borrowCollection.insertOne(borrowData);
  res.send(result);
});




app.get("/bookData/borrow/:email", async (req, res) => {
  const email = req.params.email;
  const result = await borrowCollection.find({ userEmail: email }).toArray();
  res.send(result);
})

app.get(`/myBooks/:email`, async (req, res) => {
  const email = req.params.email;
  const result = await bookDataCollection
    .find({ creatorEmail: email })
    .toArray();
  res.send(result);
});


app.patch("/bookData/:id", async (req, res) => {
  const id = req.params.id;
  const updatedData = req.body;
const result = await bookDataCollection.updateOne(
    { _id: new ObjectId(id) },
    { $set: updatedData }
  );
  res.send(result);
})

app.delete("/bookData/:id", async (req, res) => {
  const id = req.params.id;
  const result = await bookDataCollection.deleteOne({ _id: new ObjectId(id) });
  res.send(result);
});
















app.listen(PORT, () => {
  console.log(`Server is Running on ${PORT}`);
});
