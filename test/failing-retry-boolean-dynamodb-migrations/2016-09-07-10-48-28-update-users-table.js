'use strict';

exports.retry = true;

// This is only used for testing:
exports.timesRun = 0;

exports.up = (dynamodb) => {
  exports.timesRun++;
  return Promise.reject(new Error('This migration failed!'));
};
