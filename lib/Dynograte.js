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
            resolve(promise);
          } else {
            fs.readdir(this.migrationPath, (err, files) => {
              if (err) {
                reject(err);
                return;
              }

              files.forEach(fileName => {
                let file = require(`${this.migrationPath}/${fileName}`);
                promise = promise.then(() => {
                  // Check if this migration file has already been ran according
                  // to the migration table. If it has, we skip it, otherwise
                  // we run it and insert it into the table.
                  return migrationTable.alreadyRan(fileName)
                    .then(exists => {
                      if (!exists && file.up) {
                        return file.up(dynamodb)
                          .then(() => {
                            return migrationTable.insert(fileName);
                          });
                      }
                    });
                });
              });

              resolve(promise);
            });
          }
        })
        .catch((err) => reject(err));
    });
  }
}

module.exports = Dynograte;
