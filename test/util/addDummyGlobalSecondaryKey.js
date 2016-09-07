'use strict';

module.exports = (dynamodb, tableName) => {
  return new Promise((resolve, reject) => {
    let migTable = {
      TableName: tableName,
      AttributeDefinitions: [
        {
          AttributeName: 'testId',
          AttributeType: 'S'
        }
      ],

      GlobalSecondaryIndexUpdates: [
        {
          Create: {
            IndexName: 'testIndex',
            KeySchema: [
              {
                AttributeName: 'testId',
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
        }
      ]
    };

    dynamodb.updateTable(migTable, (err, data) => {
      return err ? reject(err) : resolve();
    });
  });
};
