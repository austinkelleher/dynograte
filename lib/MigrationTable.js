'use strict';

const uuid = require('uuid');
const conflogger = require('conflogger');
const MigrationTableSchema = require('./MigrationTableSchema');
const _createDynamoTable = require('./util/createDynamoTable');
const _putAttrItem = require('./util/putAttrItem');
const _deleteItemById = require('./util/deleteItemById');
const _queryFileByName = require('./util/queryFileByName');

class MigrationTable {
  constructor(dynamodb, migrationTableName, logger) {
    this.dynamodb = dynamodb;
    this.migrationTableName = migrationTableName;
    this.logger = conflogger.configure(logger);
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

  deleteFileRowById(id) {
    return _deleteItemById(this.dynamodb, this.migrationTableName, id);
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

  updateFailed(fileId, failed) {
    return new Promise((resolve, reject) => {
      this.dynamodb.updateItem({
        TableName: this.migrationTableName,
        Key: {
          id: {
            'S': fileId
          }
        },
        UpdateExpression: 'set failed = :failed',
        ExpressionAttributeValues: {
          ':failed': {
            'BOOL': failed
          },
        }
      }, (err, data) => {
        return err ? reject(err) : resolve();
      });
    });
  }

  getFileIdByFileName(fileName) {
    return new Promise((resolve, reject) => {

    });
  }

  shouldRun(fileName, file) {
    return _queryFileByName(this.dynamodb, this.migrationTableName, fileName)
      .then(data => {
        // There should only be one record
        const item = data.Items[0];

        if (!item) {
          return {
            exists: false,
            run: true,
            data
          };
        }

        if (item.failed && item.failed.BOOL === true && file.runAfterFail) {
          return {
            exists: true,
            run: true,
            data
          };
        }

        return {
          exists: true,
          run: false,
          data
        };
      });
  }

  static create(dynamodb, migrationTableName, logger) {
    return new Promise((resolve, reject) => {
      let migrationTable = new MigrationTable(dynamodb, migrationTableName, logger);

      dynamodb.describeTable({
        TableName: migrationTableName
      }, (err, data) => {
        if (err && err.code == 'ResourceNotFoundException') {
          let migrationTableSchema = MigrationTableSchema;
          migrationTableSchema.TableName = migrationTableName;

          _createDynamoTable(dynamodb, migrationTableSchema, migrationTable.logger)
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
