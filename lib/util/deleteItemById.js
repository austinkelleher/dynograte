'use strict';

const attr = require('dynamodb-data-types').AttributeValue;

module.exports = (dynamodb, tableName, id) => {
  return new Promise((resolve, reject) => {
    dynamodb.deleteItem({
      TableName: tableName,
      Key: attr.wrap({
        id: id
      })
    }, (err, res) => {
      return err ? reject(err): resolve(res);
    });
  });
};
