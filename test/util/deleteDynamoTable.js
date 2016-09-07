'use strict';

module.exports = (dynamodb, tableName) => {
  return new Promise((resolve, reject) => {
    dynamodb.deleteTable({
      TableName: tableName
    }, function(err, data) {
      return err ? reject(err) : resolve();
    });
  });
};
