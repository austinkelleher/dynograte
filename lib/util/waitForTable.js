'use strict';

const tri = require('tri');
const NOT_ACTIVE_ERROR = new Error('Not active');

const DYNAMODB_WAIT_FOR_TABLE_ATTEMPT_OPTIONS = {
  initialDelay: 200,

  // Start with 1000ms between each attempt
  delay: 1000,

  // The max delay which is only relevant if 'factor' is provided.
  maxDelay: 3000,

  // Increase delay by power of 2
  factor: 2,

  // Max number of attempts
  maxAttempts: 15,

  jitter: false,

  // Do not retry if AWS error indicates that request is not retryable
  shouldRetry(err) {
    return (err.retryable !== false);
  }
};

module.exports = (dynamodb, tableName, hasSecondaryIndexes, logger) => {
  logger.info(`Waiting for table ${tableName} to become ready...`);

  let retryOptions = DYNAMODB_WAIT_FOR_TABLE_ATTEMPT_OPTIONS;
  retryOptions.logger = logger;

  return tri(() => {
    return new Promise((resolve, reject) => {
      dynamodb.describeTable({ TableName: tableName }, (err, data) => {
        if (err) {
          return reject(err);
        }

        let table = data.Table;

        if (!table || (table.TableStatus !== 'ACTIVE')) {
          // Not ready...
          return reject(NOT_ACTIVE_ERROR);
        }

        if (hasSecondaryIndexes && table.GlobalSecondaryIndexes) {
          let i = table.GlobalSecondaryIndexes.length;
          while(--i >= 0) {
            if (table.GlobalSecondaryIndexes[i].IndexStatus !== 'ACTIVE') {
              // One of the secondary indexes is not ready
              return reject(NOT_ACTIVE_ERROR);
            }
          }
        }

        logger.success(`Finished waiting for DynamoDB table "${tableName}". Table is ready.`);

        // Table is ready
        resolve(true);
      });
    });
  }, retryOptions, 'DynamoDB describeTable');
};
