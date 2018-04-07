const expect = require('expect');
const request = require('supertest');
const {ObjectID} = require('mongodb');

const {app} = require('./../server');
const {Todo} = require('./../models/todo');

const testTodos = [
    {text: "Test Todo1", _id: new ObjectID()},
    {text: "Test Todo2", _id: new ObjectID()},
    {text: "Test Todo3", _id: new ObjectID()}
];

beforeEach(done => {
     Todo.remove({}).then(() => {
         Todo.insertMany(testTodos)
     }).then(() => done());
});

describe('POST /todos', () => {
    it('Should create a new todo', done => {
        const text = 'Test Todo Task2';
        request(app)
        .post('/todos')
        .send({text})
        .expect(200)
        .expect(res => {
            expect(res.body.todo.text).toBe(text);
        })
        .end((err, res) => {
            if (err) return done(err);

            Todo.find().then(todos => {
                expect(todos.length).toBe(testTodos.length + 1);
                expect(todos[testTodos.length].text).toBe(text);
                done();
            }).catch(err => done(err));
        })
    });

    it('Should not create a new todo with invalid body', done => {
        const todoText = '  ';
        request(app)
        .post('/todos')
        .send({todoText})
        .expect(400)
        .end((err, res) => {
            if (err) return done(err);
            
            Todo.find({}).then(todos => {
                expect(todos.length).toBe(testTodos.length);
                done();
            }).catch(err => done(err));
        });
    });
});

describe('GET /todos', () => {
    it('Should fetch a list of todos', done => {
        request(app).
        get('/todos')
        .expect(200)
        .expect(res => {
            expect(res.body.todos[0].text).toBe(testTodos[0].text);
        }).end(done);
    });
});

describe('GET /todo/:id', () => {
    it('Should return the todo matching with id', done => {
        const id = testTodos[0]._id.toHexString();
        request(app)
        .get(`/todo/${id}`)
        .expect(200)
        .expect(res => {
            expect(res.body.todo.text).toBe(testTodos[0].text);
        })
        .end(done);
    });

    it('Should return 400 when ObjectId is invalid', done => {
        const id = testTodos[0]._id + 123;
        request(app)
        .get(`/todo/${id}`)
        .expect(400)
        .expect(res => {
            expect(res.body.error).toBe(`${id} is an invalid todoId`);
        })
        .end(done);
    });

    it('Should return 404 when id doesn\'t match', done => {
        const id = new ObjectID().toHexString();
        request(app)
        .get(`/todo/${id}`)
        .expect(404)
        .expect(res => {
            expect(res.body.todo).toBeNull();
        })
        .end(done);
    });
});

describe('DELETE /todo/:id', () => {
    it('Should remove todo for a valid ObjectId', done => {
        const id = testTodos[0]._id;
        request(app)
        .delete(`/todo/${id}`)
        .expect(200)
        .expect(res => {
            expect(res.body.todo.text).toBe(testTodos[0].text);
        })
        .end(done);
    });

    it('Should return 404 if todo not found', done => {
        const id = new ObjectID();
        request(app)
        .delete(`/todo/${id}`)
        .expect(404)
        .expect(res => {
            expect(res.body.todo).toBeNull();
        })
        .end(done);
    });

    it('Should return 400 for an invalid ObjectId', done => {
        const id = new ObjectID() + '123';
        request(app)
        .delete(`/todo/${id}`)
        .expect(400)
        .expect(res => {
            expect(res.body.error).toBe(`${id} is an invalid todoId`);
        })
        .end(done);
    });
});