'use strict';

module.exports = (dynamodb, tableName) => {
  return new Promise((resolve, reject) => {
    dynamodb.scan({ TableName: tableName }, (err, res) => {
      return err ? reject(err) : resolve(res);
    });
  });
};
