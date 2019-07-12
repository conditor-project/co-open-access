'use strict';
/* eslint-env mocha */
/* eslint-disable no-unused-expressions */
const coOpenAccess = require('../index.js');
const elasticsearch = require('elasticsearch');
const pkg = require('../package.json');
const esClient = new elasticsearch.Client();
const Promise = require('bluebird');
const readline = require('readline');
const fs = require('fs');
const path = require('path');
const docObjectInput = require('./dataset/input-docObject.json');
const { expect } = require('chai');

describe(pkg.name + '/index.js', function () {
  describe('doTheJob', function () {
    before(function (done) {
      this.timeout(0);
      const instream = fs.createReadStream(path.join(__dirname, 'dataset', 'unpaywall-results.jsonl'));
      const rl = readline.createInterface(instream);
      const docs = [];
      const options = {
        index: {
          _index: 'unpaywall',
          _type: 'document'
        }
      };

      rl.on('line', (doc) => {
        docs.push(options);
        const jsonObject = JSON.parse(doc);
        docs.push(jsonObject);
      });

      rl.on('close', () => {
        esClient.indices.create({ index: 'unpaywall' })
          .then(() => esClient.bulk({ body: docs }))
          .then(() => Promise.delay(2000))
          .then(() => done())
          .catch(error => done(error));
      });
    });

    it('should do the job and do it well', function (done) {
      coOpenAccess.doTheJob(docObjectInput, (error, docObject) => {
        if (error) return done(error);
        expect(docObject).to.have.property('isOa');
        expect(docObject).to.have.property('isJournalIsOa');
        expect(docObject).to.have.property('journalIsInDoaj');
        expect(docObject).to.have.property('oaStatus');
        expect(docObject).to.have.property('bestOaLocation');
        expect(docObject).to.have.property('oaLocations');
        done();
      });
    });
    after(() => {
      return esClient.indices.delete({ index: 'unpaywall' });
    });
  });
});
