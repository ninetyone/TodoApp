const express = require('express');
const bodyParser = require('body-parser');

const {mongoose} = require('./db/mongoose');
const {User} = require('./models/user');
const {Todo} = require('./models/todo');

const app = express();

app.use(bodyParser.json());

app.post('/todos', (req, res) => {
    console.log(req.body);

    const newTodo = new Todo({
        text: req.body.text
    });

    newTodo.save().then(doc => {
        res.send(doc);
    }).catch(e => {
        res.status(400).send(e);
    });    
});


const PORT = 5000;
app.listen(PORT, (err) => {
    if (err) return console.log('Unable to listen on port: ' + PORT);
    console.log('Listening on port: ' + PORT);
});