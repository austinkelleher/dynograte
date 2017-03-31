'use strict';

exports.retry = true;

exports.up = (dynamodb) => {
  return Promise.reject(new Error('This migration failed!'));
};
