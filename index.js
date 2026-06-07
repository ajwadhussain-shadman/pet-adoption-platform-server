const dotenv=require("dotenv")
const express = require('express');
const cors=require('cors');
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
dotenv.config();

const port =process.env.PORT ;
const uri=process.env.MONGODB_URI;
 app.use(cors())
app.use(express.json());
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
async function run() {
  try {

    const db=client.db("pet-adoption");
    const petsCollection=db.collection("pets");
    app.get('/pets', async(req,res)=>{
      const result= await petsCollection.find().toArray();
      console.log(result)
      res.json(result);
    })
  
  app.get('/pets/:id', async (req,res)=>{
    const {id}= req.params;
    const result= await petsCollection.findOne({_id:new ObjectId(id),});
    res.json(result)
  })


    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});