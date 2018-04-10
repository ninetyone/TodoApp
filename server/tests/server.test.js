const expect = require('expect');
const request = require('supertest');
const {ObjectID} = require('mongodb');

const {app} = require('./../server');
const {Todo} = require('./../models/todo');
const {User} = require('./../models/user');
const {testTodos, populateTodos, testUsers, populateUsers} = require('./seed/seed')

beforeEach(populateTodos);
beforeEach(populateUsers);

describe('POST /todo', () => {
    it('Should create a new todo', done => {
        const text = 'Test Todo Task2';
        request(app)
        .post('/todo')
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
        .post('/todo')
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
        .end((err, res) => {
            if (err) return done(err);

            Todo.findById(id).then(todo => {
                expect(todo).toBeNull();
                done();
            }).catch(err => done(err));
        });
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

describe('PATCH /todo/:id', () => {
    it('Should update the todo', done => {
        const id = testTodos[0]._id;
        const body = {
            text: "This is a patch update",
            completed: true
        }
        request(app)
        .patch(`/todo/${id}`)
        .send(body)
        .expect(200)
        .expect(res => {
            expect(res.body.todo.text).toBe(body.text);
            expect(res.body.todo.completed).toBe(true);
        })
        .end((err, res) => {
            if (err) return done(err);

            Todo.findById(id).then(todo => {
                expect(todo.text).toBe(body.text);
                expect(res.body.todo.completed).toBe(true);
                expect(typeof res.body.todo.completedAt).toBe('number');
                done();
            }).catch(err => done(err));
        });
    });

    it('Should clear completedAt when todo is complete', done => {
        const id = testTodos[1]._id;
        const body = {
            text: "This is a patch update",
            completed: false
        }
        request(app)
        .patch(`/todo/${id}`)
        .send(body)
        .expect(200)
        .expect(res => {
            expect(res.body.todo.text).toBe(body.text);
            expect(res.body.todo.completed).toBe(false);
            expect(res.body.todo.completedAt).toBeNull();
        })
        .end((err, res) => {
            if (err) return done(err);

            Todo.findById(id).then(todo => {
                expect(res.body.todo.text).toBe(body.text);
                expect(res.body.todo.completed).toBe(false);
                expect(res.body.todo.completedAt).toBeNull();
                done();
            }).catch(err => done(err));
        });
    });

});

describe('GET /user/me', () => {

    it('Should return user if authenticated', done => {
        request(app)
        .get('/user/me')
        .set('x-auth', testUsers[0].tokens[0].token)
        .expect(200)
        .expect((res) => {
            expect(res.body._id).toBe(testUsers[0]._id.toHexString());
            expect(res.body.email).toBe(testUsers[0].email);
        })
        .end(done);
    });

    it('Should return 401 if user not authenticated', done => {
        request(app)
        .get('/user/me')
        .expect(401)
        .expect((res) => {
            expect(res.body).toEqual({});
        })
        .end(done);
    });
});

describe('POST /user', () => {

    it('Should return new user and auth token if user created', done => {
        const input = {
            email: 'test321@gmail.com',
            password: 'clearPass'
        };
        request(app)
        .post('/user')
        .send(input)
        .expect(200)
        .expect((res) => {
            expect(res.headers['x-auth']).toBeTruthy();
            expect(res.body._id).toBeTruthy();
            expect(res.body.email).toBe(input.email);
        })
        .end((err) => {
            if (err) return done(err);
            User.findOne({email: input.email}).then(user => {
                expect(user).toBeTruthy();
                expect(user.password).not.toBe(input.password);
                done();
            }).catch(err => {
                done(err);  
            });
        });
    });

    it('Should return 400 if bad request', done => {
        const input = {
            email: 'tess@abc.com',
            password: ''
        };
        request(app)
        .post('/user')
        .send(input)
        .expect(400)
        .end(done);
    });

    it('Should return 400 if email already registered', done => {
        const input = {
            email: testUsers[0].email,
            password: '123456'
        };
        request(app)
        .post('/user')
        .send(input)
        .expect(400)
        .end(done);
    });
});

describe('POST /user/login', () => {
    it('Should login user and return auth token', done => {
        const input = {email: testUsers[1].email, password: testUsers[1].password};
        request(app).
        post('/user/login')
        .send(input)
        .expect(200)
        .expect(res => {
            expect(res.headers['x-auth']).toBeTruthy();
            expect(res.body.email).toBe(testUsers[1].email);
        })
        .end((err, res) => {
            if (err) return done(err);
            User.findById(testUsers[1]._id).then((user) => {
                expect(user.tokens[0]).toHaveProperty('access', 'auth');
                expect(user.tokens[0]).toHaveProperty('token', res.headers['x-auth']);
                done();
            }).catch(err => {
                done(err);  
            });
        });
    });

    it('Should return 400 if invalid login credentials', done => {
        const input = {email: testUsers[1].email, password: 'incorrect password'};
        request(app).
        post('/user/login')
        .send(input)
        .expect(400)
        .expect(res => {
            expect(res.headers['x-auth']).toBeFalsy();
        })
        .end((err, res) => {
            User.findById(testUsers[1]._id).then(user => {
                expect(user.tokens.length).toBe(0);
                done();
            }).catch(err => done(err));
        });
    });

});

describe('DELETE /user/me/token', () => {

    it('Should delete the token for the user', done => {
        request(app)
        .delete('/user/me/token')
        .set('x-auth', testUsers[0].tokens[0].token)
        .expect(200)
        .end(res => {
            User.findById(testUsers[0]._id).then(user => {
                expect(user.tokens.length).toBe(0);
                done();
            }).catch(err => done(err));
        });
    });

});