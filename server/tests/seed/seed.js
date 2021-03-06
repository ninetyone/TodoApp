const {ObjectID} = require('mongodb');
const jwt = require('jsonwebtoken');

const {Todo} = require('./../../models/todo');
const {User} = require('./../../models/user');

const userOneID = new ObjectID();
const userTwoID = new ObjectID();
const testUsers = [
    {_id: userOneID, email: "abc@example.com", password: 'user1Pass', 
        tokens: [{
            access: 'auth',
            token: jwt.sign({_id: userOneID.toHexString(), access: 'auth'}, process.env.JWT_SECRET).toString()
        }]
    },
    {_id: userTwoID, email: "zzz@example.com", password: 'user2Pass',
        tokens: [{
            access: 'auth',
            token: jwt.sign({_id: userTwoID.toHexString(), access: 'auth'}, process.env.JWT_SECRET).toString()
        }]
    }
];

const testTodos = [
    {text: "Test Todo1", _id: new ObjectID(), _creator: userOneID},
    {text: "Test Todo2", _id: new ObjectID(), completed: true, completedAt: new Date().getTime(), _creator: userTwoID},
    {text: "Test Todo3", _id: new ObjectID(), _creator: userTwoID}
];

const populateTodos = (done) => {
    Todo.remove({}).then(() => {
        Todo.insertMany(testTodos)
    }).then(() => done());
};

const populateUsers = (done) => {
    User.remove({}).then(() => {
        
        const userOne = new User(testUsers[0]).save();
        const userTwo = new User(testUsers[1]).save();
        return Promise.all([userOne, userTwo]);
    }).then(() => done());
};

module.exports = {testTodos, populateTodos, testUsers, populateUsers};