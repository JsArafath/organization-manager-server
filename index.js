const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();
const SSLCommerzPayment = require("sslcommerz-lts");
require("dotenv").config();
const port = process.env.PORT || 5000;

const store_id = process.env.STORE_ID;
const store_passwd = process.env.STORE_PASSWORD;
const is_live = false;


const app = express();

//middleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.d0mpncw.mongodb.net/?retryWrites=true&w=majority`
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

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
    //   payment Collection
    const paymentCollection = client.db("OrganizationManager").collection("paymentCollection");
    //   user collection
    const userCollection = client.db("OrganizationManager").collection("usersCollection");
      // membersCollection
    const membersCollection = client .db("OrganizationManager").collection("members");

    // verify admin user
      const verifyAdmin = async (req, res, next) => {
        const decodedEmail = req.decoded.email;
        const query = { email: decodedEmail };
        const user = await userCollection.findOne(query);
  
        if (user?.role !== "admin") {
          return res.status(403).send({ message: "forbidden access" });
        }
        next();
      };

      // verify customer user
      const verifyCustomer = async (req, res, next) => {
        const decodedEmail = req.decoded.email;
        const query = { email: decodedEmail };
        const user = await userCollection.findOne(query);
  
        if (user?.role !== "customer") {
          return res.status(403).send({ message: "forbidden access" });
        }
        next();
      };
  
      // check customer
    app.get("/user/customer/:email", async (req, res) => {
        const email = req.params.email;
        const query = { email };
        const user = await userCollection.findOne(query);
        res.send({ isCustomer: user?.role === "customer" });
      });

    //check admin user
      app.get("/user/admin/:email", async (req, res) => {
        const email = req.params.email;
        const query = { email };
        const user = await userCollection.findOne(query);
        res.send({ isAdmin: user?.role === "admin" });
      });

        //api for finding all orginizations
        app.get("/organizations", async (req, res) => {
            //find all organizations
            const organizations = await organizationCollection.find({}).toArray();
            res.send(organizations);
        });
        // Post Api For All Organizations
        app.post('/organizations', async (req, res) => {
            const neworganizations = req.body;
            const result = await organizationCollection.insertOne(neworganizations);
            console.log('hitting the post', req.body);
            res.json(result);

        })
        //  payment api for due amount
        app.post("/due-payment", async (req, res) => {
            const paymentInfo = req.body;

            const transactionId = new ObjectId().toString().slice(5, 17);
            const data = {
                total_amount: paymentInfo.amount,
                currency: "BDT",
                tran_id: transactionId, // use unique tran_id for each api call
                success_url: `https://organization-manager-server.onrender.com/due-payment/success?transactionId=${transactionId}`,
                fail_url: "http://localhost:3030/fail",
                cancel_url: "http://localhost:3030/cancel",
                ipn_url: "http://localhost:3030/ipn",
                shipping_method: "Courier",
                product_name: "Cafe Reservation",
                product_category: "Reservation",
                product_profile: "Regular",
                cus_name: paymentInfo?.userName,
                cus_email: paymentInfo?.userEmail,
                cus_add1: "Dhaka",
                cus_add2: "JU",
                cus_city: "JU",
                cus_state: "JU",
                cus_postcode: "1000",
                cus_country: "Bangladesh",
                cus_phone: paymentInfo?.phone,
                cus_fax: paymentInfo?.phone,
                ship_name: paymentInfo?.userName,
                ship_add1: "Dhaka",
                ship_add2: "Dhaka",
                ship_city: "Dhaka",
                ship_state: "Dhaka",
                ship_postcode: 1000,
                ship_country: "Bangladesh",
            };
            const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
            sslcz.init(data).then((apiResponse) => {
                // Redirect the user to payment gateway
                let GatewayPageURL = apiResponse.GatewayPageURL;
                res.send({ url: GatewayPageURL });
            });

            const result = await paymentCollection.insertOne({
                ...paymentInfo,
                transactionId,
                paid: false,
            });
        });

        //payment-due success
        app.post("/due-payment/success", async (req, res) => {
            const { transactionId } = req.query;
            const result = await paymentCollection.updateOne(
                { transactionId },
                { $set: { paid: true, paidAt: new Date() } }
            );

            if (result.modifiedCount > 0) {
                res.redirect(
                    `https://organization-manager.vercel.app/dashboard/payment/success?transactionID=${transactionId}`
                );
            }
        });

    //   if (result.modifiedCount > 0) {
    //     res.redirect(
    //       `http://127.0.0.1:5173/dashboard/payment/success?transactionID=${transactionId}`
    //     );
    //   }
    
  
        
        // GET API For ALL Members
        app.get('/members', async (req, res) => {
            const query = {};
            const members = await membersCollection.find(query).toArray();
            res.send(members)
        })
                // Get API For ALL  Users
                app.get('/users', async (req, res) => {
                    const query = {};
                    const users = await userCollection.find(query).toArray();
                    const count = await userCollection.estimatedDocumentCount();
                    res.send({count,users})
                })
                // GET API For user
                app.get('/users/:email', async (req, res) => {
                   const email = req.params.email;
                   const query = {email};
                   const user = await userCollection.findOne(query);
                   res.send(user);
                  
                })



    } finally {
        // Ensures that the client will close when you finish/error

    }
}

run().catch(console.dir);

app.get("/", function (req, res) {
    res.json({ msg: "Organization Manager " });
});

app.listen(port, () => console.log("Server is running"));
