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
    const requestCollection=db.collection("requestCollection")
    app.get('/pets', async(req,res)=>{
      let query = {};
      const{email}=req.query;
      
      if(email){
        query.ownerEmail=email;
      }
      const result= await petsCollection.find(query).toArray();
      res.json(result);
    })
  
  app.get('/pets/:id', async (req,res)=>{

    const {id}= req.params;
    const result= await petsCollection.findOne({_id:new ObjectId(id),});
    res.json(result)
  })
  
  app.post("/pets",async(req,res)=>{
    const petData=req.body;
    petData.status='available';
    const result= await petsCollection.insertOne(petData);
    res.json(result);
  })

  app.delete('/pets/:id',async(req,res)=>{
    const {id}= req.params;
    const result= await petsCollection.deleteOne({_id:new ObjectId(id),});
    res.json(result);
  })

  app.patch("/pets/:id",async(req,res)=>{
    const {id}=req.params;
    const updatedData=req.body;
    const result= await petsCollection.updateOne(
      {_id:new ObjectId(id)},
      {$set:updatedData},
    )
  })
  app.post('/request',async(req,res)=>{
    const request=req.body;

    const result= await requestCollection.insertOne(request);
    res.json(result);
  })

  app.get('/request', async (req,res)=>{
    const result= await requestCollection.find().toArray();
    res.json(result)
  })

 app.patch('/request/approve/:id',async(req,res)=>{
  const {id}=req.params;

  const result= await requestCollection.updateOne(
    {_id:new ObjectId(id)},
    { $set: {status: "approved"}}
   );
    
   await petsCollection.updateOne(
    {_id: new ObjectId(id)},
    {$set:{status:'adopted'}}
   );
   
   res.json(result);

 })
 
 app.patch('/request/rejected/:id',async(req,res)=>{
  const {id}=req.params;
  const result =await requestCollection.updateOne(
    {_id:new ObjectId(id)},
    {$set:{status:'rejected'}}
  )
  res.json(result)
 })
 app.get('/request/pet/:petId',async(req,res)=>{
  const {petId}=req.params.petId;
  const result= await requestCollection.find(petId).toArray()
  res.json(result)
 })
   

  app.get('/featured',async(req,res)=>{
    const result= await petsCollection.find().limit(6).toArray();
    res.json(result);
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