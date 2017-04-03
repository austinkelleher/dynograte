'use strict';

const tri = require('tri');
const conflogger = require('conflogger');
const waitForTable = require('./waitForTable');

const DYNAMODB_CREATE_TABLE_ATTEMPT_OPTIONS = {
  // Start with 200ms between each attempt
  delay: 200,

  // The max delay which is only relevant if 'factor' is provided.
  maxDelay: 1000,

  // Increase delay by power of 2
  factor: 2,

  // Max number of attempts
  maxAttempts: 10,

  jitter: true,

  // Do not retry if AWS error indicates that request is not retryable
  shouldRetry(err) {
    return (err.retryable !== false);
  }
};

module.exports = (dynamodb, options, logger) => {
  const tableName = options.TableName;

  // Configure the logger in the tests
  logger = conflogger.configure(logger);

  logger.info(`Creating DynamoDB table "${tableName}"...`);

  let retryOptions = DYNAMODB_CREATE_TABLE_ATTEMPT_OPTIONS;
  retryOptions.logger = logger;

  return tri(() => {
    return new Promise((resolve, reject) => {
      dynamodb.createTable(options, (err, data) => {
        return err ? reject(err) : resolve();
      });
    });
  }, retryOptions, 'DynamoDB createTable').then((data) => {
    logger.info(`Created DynamoDB table "${tableName}".`);

    const hasSecondaryIndexes = options.GlobalSecondaryIndexes && options.GlobalSecondaryIndexes.length;
    return waitForTable(dynamodb, tableName, hasSecondaryIndexes, logger);
  }).catch((err) => {
    if (err.code === 'ResourceInUseException') {
      logger.info(`Skipping creating table ${tableName} because it already exists`);
      return true;
    } else {
      logger.error(`Error creating table ${tableName}.`, JSON.stringify(err));
      throw err;
    }
  });
};
