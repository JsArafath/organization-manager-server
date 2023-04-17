const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config();
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

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.d0mpncw.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

client.connect((err) => {
  if (err) {
    console.log("Error connecting to MongoDB", err);
  } else {
    console.log("Connected to MongoDB");
    // Perform operations on the database here
  }
});

async function run() {
  try {
    const organizationCollection = client
      .db("OrganizationManager")
      .collection("organizations");
    //   payment Collection
    const paymentCollection = client
      .db("OrganizationManager")
      .collection("paymentCollection");
    //   user collection
    const usersCollection = client
      .db("OrganizationManager")
      .collection("usersCollection");
      // news collection
      const newsCollection = client.db("OrganizationManager").collection('newsCollection')

    // verify admin user
    const verifyAdmin = async (req, res, next) => {
      const decodedEmail = req.decoded.email;
      const query = { email: decodedEmail };
      const user = await usersCollection.findOne(query);

      if (user?.position !== "admin") {
        return res.status(403).send({ message: "forbidden access" });
      }
      next();
    };

    // verify customer user
    const verifyCustomer = async (req, res, next) => {
      const decodedEmail = req.decoded.email;
      const query = { email: decodedEmail };
      const user = await usersCollection.findOne(query);

      if (user?.position !== "member") {
        return res.status(403).send({ message: "forbidden access" });
      }
      next();
    };

    // get all news
    app.get('/news', async (req, res, next) => {
      const query = {};
      const news = await newsCollection.find(query).toArray();
      res.send(news)
    })

    // get all users
    app.get("/users", async (req, res) => {
      const query = {};
      const users = await usersCollection.find(query).toArray();
      res.send(users);
    });
    // get user info by user email
    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const users = await usersCollection.find(query).toArray();
      res.send(users);
    });
    // post user data

    app.post("/users", async (req, res) => {
      const userInfo = req.body;
      const query = { email: userInfo.email };
      const user = await usersCollection.findOne(query);
      if (!user) {
        const result = await usersCollection.insertOne(userInfo);
        res.send(result);
      }
    });

    // member approved
    app.put("/users/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedDoc = {
        $set: {
          verified: true,
        },
      };
      const result = await usersCollection.updateOne(
        filter,
        updatedDoc,
        options
      );

      res.send(result);
    });
    // check customer
    app.get("/user/customer/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await usersCollection.findOne(query);
      res.send({ isCustomer: user?.position === "member" });
    });

    //check admin user
    app.get("/user/admin/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await usersCollection.findOne(query);
      res.send({ isAdmin: user?.position === "admin" });
    });

    //api for finding all orginizations
    app.get("/organizations", async (req, res) => {
      //find all organizations
      const organizations = await organizationCollection.find({}).toArray();
      res.send(organizations);
    });
    // Post Api For All Organizations
    app.post("/organizations", async (req, res) => {
      const neworganizations = req.body;
      const result = await organizationCollection.insertOne(neworganizations);
      console.log("hitting the post", req.body);
      res.json(result);
    });
    // get all transactions
    app.get("/all-transaction", async (req, res) => {
      //find all organizations
      // const query={
      //   organization: req.query.organization
      // }
      const organizations = await paymentCollection.find({}).toArray();
      res.send(organizations);
    });
    //  payment api for due amount
    app.post("/due-payment", async (req, res) => {
      const paymentInfo = req.body;
      const transactionId = new ObjectId().toString().slice(5, 17);
      const data = {
        total_amount: paymentInfo.amount,
        currency: "BDT",
        tran_id: transactionId, // use unique tran_id for each api call
        success_url: `http://localhost:5000/due-payment/success?transactionId=${transactionId}`,
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

    app.get("/transaction-query-by-transaction-id", (req, res) => {
      const data = {
        tran_id: "957aa414d6ea",
      };
      const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
      sslcz.transactionQueryByTransactionId(data).then((data) => {
        //process the response that got from sslcommerz
        //https://developer.sslcommerz.com/doc/v4/#by-session-id
        res.send(data);
      });
    });

    // validate
    app.get('/validate', (req, res) => {
      const data = {
          val_id:"230416150121E1SIgDwpp2NUErM" //that you go from sslcommerz response
      };
      const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live)
      sslcz.validate(data).then(data => {
          //process the response that got from sslcommerz 
         // https://developer.sslcommerz.com/doc/v4/#order-validation-api
         res.send(data);
      });
  }) 
    //payment-due success
    app.post("/due-payment/success", async (req, res) => {
      const { transactionId } = req.query;
      const result = await paymentCollection.updateOne(
        { transactionId },
        { $set: { paid: true, paidAt: new Date() } }
      );

      if (result.modifiedCount > 0) {
        res.redirect(
          `http://127.0.0.1:5173/dashboard/payment/success?transactionID=${transactionId}`
        );
      }
    });
  } finally {
    // Ensures that the client will close when you finish/error
  }
}


run().catch(console.dir);

app.get("/", function (req, res) {
  res.json({ msg: "Organization Manager " });
});

app.listen(port, () => console.log("Server is running"));