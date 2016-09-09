'use strict';

const fs = require('fs');
const generateMigrationFileName = require('./generateMigrationFileName');
const template = require('./migrationTemplate');

function _createMigrationFile(migrationDir, migrationName) {
  return new Promise((resolve, reject) => {
    let fileName = generateMigrationFileName(migrationDir, migrationName);

    fs.writeFile(fileName, template, (err) => {
      return err ? reject(err) : resolve();
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
        return _createMigrationFile(migrationDir, migrationName);
      } else {
        return _createMigrationDirectory(migrationDir)
          .then(_createMigrationFile(migrationDir, migrationName));
      }
    });
  });
};
