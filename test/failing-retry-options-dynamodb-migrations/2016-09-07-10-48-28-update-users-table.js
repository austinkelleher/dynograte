'use strict';

exports.retry = {
  maxAttempts: 3,
  delay: 100,
  factor: 2,
  jitter: true
};

exports.up = (dynamodb) => {
  return Promise.reject(new Error('This migration failed!'));
};
