const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 5000;

const app = express();

app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.oahoku5.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        const productsCollection = client.db('Cartivate').collection('Products');
        const usersCollection = client.db('Cartivate').collection('Users');

        app.get('/products/:categoryId', async (req, res) => {
            const id = req.params.categoryId;
            const query = { categoryId: id };
            const products = await productsCollection.find(query).toArray();
            res.send(products);
        })


        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const result = await usersCollection.find(query).toArray();
            res.send(result);
        })
        app.put('/users/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            user.verified = false;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
                $set: user,
            }
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            console.log(result);
            res.send(result);
        })

        //admin queries all buyers
        app.get('/users/admin/buyers', async (req, res) => {
            const query = { userType: "Buyer" };
            const result = await usersCollection.find(query).toArray();
            res.send(result);
        })
        //admin queries all sellers
        app.get('/users/admin/sellers', async (req, res) => {
            const query = { userType: "Seller" };
            const result = await usersCollection.find(query).toArray();
            res.send(result);
        })

        //verify the user
        app.put('/users/verify/:sellerId', async (req, res) => {
            const id = req.params.sellerId;
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    verified: true
                }
            }
            const result = await usersCollection.updateOne(filter, updatedDoc, options);
            res.send(result);
        })
        //refute the user
        app.put('/users/refute/:sellerId', async (req, res) => {
            const id = req.params.sellerId;
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    verified: false
                }
            }
            const result = await usersCollection.updateOne(filter, updatedDoc, options);
            res.send(result);
        })
        app.delete('/users/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await usersCollection.deleteOne(query);
            res.send(result);
        })
    }
    finally {

    }
}
run().catch(console.log)

app.get('/', async (req, res) => {
    res.send('Cartivate server is running');
})

// app.get('/home', async (req, res) => {
//     // const categories = await productsCollection.toArray()
//     res.send(Category.json);
// })

app.listen(port, () => console.log(`Cartiavate running on ${port}`))