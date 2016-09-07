const uuid = require('node-uuid');

module.exports = () => {
  return {
    TableName: `dynograte-${uuid.v4()}`,
    AttributeDefinitions: [
      {
        AttributeName: 'id',
        AttributeType: 'S'
      },
      {
        AttributeName: 'homeId',
        AttributeType: 'S'
      },
      {
        AttributeName: 'petId',
        AttributeType: 'S'
      }
    ],
    KeySchema: [
      {
        AttributeName: 'homeId',
        KeyType: 'HASH'
      },
      {
        AttributeName: 'id',
        KeyType: 'RANGE'
      }
    ],

    ProvisionedThroughput: {
      ReadCapacityUnits: 1,
      WriteCapacityUnits: 1
    },

    GlobalSecondaryIndexes: [
      {
        IndexName: 'petIndex',
        KeySchema: [
          {
            AttributeName: 'homeId',
            KeyType: 'HASH'
          },
          {
            AttributeName: 'petId',
            KeyType: 'RANGE'
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
    ]
  };
};
