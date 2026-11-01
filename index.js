import express from 'express'
import cors from 'cors'
import { MongoClient } from 'mongodb';
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

connectToMongoDB()


app.listen(PORT,()=>{
    console.log(`Server is Running on ${PORT}`);
    
}
)

