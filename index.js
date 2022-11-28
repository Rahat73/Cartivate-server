const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
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
        app.post('/users', async (req, res) => {
            const user = req.body;
            user.verified = false;
            const result = await usersCollection.insertOne(user);
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