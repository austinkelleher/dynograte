'use strict';

module.exports = (dynamodb, migrationTableName, fileName) => {
  return new Promise((resolve, reject) => {
    dynamodb.query({
      TableName: migrationTableName,
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
    }, (err, data) => {
      return err ? reject(err) : resolve(data);
    });
  });
};
