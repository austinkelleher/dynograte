'use strict';

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
            fs.readdir(this.migrationDir, (err, files) => {
              if (err) {
                reject(err);
                return;
              }

              files.forEach(fileName => {
                let file = require(`${this.migrationDir}/${fileName}`);
                promise = promise.then(() => {
                  let fileId;
                  // Check if this migration file has already been ran according
                  // to the migration table. If it has, we skip it, otherwise
                  // we run it and insert it into the table.
                  return migrationTable.alreadyRan(fileName)
                    .then(exists => {
                      if (!exists && file.up) {
                        this.logger.info(`Migration file ${fileName} does not exist in migration table. Inserting...`);

                        return migrationTable.insert(fileName)
                          .then(id => {
                            this.logger.info(`Migration file ${fileName} successfully inserted. Migrating...`);

                            fileId = id;

                            let upPromise;

                            if (file.retry) {
                              const retryIsObj = typeof file.retry === 'object';
                              const retryOptions = retryIsObj ? file.retry : DEFAULT_RETRY_OPTIONS;

                              upPromise = tri(() => {
                                return file.up(dynamodb);
                              }, retryOptions, 'dynograte file up');
                            } else {
                              upPromise = file.up(dynamodb);
                            }

                            return upPromise
                              .catch((err) => {
                                this.logger.error(`Migration file ${fileName} failed to migrate with error: "${err}". Removing migration file row.`);
                                // If an error occurred running this migration,
                                // we need to remove the migration row, so that
                                // it will get run again next time.
                                return this.migrationTable.deleteFileRowById(fileId)
                                  .then(() => {
                                    return Promise.reject(err);
                                  });
                              });
                          })
                          .then(() => {
                            this.logger.info(`Migration file ${fileName} successfully migrated. Update file pending...`);
                            return migrationTable.updatePending(fileId, false);
                          })
                          .then(() => {
                            this.logger.info(`Successfully updated 'pending' for ${fileName}. Migration complete.`);
                          });
                      } else {
                        this.logger.warn(`Migration file ${fileName} already ran. Skipping...`);
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

  getLogger() {
    return this.logger;
  }
}

module.exports = Dynograte;
