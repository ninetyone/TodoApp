const expect = require('expect');
const request = require('supertest');

const {app} = require('./../server');
const {Todo} = require('./../models/todo');

const testTodos = [
    {text: "Test Todo1"},
    {text: "Test Todo2"},
    {text: "Test Todo3"}
];

beforeEach(done => {
     Todo.remove({})
     .then(() => {
         Todo.insertMany(testTodos)
     })
     .then(() => done());
});

describe('POST /todos', () => {
    it('Should create a new todo', done => {
        const text = 'Test Todo Task2';
        request(app)
        .post('/todos')
        .send({text})
        .expect(200)
        .expect(res => {
            expect(res.body.text).toBe(text);
        })
        .end((err, res) => {
            if (err) return done(err);

            Todo.find()
            .then(todos => {
                expect(todos.length).toBe(testTodos.length + 1);
                expect(todos[testTodos.length].text).toBe(text);
                done();
            })
            .catch(err => done(err));
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
            
            Todo.find({})
            .then(todos => {
                expect(todos.length).toBe(testTodos.length);
                done();
            })
            .catch(err => done(err));
        });
    });
});

describe('GET /todos', () => {
    it('Should fetch a list of todos', done => {
        request(app).
        get('/todos')
        .expect(200)
        .expect(res => {
            expect(res.body.docs[0].text).toBe(testTodos[0].text);
        }).end(done);
    });
});
