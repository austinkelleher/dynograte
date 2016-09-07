'use strict';

const dynograte = require('../');

module.exports = {
  'create-migration': (args) => {
    return dynograte.createMigrationFile(args.path, args.migration);
  }
};
