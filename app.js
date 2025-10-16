import express from 'express';
import path from 'path';
import { MongoClient, ObjectId } from 'mongodb';

const app = express();
const publicPath = path.resolve('./public');
app.use(express.static(publicPath));

app.set('view engine', 'ejs');

const dbName = "Node-Project";
const collectionName = "todo";
const url = "mongodb://localhost:27017";
const client = new MongoClient(url);

const connection = async () => {
    const connect = await client.connect();
    return connect.db(dbName);
};

app.use(express.urlencoded({ extended: false }));

// Home Page - Show all todos
app.get('/', async (req, resp) => {
    const db = await connection();
    const collection = db.collection(collectionName);
    const result = await collection.find().sort({ _id: -1 }).toArray();
    resp.render('list', { result });
});

// Render Add Task Page
app.get('/add', (req, resp) => {
    resp.render('add');
});

// Render Update Task Page (you may need to send existing task here)
app.get('/update/:id', async (req, resp) => {
    const db = await connection();
    const collection = db.collection(collectionName);
    const result = await collection.findOne({ _id: new ObjectId(req.params.id) });
    if(result)
    {
        resp.render('update', { result });
    }
    else
    {
        resp.send("Some error");
    }
});

// Handle Add Task
app.post('/add', async (req, resp) => {
    const db = await connection();
    const collection = db.collection(collectionName);
    const result = await collection.insertOne(req.body);
    if (result.insertedId) {
        resp.redirect('/');
    } else {
        resp.redirect('/add');
    }
});

// Handle Delete
app.get('/delete/:id', async (req, resp) => {
    const db = await connection();
    const collection = db.collection(collectionName);
    const result = await collection.deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount > 0) {
        resp.redirect('/');
    } else {
        resp.send("Error deleting the task.");
    }
});

// Handle Update
app.post('/update/:id', async (req, resp) => {
    const db = await connection();
    const collection = db.collection(collectionName);
    const filter = { _id: new ObjectId(req.params.id) };
    const updatedData = {
        $set: {
            Title: req.body.Title,
            Description: req.body.Description
        }
    };
    const result = await collection.updateOne(filter, updatedData);
    if (result.acknowledged) {
        resp.redirect('/');
    } else {
        resp.send("Error updating the task.");
    }
});


app.post("/multi-delete", async (req, resp) => {
    const db = await connection();
    const collection = db.collection(collectionName);
    console.log(req.body.selectedTask);
    let selectedTasks=undefined;
    if(Array.isArray(req.body.selectedTask))
    {
        selectedTasks=req.body.selectedTask.map((id)=>new ObjectId(id));
    }
    else
    {
        selectedTasks= [new ObjectId(req.body.selectedTask)];
    }
    console.log(selectedTasks);
    const result=await collection.deleteMany({_id:{$in:selectedTasks}})
    if(result)
    {
        resp.redirect("/");
    }
    else
    {
        resp.send("Some error");
    }
});

// Start server
app.listen(3200);
