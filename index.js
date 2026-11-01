import express from 'express'
import cors from 'cors'
import { MongoClient, ObjectId } from 'mongodb';
import 'dotenv/config'

const PORT=5000;



const app= express()
app.use(cors())
app.use(express.json())



app.get('/',(req,res)=>{
    res.send('hello world')
})



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

 const connectClient = await connectToMongoDB()
const db= connectClient.db('bookNook')
const bookDataCollection = db.collection('bookData')
const borrowCollection = db.collection('borrowData')




app.post('/bookData', async (req, res) => {

const AllBookData = req.body;
const result = await bookDataCollection.insertOne(AllBookData);
res.send(result)

})

app.get('/bookData', async (req, res) => {
  const result = await bookDataCollection.find().toArray();
res.send(result)
})                     


app.get('/bookData/:id', async (req, res) => {
   const id = req.params.id;
   console.log(id);

   const result = await bookDataCollection.findOne({ _id: new ObjectId(id) });
res.send(result)   
})

app.post('/bookData/borrow', async (req, res) => {
  const borrowData = req.body;
  const result = await borrowCollection.insertOne(borrowData);
  res.send(result)
})


























app.listen(PORT,()=>{
    console.log(`Server is Running on ${PORT}`);
    
}
)

