const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');


const port = process.env.PORT || 5000;

const app = express();

//middleware
app.use(cors());
app.use(express.json());

//organizationManager
//igkXRxzSyJwIqLFsJ


const uri = "mongodb+srv://organizationManager:igkXRxzSyJwIqLFs@cluster0.qogqlqn.mongodb.net/?retryWrites=true&w=majority"
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

app.get("/", function (req, res) {
  res.json({ msg: "Organization Manager " });
});

app.listen(port, () => console.log("Server is running"));
