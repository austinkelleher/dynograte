'use strict';

const uuid = require('node-uuid');
const MigrationTableSchema = require('./MigrationTableSchema');
const _createDynamoTable = require('./util/createDynamoTable');
const _putAttrItem = require('./util/putAttrItem');
const _queryFileByName = require('./util/queryFileByName');

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
      filename: fileName,
      pending: true
    }).then(() => id);
  }

  updatePending(fileId, pending) {
    return new Promise((resolve, reject) => {
      this.dynamodb.updateItem({
        TableName: this.migrationTableName,
        Key: {
          id: {
            'S': fileId
          }
        },
        UpdateExpression: 'set pending = :pending',
        ExpressionAttributeValues: {
          ':pending': {
            'BOOL': pending
          },
        }
      }, (err, data) => {
        return err ? reject(err) : resolve();
      });
    });
  }

  alreadyRan(fileName) {
    return _queryFileByName(this.dynamodb, this.migrationTableName, fileName)
      .then(data => data.Items.length > 0);
  }

  static create(dynamodb, migrationTableName) {
    return new Promise((resolve, reject) => {
      let migrationTable = new MigrationTable(dynamodb, migrationTableName);

      dynamodb.describeTable({
        TableName: migrationTableName
      }, (err, data) => {
        if (err && err.code == 'ResourceNotFoundException') {
          let migrationTableSchema = MigrationTableSchema;
          migrationTableSchema.TableName = migrationTableName;

          _createDynamoTable(dynamodb, migrationTableSchema)
            .then(() => resolve(migrationTable))
            .catch(err => reject(err));
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
