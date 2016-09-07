/*jshint -W030 */
'use strict';

const aws = require('aws-sdk');
const MigrationTable = require('../lib/MigrationTable');
const uuid = require('node-uuid');
const chai = require('chai');
const expect = require('chai').expect;
const _deleteDynamoTable = require('./util/deleteDynamoTable');
const config = require('../config');

require('chai').should();
chai.config.includeStack = true;

const dynamodb = new aws.DynamoDB(config.dynamodb);

describe('Migration table test', function() {
  describe('Creating migration table', () => {
    let randomTableName;
    let migrationTable;

    beforeEach(() => {
      randomTableName = `dynograte-${uuid.v4()}`;
      migrationTable = new MigrationTable(dynamodb, randomTableName);
    });

    afterEach(() => {
      return _deleteDynamoTable(dynamodb, randomTableName);
    });

    it('should create migration table with valid params', () => {
      return new Promise((resolve, reject) => {
        MigrationTable.create(dynamodb, randomTableName)
          .then((migrationTable) => {
            expect(migrationTable.migrationTableName).to.equal(randomTableName);

            dynamodb.describeTable({
              TableName: randomTableName
            }, (err, data) => {
              return err ? reject(err) : resolve(data);
            });
          });
      });
    });

    it('should put file names into migration table and validate they exist', () => {
      let fileName = uuid.v4();
      return MigrationTable.create(dynamodb, randomTableName)
        .then(() => {
          return migrationTable.insert(fileName)
            .then((id) => {
              return migrationTable.alreadyRan(fileName)
                .then((alreadyRan) => {
                  expect(alreadyRan).to.equal(true);
                });
            });
        });
    });

    it('should return false when checking if a file has ran that has not', () => {
      let fileName = uuid.v4();
      return MigrationTable.create(dynamodb, randomTableName)
        .then(() => {
          return migrationTable.alreadyRan(fileName)
            .then((alreadyRan) => {
              expect(alreadyRan).to.equal(false);
            });
          });
    });
  });
});
