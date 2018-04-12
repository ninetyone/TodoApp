const _ = require('lodash');
const express = require('express');
const bodyParser = require('body-parser');
const {ObjectID} = require('mongodb');

const config = require('./config/config');
const {mongoose} = require('./db/mongoose');
const {User} = require('./models/user');
const {Todo} = require('./models/todo');
const {authenticate} = require('./middleware/authenticate');

const port = process.env.PORT;
const app = express();

app.use(bodyParser.json());

app.post('/todo', authenticate, async (req, res) => {
    const newTodo = new Todo({
        text: req.body.text,
        _creator: req.user._id
    });
    try {
        const todo = await newTodo.save();
        res.send({todo});
    } catch(err) {
        res.status(400).send(err);
    }
});

app.get('/todos', authenticate, async (req, res) => {
    try {
        const todos = await Todo.find({_creator: req.user._id});
        res.send({todos});
    } catch(err) {
        res.status(400).send(err);
    }
});

app.get('/todo/:id', authenticate, async (req, res) => {
    const id = req.params.id;
    if (!ObjectID.isValid(id)) return res.status(400).send({error: `${id} is an invalid todoId`});
    try {
        const todo = await Todo.findOne({_id: id, _creator: req.user._id});
        if (!todo) return res.status(404).send({todo});
        res.send({todo});
    } catch(err) {
        res.status(400).send();
    }
});

app.delete('/todo/:id', authenticate, async (req, res) => {
    const id = req.params.id;
    if (!ObjectID.isValid(id)) return res.status(400).send({error: `${id} is an invalid todoId`});
    try {
        const todo = await Todo.findOneAndRemove({
            _id: id,
            _creator: req.user._id
        });
        if (!todo) return res.status(404).send({todo});
        res.send({todo});
    } catch(err) {
        res.status(400).send();
    }
});

app.patch('/todo/:id', authenticate, async (req, res) => {
    const id = req.params.id;
    const body = _.pick(req.body, ['text', 'completed']);
    if (!ObjectID.isValid(id)) return res.status(400).send({error: `${id} is an invalid todoId`});

    if (_.isBoolean(body.completed) && body.completed) {
        body.completedAt = new Date().getTime();
    } else {
        body.completed = false;
        body.completedAt = null;
    }
    try {
        const todo = await Todo.findOneAndUpdate(
            {
                _id: id,
                _creator: req.user._id
            },
            {
                $set: body
            }, {
                new: true
            }
        );
        if (!todo) return res.status(404).send({todo});
        res.send({todo});
    } catch(err) {
        res.status(400).send();
    }
});

app.post('/user', async (req, res) => {
    const body = _.pick(req.body, ['email', 'password']);
    const newUser = new User(body);
    try {
        await newUser.save();
        const token = await newUser.generateAuthToken();
        res.header('x-auth', token).send(newUser);
    } catch(err) {
        res.status(400).send(err);
    }
});

app.get('/user/me', authenticate, (req, res) => {
    res.send(req.user);
});

app.post('/user/login', async (req, res) => {
    try {
        const body = _.pick(req.body, ['email', 'password']);
        const user = await User.findByCredentials(body.email, body.password);
        const token = await user.generateAuthToken();
        res.header('x-auth', token).send(user);
    } catch(err) {
        res.status(400).send();
    }
});

app.delete('/user/me/token', authenticate, async (req, res) => {
    try {
        await req.user.removeToken(req.token);
        res.send();
    } catch(err) {
        res.status(400).send();
    }
});

app.listen(port, (err) => {
    if (err) return console.log('Unable to listen on port: ' + port);
    console.log('Listening on port: ' + port);
});

module.exports = {
    app
};