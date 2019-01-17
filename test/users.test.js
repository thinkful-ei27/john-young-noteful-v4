'use strict';

const app = require('../server');
const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');

const { TEST_MONGODB_URI } = require('../config');

const User = require('../models/user');

const expect = chai.expect;

chai.use(chaiHttp);

describe.skip('Noteful API - Users', function () {
  const username = 'exampleUser';
  const password = 'examplePass';
  const fullname = 'Example User';
  const fullUser = {username, password, fullname};

  before(function () {
    return mongoose.connect(TEST_MONGODB_URI, { useNewUrlParser: true, useCreateIndex : true })
      .then(() => User.deleteMany());
  });

  beforeEach(function () {
    return User.createIndexes();
  });

  afterEach(function () {
    return User.deleteMany();
  });

  after(function () {
    return mongoose.disconnect();
  });

  describe('POST /api/users', function () {

    it('Should create a new user', function () {
      let res;
      return chai
        .request(app)
        .post('/api/users')
        .send({ username, password, fullname })
        .then(_res => {
          res = _res;
          expect(res).to.have.status(201);
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.keys('id', 'username', 'fullname');
          expect(res.body.id).to.exist;
          expect(res.body.username).to.equal(username);
          expect(res.body.fullname).to.equal(fullname);
          return User.findOne({ username });
        })
        .then(user => {
          expect(user).to.exist;
          expect(user.id).to.equal(res.body.id);
          expect(user.fullname).to.equal(fullname);
          return user.validatePassword(password);
        })
        .then(isValid => {
          expect(isValid).to.be.true;
        });
    });

    it('Should reject users with missing username', function() {
      let res;
      let userCopy = Object.assign({}, fullUser);
      delete userCopy.username;
      return chai
        .request(app)
        .post('/api/users')
        .send(userCopy)
        .then(_res => {
          res = _res;
          expect(res).to.have.status(422);
          expect(res.body.message).to.equal('Missing field in body');
        });
    });
    it('Should reject users with missing password', function() {
      let res;
      let userCopy = Object.assign({}, fullUser);
      delete userCopy.password;
      return chai
        .request(app)
        .post('/api/users')
        .send(userCopy)
        .then(_res => {
          res = _res;
          expect(res).to.have.status(422);
          expect(res.body.message).to.equal('Missing field in body');
        });
    });
    it('Should reject users with non-string username', function() {
      let res;
      let userCopy = Object.assign({}, fullUser);
      userCopy.username = 56;
      return chai
        .request(app)
        .post('/api/users')
        .send(userCopy)
        .then(_res => {
          res = _res;
          expect(res).to.have.status(422);
          expect(res.body.message).to.equal('Incorrect field type: expected string');
        });
    });
    it('Should reject users with non-string password', function() {
      let res;
      let userCopy = Object.assign({}, fullUser);
      userCopy.password = 56;
      return chai
        .request(app)
        .post('/api/users')
        .send(userCopy)
        .then(_res => {
          res = _res;
          expect(res).to.have.status(422);
          expect(res.body.message).to.equal('Incorrect field type: expected string');
        });
    });
    it('Should reject users with non-trimmed username', function() {
      let res;
      let userCopy = Object.assign({}, fullUser);
      userCopy.username = ' thejohnnysalter';
      return chai
        .request(app)
        .post('/api/users')
        .send(userCopy)
        .then(_res => {
          res = _res;
          expect(res).to.have.status(422);
          expect(res.body.message).to.equal('Cannot start or end with whitespace');
        });
    });
    it('Should reject users with non-trimmed password', function() {
      let res;
      let userCopy = Object.assign({}, fullUser);
      userCopy.password = ' thejohnnysalter';
      return chai
        .request(app)
        .post('/api/users')
        .send(userCopy)
        .then(_res => {
          res = _res;
          expect(res).to.have.status(422);
          expect(res.body.message).to.equal('Cannot start or end with whitespace');
        });
    });
    it('Should reject users with empty username', function() {
      let res;
      let userCopy = Object.assign({}, fullUser);
      userCopy.username = '';
      return chai
        .request(app)
        .post('/api/users')
        .send(userCopy)
        .then(_res => {
          res = _res;
          expect(res).to.have.status(422);
          expect(res.body.message).to.equal('Must be at least 2 characters long');
        });
    });
    it('Should reject users with password less than 8 characters', function() {
      let res;
      let userCopy = Object.assign({}, fullUser);
      userCopy.password = 'less';
      return chai
        .request(app)
        .post('/api/users')
        .send(userCopy)
        .then(_res => {
          res = _res;
          expect(res).to.have.status(422);
          expect(res.body.message).to.equal('Must be at least 8 characters long');
        });
    });
    it('Should reject users with password greater than 72 characters', function() {
      let res;
      let userCopy = Object.assign({}, fullUser);
      userCopy.password = 'asuperridiculouslylongpasswordtotestpasswordlengthandithinkthatthisshouldbelongenough';
      return chai
        .request(app)
        .post('/api/users')
        .send(userCopy)
        .then(_res => {
          res = _res;
          expect(res).to.have.status(422);
          expect(res.body.message).to.equal('Wow, what a secure password! However, passwords must be at most 72 characters long');
        });
    });
    it('Should reject users with duplicate username', function() {
      let res;
      let userCopy = Object.assign({}, fullUser);
      return chai
        .request(app)
        .post('/api/users')
        .send(userCopy)
        .then(_res => {
          res = _res;
          return chai
            .request(app)
            .post('/api/users')
            .send(userCopy);
        })
        .then(_res => {
          res = _res;
          expect(res).to.have.status(400);
          expect(res.body.message).to.equal('The username already exists');
        });
    });
    it('Should trim fullname', function() {
      let res;
      let userCopy = Object.assign({}, fullUser);
      userCopy.fullname = ' Johnny Trim';
      return chai
        .request(app)
        .post('/api/users')
        .send(userCopy)
        .then(_res => {
          res = _res;
          expect(res).to.have.status(201);
          expect(res.body.fullname).to.equal('Johnny Trim');
        });
    });

  });

});