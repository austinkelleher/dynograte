'use strict';

module.exports = (dynamodb, schema) => {
  return new Promise((resolve, reject) => {
    dynamodb.createTable(schema, (err, data) => {
      return err ? reject(err) : resolve();
    });
  });
};
