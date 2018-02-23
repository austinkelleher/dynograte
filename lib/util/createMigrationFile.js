'use strict';

const fs = require('fs');
const generateMigrationFileName = require('./generateMigrationFileName');
const template = require('./migrationTemplate');

function _createMigrationFile(migrationDir, migrationName) {
  return new Promise((resolve, reject) => {
    let fileName = generateMigrationFileName(migrationDir, migrationName);

    fs.writeFile(fileName, template, (err) => {
      return err ? reject(err) : resolve(fileName);
    });
  });
}

function _createMigrationDirectory(migrationDir) {
  return new Promise((resolve, reject) => {
    fs.mkdir(migrationDir, (err) => {
      return err ? reject(err) : resolve();
    });
  });
}

module.exports = (migrationDir, migrationName) => {
  return new Promise((resolve, reject) => {
    fs.exists(migrationDir, (exists) => {
      if (exists) {
        _createMigrationFile(migrationDir, migrationName)
          .then(resolve)
          .catch(reject);
      } else {
        _createMigrationDirectory(migrationDir)
          .then(function () {
            return _createMigrationFile(migrationDir, migrationName);
          })
          .then(resolve)
          .catch(reject);
      }
    });
  });
};
