# Dynograte

Dynograte is a Node.js DynamoDB migration tool

## Installation

```bash
npm install dynograte
```

Dynograte also comes packaged with tooling for making your life easier. You
obviously need it. You can install Dynograte globally with:

```bash
npm install dynograte -g
```

## Features

- Migrating DynamoDB tables from a directory
- Migration DynamoDB tables from functions
- Command line tool for auto-generating migration files
- Reminds you of a dinosaur

## How it works

Dynograte creates a DynamoDB table with a name that you specify. This table is
used to track migration files that have already been run. Dynograte will only
run migration files that do not exist in the migrations table.

## Examples

Dynograte can load migrations from a directory

```javascript
const dynamodb = new aws.DynamoDB(config.dynamodb);

return dynograte.migrate({
  dynamodb: dynamodb,
  migrationTableName: 'my-awesome-migration-table',
  migrationPath: './dynamodb-migrations'
});

```

Dynograte can handle migrations as functions

```javascript

return dynograte.migrate({
  dynamodb: dynamodb,
  migrationTableName: randomTableName
}, [
  (dynamodb) => {
    return theBestMigration(dynamodb);
  },
  (dynamodb) => {
    return Promise.resolve();
  }
]);

```

Or a single migration function

```javascript

return dynograte.migrate({
  dynamodb: dynamodb,
  migrationTableName: randomTableName
}, (dynamodb) => {
  return theBestMigration(dynamodb);
});

```

## CLI

Dynograte comes packaged with a CLI, which will auto-generate migration files.
Migration files are prefixed with the current `Date` in YYMMDDHHMMSS format
followed by a migration name of your choosing.

```bash
dynograte create-migration --path ./dynomodb-migrations --migration update-users-table
```

The `create-migration` command will generate a file in `./dynomodb-migrations` that has
a file name similar to `20160906172136_update-users-table.js` and looks like:

```javascript
'use strict';

exports.up = (dynamodb) => {

};

```

## Tests

To run the tests, you can either run docker, or specify your own DynamoDB
configuration in `config.js`.

```bash
./start-docker && npm test
```

`start-docker.sh` generates a `config.js` file that contains the DynamoDB
configuration. You can also manually create it to include your own custom config:

```javascript
'use strict';

const aws = require('aws-sdk');

module.exports = {
  dynamodb: {
    region: 'us-east-1',
    endpoint: new aws.Endpoint('http://localhost:32795')
  }
};

```
