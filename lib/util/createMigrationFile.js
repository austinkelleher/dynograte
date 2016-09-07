'use strict';

const fs = require('fs');
const generateMigrationFileName = require('./generateMigrationFileName');
const template = require('./migrationTemplate');

function _createMigrationFile(migrationPath, migrationName) {
  return new Promise((resolve, reject) => {
    let fileName = generateMigrationFileName(migrationPath, migrationName);

    fs.writeFile(fileName, template, (err) => {
      return err ? reject(err) : resolve();
    });
  });
}

function _createMigrationDirectory(migrationPath) {
  return new Promise((resolve, reject) => {
    fs.mkdir(migrationPath, (err) => {
      return err ? reject(err) : resolve();
    });
  });
}

module.exports = (migrationPath, migrationName) => {
  return new Promise((resolve, reject) => {
    fs.exists(migrationPath, (exists) => {
      if (exists) {
        return _createMigrationFile(migrationPath, migrationName);
      } else {
        return _createMigrationDirectory(migrationPath)
          .then(_createMigrationFile(migrationPath, migrationName));
      }
    });
  });
};
