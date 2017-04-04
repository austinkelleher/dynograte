'use strict';

const path = require('path');
const fs = require('fs');
const conflogger = require('conflogger');
const tri = require('tri');
const MigrationTable = require('./MigrationTable');

const DEFAULT_RETRY_OPTIONS = {
  maxAttempts: 5,
  interval: 200,
  factor: 2,
  jitter: true,
  attemptTimeout: 2000
};

function _runMigration(dynograte, migrationTable, fileName, file) {
  const dynamodb = dynograte.dynamodb;
  const logger = dynograte.logger;

  return function() {
    let fileId;
    // Check if this migration file has already been ran according
    // to the migration table. If it has, we skip it, otherwise
    // we run it and insert it into the table.
    return migrationTable.shouldRun(fileName, file)
      .then(res => {
        let shouldRun = res.run;
        let alreadyExists = res.exists;

        let migrationPromise = Promise.resolve();

        if (shouldRun && file.up) {
          logger.info(`Migration file ${fileName} does not exist in migration table. Inserting...`);

          if (!alreadyExists) {
            migrationPromise = migrationPromise.then(() => migrationTable.insert(fileName));
          } else {
            // If the file already exists, return the file Id of this file
            migrationPromise = migrationPromise.then(() => res.data.Items[0].id.S);
          }

          migrationPromise = migrationPromise
            .then(id => {
              logger.info(`Migration file ${fileName} successfully inserted. Migrating...`);

              fileId = id;

              let upPromise;

              if (file.retry) {
                const retryIsObj = typeof file.retry === 'object';
                const retryOptions = retryIsObj ? file.retry : DEFAULT_RETRY_OPTIONS;

                retryOptions.logger = logger;

                upPromise = tri(() => {
                  return file.up(dynamodb);
                }, retryOptions, 'dynograte file up');
              } else {
                upPromise = file.up(dynamodb);
              }

              return upPromise
                .catch((err) => {
                  logger.error(`Migration file ${fileName} failed to migrate with error: "${err}". Setting failed in row.`, err);
                  // If an error occurred running this migration,
                  // we set failed to true. Failed states will
                  // run again next time the migrations are run.
                  // Failed migrations will NOT run again if
                  // the `runNextMigrateAfterFail` flag is not set to true
                  // in the migration file
                  return migrationTable.updateFailed(fileId, true)
                    .then(() => Promise.reject(err));
                });
            })
            .then(() => {
              logger.info(`Migration file ${fileName} successfully migrated. Update file 'pending' property to 'false'...`);
              return migrationTable.updatePending(fileId, false);
            })
            .then(() => {
              logger.info(`Successfully updated 'pending' for ${fileName}. Migration complete.`);
              logger.info(`Updating migration file 'failed' property to 'false'...`);
              return migrationTable.updateFailed(fileId, false);
            })
            .then(() => {
              logger.info(`Successfully updated migration file 'failed' property for ${fileName}. Migration complete!`);
            });
        } else {
          logger.warn(`Migration file ${fileName} already ran. Skipping...`);
        }

        return migrationPromise;
      });
  };
}

class Dynograte {
  constructor(options) {
    this.migrationTable = null;
    this.dynamodb = options.dynamodb;
    this.migrationTableName = options.migrationTableName;
    this.logger = conflogger.configure(options.logger);

    let migrationDir = options.migrationDir;
    this.migrationDir = migrationDir && migrationDir.replace(/\/$/, '');
  }

  migrate(migrators) {
    return new Promise((resolve, reject) => {
      let dynamodb = this.dynamodb;

      MigrationTable.create(dynamodb, this.migrationTableName, this.logger)
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
            fs.readdir(this.migrationDir, (err, files) => {
              if (err) {
                reject(err);
                return;
              }

              for (let i = 0; i < files.length; i++) {
                let fileName = files[i];
                let file;
                let filePath;

                try {
                  filePath = path.resolve(this.migrationDir, fileName);
                  file = require(filePath);
                } catch(e) {
                  this.logger.error(`Could not load migration file at path ${filePath}`);
                  return reject(e);
                }

                promise = promise.then(_runMigration(this, migrationTable, fileName, file));
              }

              resolve(promise);
            });
          }
        })
        .catch((err) => reject(err));
    });
  }

  getLogger() {
    return this.logger;
  }
}

module.exports = Dynograte;
