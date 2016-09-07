/*jshint -W030 */
'use strict';

const aws = require('aws-sdk');
const dynograte = require('../');
const uuid = require('node-uuid');
const chai = require('chai');
const _createDynamoTable = require('../lib/util/createDynamoTable');
const _putAttrItem = require('../lib/util/putAttrItem');
const _createDummySchema = require('./util/createDummySchema');
const _deleteDynamoTable = require('./util/deleteDynamoTable');
const _addGlobalSecondaryKey = require('./util/addDummyGlobalSecondaryKey');
const config = require('../config');

require('chai').should();
chai.config.includeStack = true;

const dynamodb = new aws.DynamoDB(config.dynamodb);

describe('Migration table test', function() {
  describe('Migration table already exists', () => {
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

    afterEach(() => {
      return _deleteDynamoTable(dynamodb, randomTableName);
    });

    it('should allow passing migrator functions to dynograte', () => {
      return dynograte.migrate({
        dynamodb,
        migrationTableName: randomTableName
      }, [
        (dynamodb) => {
          return _addGlobalSecondaryKey(dynamodb, randomTableName);
        },
        (dynamodb) => {
          return Promise.resolve();
        }
      ]);
    });

    it('should allow passing migrator functions to dynograte', () => {
      return dynograte.migrate({
        dynamodb,
        migrationTableName: randomTableName
      }, (dynamodb) => {
        return _addGlobalSecondaryKey(dynamodb, randomTableName);
      });
    });
  });

  describe('Migration table does not exist', () => {
    let randomTableName;

    beforeEach(() => {
      randomTableName = `dynograte-${uuid.v4()}`;
    });

    afterEach(() => {
      return _deleteDynamoTable(dynamodb, randomTableName);
    });

    it('should allow migrating when migration table does not exist', () => {
      return dynograte.migrate({
        dynamodb,
        migrationTableName: randomTableName
      }, (dynamodb) => {
        return _addGlobalSecondaryKey(dynamodb, randomTableName);
      });
    });
  });

  describe('Migration from a directory', () => {
    let randomTableName;

    beforeEach(() => {
      randomTableName = `dynograte-${uuid.v4()}`;
    });

    afterEach(() => {
      return _deleteDynamoTable(dynamodb, randomTableName);
    });

    it('should migrate from a specified directory of files', () => {
      return dynograte.migrate({
        dynamodb,
        migrationTableName: randomTableName,
        migrationPath: './test/dynamodb-migrations'
      });
    });
  });
});
