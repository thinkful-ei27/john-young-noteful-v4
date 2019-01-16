'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const app = require('../server');
const User = require('../models/user');
const Note = require('../models/note');
const { JWT_SECRET, TEST_DATABASE_URL } = require('../config');
const { TEST_MONGODB_URI } = require('../config');

const expect = chai.expect;

// This let's us make HTTP requests
// in our tests.
// see: https://github.com/chaijs/chai-http
chai.use(chaiHttp);

describe('Protected endpoint', function () {
  const username = 'exampleUser';
  const password = 'examplePass';
  const fullname = 'Example User';

  before(function () {
    return mongoose.connect(TEST_MONGODB_URI, { useNewUrlParser: true, useCreateIndex : true })
      .then(() => User.deleteMany());
  });

  after(function () {
    return mongoose.disconnect();
  });

  beforeEach(function () {
    return User.hashPassword(password).then(password =>
      User.create({
        username,
        password,
        fullname
      })
    );
  });

  afterEach(function () {
    return User.remove({});
  });

  describe('GET /api/notes', function() {
    it('should reject requests that do not provide credentials', function() {
      let res;
      return Promise.all([
        chai.request(app).get('/api/notes'),
        chai.request(app).get('/api/folders'),
        chai.request(app).get('/api/tags'),
      ])
        .then(([notes, folders, tags]) => {
          let notesText = JSON.parse(notes.res.text);
          let foldersText = JSON.parse(folders.res.text);
          let tagsText = JSON.parse(tags.res.text);
          expect(notesText.message).to.equal('Unauthorized');
          expect(foldersText.message).to.equal('Unauthorized');
          expect(tagsText.message).to.equal('Unauthorized');
        });
    });

    it('should reject requests with an invalid token', function() {
      let res;
      const token = jwt.sign(
        {
          username,
          fullname
        },
        'wrongSecret',
        {
          algorithm: 'HS256',
          expiresIn: '7d'
        }
      );
      return chai
        .request(app)
        .get('/api/notes')
        .set('Authorization', `Bearer ${token}`)
        .then(_res => {
          res = _res;
          expect(res).to.have.status(401);
          expect(res.body.message).to.equal('Unauthorized');
        });
    });

    it('should reject requests with an expired token', function() {
      let res;
      const token = jwt.sign(
        {
          user: {
            username,
            fullname
          },
          exp: Math.floor(Date.now() / 1000) - 10 // Expired ten seconds ago
        },
        JWT_SECRET,
        {
          algorithm: 'HS256',
          subject: username
        }
      );
      return chai
        .request(app)
        .get('/api/notes')
        .set('Authorization', `Bearer ${token}`)
        .then(_res => {
          res = _res;
          expect(res).to.have.status(401);
          expect(res.body.message).to.equal('Unauthorized');
        });
    });

    it('should send protected data', function() {
      let res;
      const user = {
        user: {
          username,
          fullname
        }
      };
      const options = {
        algorithm: 'HS256',
        subject: username,
        expiresIn: '7d'
      };
      const token = jwt.sign(user, JWT_SECRET, options);

      return chai
        .request(app)
        .get('/api/notes')
        .set('Authorization', `Bearer ${token}`)
        .then(_res => {
          res = _res;
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('array');
        });
    });

  });
});