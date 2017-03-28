/*jshint -W030 */
'use strict';

const aws = require('aws-sdk');
const path = require('path');
const dynograte = require('../');
const uuid = require('uuid');
const chai = require('chai');
const expect = require('chai').expect;
const _createDynamoTable = require('../lib/util/createDynamoTable');
const _putAttrItem = require('../lib/util/putAttrItem');
const _createDummySchema = require('./util/createDummySchema');
const _deleteDynamoTable = require('./util/deleteDynamoTable');
const _addGlobalSecondaryKey = require('./util/addDummyGlobalSecondaryKey');
const _scanDynamoTable = require('./util/scanDynamoTable');
const MigrationTableSchema = require('../lib/MigrationTableSchema');
const config = require('../config');

const attr = require('dynamodb-data-types').AttributeValue;

require('chai').should();
chai.config.includeStack = true;

const dynamodb = new aws.DynamoDB(config.dynamodb);

function _createAndValidateSecondaryKey(dynamodb, tableName) {
  let putItem = {
    id: uuid.v4(),
    homeId: uuid.v4(),
    petId: uuid.v4(),
    testId: uuid.v4(),
    test: 'test'
  };

  return new Promise((resolve, reject) => {
    return _addGlobalSecondaryKey(dynamodb, tableName)
      .then(() => {
        return _putAttrItem(dynamodb, tableName, putItem);
      })
      .then(() => {
        dynamodb.getItem({
          Key: attr.wrap({
            id: putItem.id,
            homeId: putItem.homeId
          }),
          TableName: tableName
        }, (err, data) => {
          if (err) {
            return reject(err);
          }

          expect(data).to.deep.equal({
            Item: attr.wrap(putItem)
          });

          return resolve(data);
        });
      });
  });
}

describe('Migration table test', function() {
  let randomTableName;

  beforeEach(() => {
    const dummySchema = _createDummySchema();
    randomTableName = dummySchema.TableName;

    return _createDynamoTable(dynamodb, dummySchema)
      .then(() => {
        return _putAttrItem(dynamodb, randomTableName, {
          'id': uuid.v4(),
          'homeId': uuid.v4(),
          'petId': uuid.v4(),
          'test': 'test'
        });
      });
  });

  describe('Migration table already exists', () => {
    let randomMigrationTableName;
    let schema = MigrationTableSchema;

    beforeEach(() => {
      randomMigrationTableName = schema.TableName = uuid.v4();
      return _createDynamoTable(dynamodb, schema);
    });

    afterEach(() => {
      return _deleteDynamoTable(dynamodb, randomMigrationTableName)
        .then(() => {
          return _deleteDynamoTable(dynamodb, randomTableName);
        });
    });

    it('should allow passing migrator functions as array to dynograte', () => {
      return dynograte.migrate({
        dynamodb,
        migrationTableName: randomMigrationTableName
      }, [
        (dynamodb) => {
          return _createAndValidateSecondaryKey(dynamodb, randomTableName);
        },
        (dynamodb) => {
          return Promise.resolve();
        }
      ]);
    });

    it('should allow passing single migrator function to dynograte', () => {
      return dynograte.migrate({
        dynamodb,
        migrationTableName: randomMigrationTableName
      }, (dynamodb) => {
        return _createAndValidateSecondaryKey(dynamodb, randomTableName);
      });
    });
  });

  describe('Migration table does not exist', () => {
    let randomMigrationTableName;

    beforeEach(() => {
      randomMigrationTableName = `dynograte-${uuid.v4()}`;
    });

    afterEach(() => {
      return _deleteDynamoTable(dynamodb, randomMigrationTableName)
        .then(() => {
          return _deleteDynamoTable(dynamodb, randomTableName);
        });
    });

    it('should allow migrating when migration table does not exist', () => {
      return dynograte.migrate({
        dynamodb,
        migrationTableName: randomMigrationTableName
      }, (dynamodb) => {
        return _createAndValidateSecondaryKey(dynamodb, randomTableName);
      });
    });
  });

  describe('Migration from a directory', () => {
    let randomMigrationTableName;

    beforeEach(() => {
      randomMigrationTableName = `dynograte-${uuid.v4()}`;
    });

    afterEach(() => {
      return _deleteDynamoTable(dynamodb, randomMigrationTableName)
        .then(() => {
          return _deleteDynamoTable(dynamodb, randomTableName);
        });
    });

    it('should migrate from a specified directory of files', () => {
      let migrationDir = path.resolve(__dirname, './dynamodb-migrations');

      return dynograte.migrate({
        dynamodb,
        migrationTableName: randomMigrationTableName,
        migrationDir: migrationDir
      });
    });
  });

  describe('Failing migrations', () => {
    let randomMigrationTableName;
    let schema = MigrationTableSchema;

    beforeEach(() => {
      randomMigrationTableName = schema.TableName = uuid.v4();
      return _createDynamoTable(dynamodb, schema);
    });

    afterEach(() => {
      return _deleteDynamoTable(dynamodb, randomMigrationTableName)
        .then(() => {
          return _deleteDynamoTable(dynamodb, randomTableName);
        });
    });

    it('should remove row from dynamodb if a migration fails', () => {
      let migrationDir = path.resolve(__dirname, './failing-dynamodb-migrations');

      return new Promise((resolve, reject) => {
        return dynograte.migrate({
          dynamodb,
          migrationTableName: randomMigrationTableName,
          migrationDir: migrationDir
        }).catch((err) => {
          expect(err.message).to.equal('This migration failed!');
          return _scanDynamoTable(dynamodb, randomMigrationTableName)
            .then((res) => {
              expect(res.Items.length).to.equal(0);
              resolve();
            }).catch(reject);
        });
      });
    });
  });
});
