'use strict';

const uuid = require('node-uuid');
const _createDynamoTable = require('./util/createDynamoTable');
const _putAttrItem = require('./util/putAttrItem');

// TODO: Use dynograte to have migrations for the migration table!
const MIGRATION_TABLE_SCHEMA = {
  AttributeDefinitions: [
    {
      AttributeName: 'id',
      AttributeType: 'S'
    },
    {
      AttributeName: 'filename',
      AttributeType: 'S'
    }
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: 'filename_index',
      KeySchema: [
        {
          AttributeName: 'filename',
          KeyType: 'HASH'
        }
      ],
      Projection: {
        ProjectionType: 'ALL'
      },
      ProvisionedThroughput: {
        ReadCapacityUnits: 1,
        WriteCapacityUnits: 1
      }
    }
  ],
  KeySchema: [
    {
      AttributeName: 'id',
      KeyType: 'HASH'
    }
  ],
  ProvisionedThroughput: {
    ReadCapacityUnits: 1,
    WriteCapacityUnits: 1
  }
};

class MigrationTable {
  constructor(dynamodb, migrationTableName) {
    this.dynamodb = dynamodb;
    this.migrationTableName = migrationTableName;
  }

  /**
   * Insert new migration record
   */
  insert(fileName) {
    let id = uuid.v4();
    return _putAttrItem(this.dynamodb, this.migrationTableName, {
      id: id,
      filename: fileName
    }).then(() => id);
  }

  alreadyRan(fileName) {
    return new Promise((resolve, reject) => {
      let params = {
        TableName: this.migrationTableName,
        IndexName: 'filename_index',
        KeyConditions: {
          filename: {
            AttributeValueList: [
              {
                'S': fileName
              }
            ],
            ComparisonOperator: 'EQ'
          }
        }
      };

      this.dynamodb.query(params, (err, data) => {
        // If Items contains more than 0 records, we already ran this migration,
        // so we resolve with true, otherwise false
        return err ? reject(err) : resolve(data.Items.length > 0);
      });
    });
  }

  static create(dynamodb, migrationTableName) {
    return new Promise((resolve, reject) => {
      let migrationTable = new MigrationTable(dynamodb, migrationTableName);

      dynamodb.describeTable({
        TableName: migrationTableName
      }, (err, data) => {
        if (err && err.code == 'ResourceNotFoundException') {
          let migrationTableSchema = MIGRATION_TABLE_SCHEMA;
          migrationTableSchema.TableName = migrationTableName;

          _createDynamoTable(dynamodb, migrationTableSchema)
            .then(() =>
              resolve(migrationTable))
            .catch((err) =>
              reject(err));
        } else if (err) {
          reject(err);
        } else {
          resolve(migrationTable);
        }
      });
    });
  }
}

module.exports = MigrationTable;
