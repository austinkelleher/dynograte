'use strict';

const attr = require('dynamodb-data-types').AttributeValue;

module.exports = (dynamodb, tableName, item) => {
  return new Promise((resolve, reject) => {
    dynamodb.putItem({
      Item: attr.wrap(item),
      TableName: tableName
    }, (err, data) => {
      return err ? reject(err) : resolve(data);
    });
  });
};
