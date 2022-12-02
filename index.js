const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
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
        //admin queries all reported items
        app.get('/users/admin/reportedItems', async (req, res) => {
            const query = { reportStatus: true };
            const result = await productsCollection.find(query).toArray();
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
        //delete the product
        app.delete('/products/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await productsCollection.deleteOne(query);
            res.send(result);
        })
        app.put('/report/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    reportStatus: true
                }
            }
            const result = await productsCollection.updateOne(filter, updatedDoc, options);
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
        app.put('/order/:email/:productId', async (req, res) => {
            const email = req.params.email;
            const productId = req.params.productId;
            const order = req.body;
            const filter = { userEmail: email, productId: productId };
            const options = { upsert: true };
            const updateDoc = {
                $set: order,
            }
            const result = await ordersCollection.updateOne(filter, updateDoc, options);
            console.log(result);
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

        //fetching a single order
        app.get('/order/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await ordersCollection.findOne(query)
            res.send(result);
        })


        //fetching myorders with email
        app.get('/myorders/:email', async (req, res) => {
            const email = req.params.email;
            const query = { userEmail: email };
            const result = await ordersCollection.find(query).toArray();
            res.send(result);
        })
        // app.get('/myorders/:email', async (req, res) => {
        //     const email = req.params.email;
        //     const query = { userEmail: email };
        //     const orders = await ordersCollection.find(query).toArray();

        //     const productQuery = {}
        //     const products = await productsCollection.find(productQuery).toArray();

        //     products.forEach(product => {
        //         const userOrders = orders.filter(order => order.productId == product._id);
        //         console.log(userOrders)
        //     })
        //     res.send(products)
        // });

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


        app.post('/create-payment-intent', async (req, res) => {
            const booking = req.body;
            const price = booking.price;
            const amount = price * 100;

            const paymentIntent = await stripe.paymentIntents.create({
                currency: 'usd',
                amount: amount,
                "payment_method_types": [
                    "card"
                ]
            });
            res.send({
                clientSecret: paymentIntent.client_secret,
            });
        });

        // app.post('/payments', async (req, res) => {
        //     const payment = req.body;
        //     const result = await paymentsCollection.insertOne(payment);
        //     const id = payment.bookingId
        //     const filter = { _id: ObjectId(id) }
        //     const updatedDoc = {
        //         $set: {
        //             paid: true,
        //             transactionId: payment.transactionId
        //         }
        //     }
        //     const updatedResult = await bookingsCollection.updateOne(filter, updatedDoc)
        //     res.send(result);
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