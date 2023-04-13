const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
require('dotenv').config();


const port = process.env.PORT || 5000;

const app = express();

//middleware
app.use(cors());
app.use(express.json());

//organizationManager
//igkXRxzSyJwIqLFsJ


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.qogqlqn.mongodb.net/?retryWrites=true&w=majority`
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true});

client.connect((err) => {
    if (err) {
      console.log('Error connecting to MongoDB', err);
    } else {
      console.log('Connected to MongoDB');
      // Perform operations on the database here
    }
})

async function run() {
    try {
        const organizationCollection = client.db("OrganizationManager").collection("organizations");

        //api for finding all orginizations
        app.get('/organizations', async (req, res) => {
            //find all organizations
            const organizations = await organizationCollection.find({}).toArray();
            res.send(organizations);
        })

        // Post Api for All Organizations
        app.post('/organizations', async(req, res) => {
            const neworganizations = req.body; 
            const result = await organizationCollection.insertOne(neworganizations);
            console.log('hitting the post',req.body);      
            res.json(result);
                  
          })


    } finally {
        // Ensures that the client will close when you finish/error
    
    }
}

run().catch(console.dir);

app.get('/', function (req, res) {
    res.json({ msg: 'Organization Manager ' })
})

app.listen(port, () => console.log("Server is running"));
