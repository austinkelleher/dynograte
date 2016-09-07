'use strict';

const fs = require('fs');
const path = require('path');
const MigrationTable = require('./MigrationTable');

class Dynograte {
  constructor(options) {
    this.migrationTable = null;

    this.dynamodb = options.dynamodb;
    this.migrationTableName = options.migrationTableName;

    let migrationPath = options.migrationPath;
    this.migrationPath = migrationPath && path.resolve(migrationPath);
  }

  migrate(migrators) {
    return new Promise((resolve, reject) => {
      let dynamodb = this.dynamodb;

      MigrationTable.create(dynamodb, this.migrationTableName)
        .then((migrationTable) => {
          this.migrationTable = migrationTable;

          let promise = Promise.resolve();

          if (migrators) {
            if (typeof migrators === 'function') {
              promise = promise.then(() => migrators(dynamodb));
            } else {
              migrators.map(migrator => {
                promise = promise.then(() => migrator(dynamodb));
              });
            }
          } else {
            fs.readdir(this.migrationPath, (err, files) => {
              files.forEach(fileName => {
                let file = require(fileName);
                promise = promise.then(() => migrationTable.alreadyRan(fileName));

                if (file.migrate) {
                  promise = promise.then(() => file.migrate(dynamodb));
                }
              });
            });
          }

          resolve(promise);
        })
        .catch((err) => reject(err));
    });
  }
}

module.exports = Dynograte;
