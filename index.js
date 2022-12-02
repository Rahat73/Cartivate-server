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
        const ordersCollection = client.db('Cartivate').collection('Orders');

        //getting products using category id
        app.get('/products/:categoryId', async (req, res) => {
            const id = req.params.categoryId;
            const query = { categoryId: id };
            const products = await productsCollection.find(query).toArray();
            res.send(products);
        })


        //fetching user info using email
        app.get('/user/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const result = await usersCollection.find(query).toArray();
            res.send(result);
        })

        //upserting users
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

        //admin check
        app.get('/users/isadmin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({ isAdmin: user?.userType === 'Admin' });
        })

        //buyer check
        app.get('/users/isbuyer/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({ isBuyer: user?.userType === 'Buyer' });
        })

        //seller check
        app.get('/users/isseller/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({ isSeller: user?.userType === 'Seller' });
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
        //delete the user
        app.delete('/users/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await usersCollection.deleteOne(query);
            res.send(result);
        })

        //add product
        app.post('/addproduct', async (req, res) => {
            const product = req.body;
            const d = new Date();
            product.postTime = d;
            const result = await productsCollection.insertOne(product);
            res.send(result);
        })

        //fetching myproducts using seller email
        app.get('/myproducts/:email', async (req, res) => {
            const email = req.params.email;
            const query = { sellerEmail: email };
            const products = await productsCollection.find(query).toArray();
            res.send(products);
        })

        //advertise product
        app.put('/product/advertise/:productId', async (req, res) => {
            const productId = req.params.productId;
            const filter = { _id: ObjectId(productId) }
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    advertise: true
                }
            }
            const result = await productsCollection.updateOne(filter, updatedDoc, options);
            res.send(result);
        })

        //delete product
        app.delete('/productdelete/:productId', async (req, res) => {
            const productId = req.params.productId;
            const query = { _id: ObjectId(productId) };
            const result = await productsCollection.deleteOne(query);
            res.send(result);
        })

        //fetch the products that is advertised and unsold
        app.get('/advertisedProducts', async (req, res) => {
            const query = { advertise: true, soldStatus: false };
            const result = await productsCollection.find(query).toArray();
            res.send(result);
        })


        //booking a product
        app.post('/order', async (req, res) => {
            const order = req.body;
            const result = await ordersCollection.insertOne(order);
            res.send(result);
        })

        //fetch orders with email and product id
        app.get('/orders/:email/:productId', async (req, res) => {
            const email = req.params.email;
            const productId = req.params.productId;
            // console.log(email, productId)
            const query = { userEmail: email, productId: productId };
            const result = await ordersCollection.find(query).toArray();
            res.send(result);
        })

        //fetching myorders from orders and products collection using aggregate
        // app.get('/myorders/:email', async (req, res) => {
        //     const date = req.query.date;
        //     const options = await appointmentOptionCollection.aggregate([
        //         {
        //             $lookup: {
        //                 from: 'bookings',
        //                 localField: 'name',
        //                 foreignField: 'treatment',
        //                 pipeline: [
        //                     {
        //                         $match: {
        //                             $expr: {
        //                                 $eq: ['$appointmentDate', date]
        //                             }
        //                         }
        //                     }
        //                 ],
        //                 as: 'booked'
        //             }
        //         },
        //         {
        //             $project: {
        //                 name: 1,
        //                 slots: 1,
        //                 booked: {
        //                     $map: {
        //                         input: '$booked',
        //                         as: 'book',
        //                         in: '$$book.slot'
        //                     }
        //                 }
        //             }
        //         },
        //         {
        //             $project: {
        //                 name: 1,
        //                 slots: {
        //                     $setDifference: ['$slots', '$booked']
        //                 }
        //             }
        //         }
        //     ]).toArray();
        //     res.send(options);
        // })
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