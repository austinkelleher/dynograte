'use strict';

const dynograte = require('../');

module.exports = {
  'create': (args) => {
    return dynograte.createMigrationFile(args.dir, args.migration);
  }
};
