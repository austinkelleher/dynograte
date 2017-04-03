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
- Migrating DynamoDB tables from functions
- Command line tool for auto-generating migration files
- Reminds you of a dinosaur

## How it works

Dynograte creates a DynamoDB table with a name that you specify. This table is
used to track migration files that have already been run. Dynograte will only
run migration files that do not exist in the migrations table.

## Examples

Dynograte can load migrations from a directory

```javascript
const path = require('path');
const dynamodb = new aws.DynamoDB(config.dynamodb);

let migrationDir = path.resolve(__dirname, './dynamodb-migrations');

return dynograte.migrate({
  dynamodb: dynamodb,
  migrationTableName: 'my-awesome-migration-table',
  migrationDir: migrationDir
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

## Migration Retry

Dynograte supports migration retries. Retrying a migration is usefuly for safe
operations that fail and should be tried multiple times.

> **NOTE**: Retrying a DynamoDB migration can be very dangerous. Use this feature
> with caution. You should only retry migrations like creating a table.
> Retrying a migration that alters a table could cause a partial table alter
> that can be difficult to recover from. We recommend backing up your tables!

Dynograte uses the [tri](https://github.com/austinkelleher/tri) module for
retries. You can either export `true` and use the Dynograte default retry
options, or specify your own:

```js
// My awesome migration that should retry
exports.retry = true;

exports.up = function(dynograte) {
  ...
};
```

```js
// My awesome migration that should retry
exports.retry = {
  maxAttempts: 3,
  delay: 100,
  factor: 2,
  jitter: true
};

exports.up = function(dynograte) {
  ...
};
```

Often times, when a database migration is part of the process startup-tasks,
the process may be killed if a migration completely fails to run. The process
may restart and we may want to retry it again when it comes back online.
If your migration fails, Dynograte remembers that the migration has failed
and stores that information in the migration table in DynamoDB.

Dynograte allows you to export `runAfterFail` that will run a failed migration
again the next time `dynograte.migrate(...)` is called:

```js
// My awesome migration that should retry
exports.retryAfterFail = true;

exports.up = function(dynograte) {
  ...
};
```

## CLI

Dynograte comes packaged with a CLI, which will auto-generate migration files.
Migration files are prefixed with the current `Date` in YY-MM-DD-HH-MM-SS format
followed by a migration name of your choosing.

```bash
dynograte create --dir ~/Proj/dynomodb-migrations --migration update-users-table
```

The `create` command will generate a file in `~/Proj/dynomodb-migrations` that has
a file name similar to `2016-09-07-10-48-28_update-users-table.js.js` and looks like:

```javascript
'use strict';

exports.up = (dynamodb) => {

};

```

## Tests

To run the tests, you can either run docker, or specify your own DynamoDB
configuration in `config.js`.

Run Docker and tests:

```bash
npm run docker-test
```

Run tests without Docker:

```bash
npm test
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
