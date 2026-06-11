const dotenv=require("dotenv")
const express = require('express');
const cors=require('cors');
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { createRemoteJWKSet, jwtVerify } = require("jose-cjs");
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
 const JWKS = createRemoteJWKSet(
  new URL(`${process.env.CLIENT_URL}/api/auth/jwks`)
 )

const verification= async(req,res,next)=>{
  const authHeader=req?.headers.authorization;
  if(!authHeader){
    return res.status(401).json({message:"Unauthorized"})
  }
  const token=authHeader.split(" ")[1];
  if(!token){
    return res.status(401).json({message:"Unauthorized"})
  }
  
  try{
const {payload}= await jwtVerify(token,JWKS);
console.log(payload)
   next()
  }
  catch(error){
    return res.status(403).json({message:"Forbidden"})
  }
 
}

async function run() {
  try {

    const db=client.db("pet-adoption");
    const petsCollection=db.collection("pets");
    const requestCollection=db.collection("requestCollection")
    app.get('/pets', async(req,res)=>{
      let query = {};
      const{email,search,species}=req.query;

      
      if(email){
        query.ownerEmail=email;
      }
      if(search){
        query.petName={$regex:search,$options:'i'};
      }
      if(species){
        query.species={$in : [species]};
      }
      const result= await petsCollection.find(query).toArray();
      res.json(result);
    })
  
  app.get('/pets/:id', verification, async (req,res)=>{

    const {id}= req.params;
    const result= await petsCollection.findOne({_id:new ObjectId(id),});
    res.json(result)
  })
  
  app.post("/pets", verification, async(req,res)=>{
    const petData=req.body;
    petData.status='available';
    const result= await petsCollection.insertOne(petData);
    res.json(result);
  })

  app.delete('/pets/:id',verification, async(req,res)=>{
    const {id}= req.params;
    const result= await petsCollection.deleteOne({_id:new ObjectId(id),});
    res.json(result);
  })

  app.patch("/pets/:id",  verification, async(req,res)=>{
    const {id}=req.params;
    const updatedData=req.body;
    const result= await petsCollection.updateOne(
      {_id:new ObjectId(id)},
      {$set:updatedData},
    )
  })
  app.post('/request',verification, async(req,res)=>{
    const request=req.body;

    const alreadyRequested= await requestCollection.findOne({
      petId:request.petId,
      requesterEmail:request.requesterEmail
    })
      if(alreadyRequested){
        return res.status(400).json({message:"You already requested to adopt this pet"})
      }  

    const result= await requestCollection.insertOne(request);
    res.json(result);
  })

  

 app.patch('/request/approve/:id',async(req,res)=>{
  const {id}=req.params;
   const request = await requestCollection.findOne({ _id: new ObjectId(id) });

  const result= await requestCollection.updateOne(
    {_id:new ObjectId(id)},
    { $set: {status: "approved"}}
   );
    
   await petsCollection.updateOne(
    {_id: new ObjectId(request.petId)},
    {$set:{status:'adopted'}}
   );
  

   await requestCollection.updateMany(
    {petId: request.petId, _id:{$ne: new ObjectId(id)}},
    {$set:{status:'rejected'}}
   )
   
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
 app.get('/request/pet/:petId',verification, async(req,res)=>{
  const petId=req.params.petId;
  const result= await requestCollection.find({petId:petId}).toArray()
  res.json(result)
 })
   

  app.get('/featured',async(req,res)=>{
    const result= await petsCollection.find().limit(6).toArray();
    res.json(result);
  })


  app.get('/request', verification, async(req,res)=>{
      let query = {};
      const{email}=req.query;
      
      if(email){
        query.requesterEmail=email;
      }
      const result= await requestCollection.find(query).toArray();
      res.json(result);
    })

    app.delete('/request/delete/:id',verification, async(req,res)=>{
      const{id}=req.params;
      const result= await requestCollection.deleteOne({_id:new ObjectId(id)});
      res.json(result);
    })

   app.patch('/pets/:id',async(req,res)=>{
           const {id}=req.params;
           const updatedData=req.body;
           const result= await petsCollection.updateOne(
             {_id: new ObjectId(id)},
           {$set:{updatedData}}
           )
           res.json(result)
   }) 

    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
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