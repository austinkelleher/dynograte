'use strict';

const Dynograte = require('./lib/Dynograte');

exports.create = (options) => {
  return new Dynograte(options);
};

exports.migrate = (options, migrators) => {
  let dynograte = new Dynograte(options);
  return dynograte.migrate(migrators);
};

exports.createMigrationFile = require('./lib/util/createMigrationFile');
