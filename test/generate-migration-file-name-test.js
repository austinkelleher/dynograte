/*jshint -W030 */
'use strict';

const chai = require('chai');
const generateMigrationFileName = require('../lib/util/generateMigrationFileName');
const expect = require('chai').expect;

require('chai').should();
chai.config.includeStack = true;

function convertDate(date) {
  return new Date(date.replace(
    /^(\d{4})(\d\d)(\d\d)(\d\d)(\d\d)(\d\d)$/,
    '$4:$5:$6 $2/$3/$1'
  ));
}

describe('Generate migration file name test', function() {
  it('should generate migration file name with date', () => {
    let migrationName = 'test-migration';

    let migrationFileName = generateMigrationFileName('/Project/test', migrationName);
    let date = convertDate(migrationFileName.substring(
        migrationFileName.lastIndexOf('/') + 1,
        migrationFileName.lastIndexOf('_')));

    expect(date instanceof Date).to.equal(true);
    expect(migrationFileName.startsWith('/Project/test')).to.equal(true);
    expect(migrationFileName.substr(migrationFileName.length - (migrationName.length + 3))).to.equal('test-migration.js');
  });
});
