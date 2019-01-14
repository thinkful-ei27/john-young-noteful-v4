'use strict';

// Require all of our modules
const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const express = require('express');

const app = require('../server');
const Tag = require('../models/tag');
const Note = require('../models/note');
const Folder = require('../models/folder');
const { notes, tags, folders } = require('../db/data');
const { TEST_MONGODB_URI } = require('../config');

chai.use(chaiHttp);
const expect = chai.expect;

describe('Noteful app - Users', function() {
  before(function() {
    return mongoose.connect(TEST_MONGODB_URI, {useNewUrlParser: true})
      .then(() => mongoose.connection.db.dropDatabase());
  });

  beforeEach(function() {
    return Promise.all([
      Note.insertMany(notes),
      Folder.insertMany(folders),
      Tag.insertMany(tags)
    ]);
  });

  afterEach(function () {
    return mongoose.connection.db.dropDatabase();
  });

  after(function () {
    return mongoose.disconnect();
  });

  describe('POST /api/users', function() {
    it('should create a new user in the database and return the correct results', function() {
      const newUser = {
        username: 'afrequentuser',
        password: 'password'
      };
      let body;

      return chai.request(app)
        .post('/api/users')
        .send(newUser)
        .then(function(res) {
          body = res.body;
          expect(res).to.have.status(201);
          expect(body).to.have.all.keys('id', 'username');
        });
    });
    
    it('should return a 422 if missing a field', function() {
      const newItem = {
        username: 'testUser'
      };
      let body;

      return chai.request(app)
        .post('/api/users')
        .send(newItem)
        .then(function(res) {
          body = res.body;
          expect(res).to.have.status(422);
          expect(body.message).to.equal('Missing field in body');
        });
    });
  });

});