'use strict';

exports.runNextMigrateAfterFail = true;

// This is only used for testing:
exports.timesRun = 0;

exports.up = (dynamodb) => {
  exports.timesRun++;
  if (exports.timesRun === 2) {
    return Promise.resolve();
  }
  return Promise.reject(new Error('This migration failed!'));
};
