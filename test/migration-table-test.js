/*jshint -W030 */
'use strict';

const aws = require('aws-sdk');
const MigrationTable = require('../lib/MigrationTable');
const uuid = require('uuid');
const chai = require('chai');
const expect = require('chai').expect;
const _deleteDynamoTable = require('./util/deleteDynamoTable');
const _queryFileByName = require('../lib/util/queryFileByName');
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
              return migrationTable.shouldRun(fileName)
                .then((shouldRun) => {
                  expect(shouldRun).to.deep.equal({
                    data: {
                      Count: 1,
                      Items: [{
                        filename: {
                          'S': fileName,
                        },
                        id: {
                          'S': id
                        },
                        pending: {
                          'BOOL': true
                        }
                      }],
                      ScannedCount: 1
                    },
                    exists: true,
                    run: false
                  });
                });
            });
        });
    });

    it('should return false when checking if a file has ran that has not', () => {
      let fileName = uuid.v4();
      return MigrationTable.create(dynamodb, randomTableName)
        .then(() => {
          return migrationTable.shouldRun(fileName)
            .then((shouldRun) => {
              expect(shouldRun).to.deep.equal({
                data: {
                  Count: 0,
                  Items: [],
                  ScannedCount: 0
                },
                exists: false,
                run: true
              });
            });
          });
    });

    it('should update `pending`', () => {
      let fileName = uuid.v4();
      let fileId;

      return MigrationTable.create(dynamodb, randomTableName)
        .then(() => {
          return migrationTable.insert(fileName)
            .then(id => {
              fileId = id;

              return _queryFileByName(dynamodb, randomTableName, fileName)
                .then(data => {
                  expect(data.Items[0]).to.deep.equal({
                    filename: {
                      'S': fileName
                    },
                    id: {
                      'S': fileId
                    },
                    pending: {
                      'BOOL': true
                    }
                  });
                });
            })
            .then(() => {
              return migrationTable.updatePending(fileId, false);
            })
            .then(() => {
              return _queryFileByName(dynamodb, randomTableName, fileName)
                .then(data => {
                  expect(data.Items[0]).to.deep.equal({
                    filename: {
                      'S': fileName
                    },
                    id: {
                      'S': fileId
                    },
                    pending: {
                      'BOOL': false
                    }
                  });
                });
            });
        });
    });
  });
});
