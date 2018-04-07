const express = require('express');
const bodyParser = require('body-parser');

const {mongoose} = require('./db/mongoose');
const {User} = require('./models/user');
const {Todo} = require('./models/todo');

const app = express();

app.use(bodyParser.json());

app.post('/todos', (req, res) => {
    const newTodo = new Todo({
        text: req.body.text
    });

    newTodo.save()
    .then(doc => {
        res.send(doc);
    })
    .catch(err => {
        res.status(400).send(err);
    });
});

app.get('/todos', (req, res) => {
    Todo.find()
    .then(docs => {
        res.send({docs});
    })
    .catch(err => {
        res.status(404).send(err);
    });
});


const PORT = 5000;
app.listen(PORT, (err) => {
    if (err) return console.log('Unable to listen on port: ' + PORT);
    console.log('Listening on port: ' + PORT);
});

module.exports = {
    app
};