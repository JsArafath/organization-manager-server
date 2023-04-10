const express = require('express');
const cors = require('cors');


const port = process.env.PORT || 5000;

const app = express();

//middleware
app.use(cors());
app.use(express.json());

//organizationManager
//igkXRxzSyJwIqLFs

const uri = "mongodb+srv://organizationManager:igkXRxzSyJwIqLFs@cluster0.qogqlqn.mongodb.net/?retryWrites=true&w=majority"

app.get('/', function (req, res) {
    res.json({ msg: 'This is CORS-enabled for all origins!!!!' })
})

app.listen(port, () => console.log("Server is running"));


