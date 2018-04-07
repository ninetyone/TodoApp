const express = require('express');
const bodyParser = require('body-parser');
const {ObjectID} = require('mongodb');

const {mongoose} = require('./db/mongoose');
const {User} = require('./models/user');
const {Todo} = require('./models/todo');

const port = process.env.PORT || 5000;
const app = express();

app.use(bodyParser.json());

app.post('/todos', (req, res) => {
    const newTodo = new Todo({
        text: req.body.text
    });

    newTodo.save().then(todo => {
        res.send({todo});
    }).catch(err => {
        res.status(400).send(err);
    });
});

app.get('/todos', (req, res) => {
    Todo.find().then(todos => {
        res.send({todos});
    }).catch(err => {
        res.status(404).send(err);
    });
});

app.get('/todo/:id', (req, res) => {
    const id = req.params.id;
    if (!ObjectID.isValid(id)) return res.status(400).send({error: `${id} is an invalid todoId`});

    Todo.findById(id).then(todo => {
        if (!todo) return res.status(404).send({});
        res.send({todo});
    }).catch(err => {
        res.status(404).send();
    });
});

app.listen(port, (err) => {
    if (err) return console.log('Unable to listen on port: ' + port);
    console.log('Listening on port: ' + port);
});

module.exports = {
    app
};