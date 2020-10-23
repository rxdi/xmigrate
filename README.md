# @rxdi/xmigrate

[![Build Status](https://travis-ci.org/rxdi/xmigrate.svg?branch=master)](https://travis-ci.org/rxdi/xmigrate)
[![Coverage Status](https://coveralls.io/repos/github/rxdi/xmigrate/badge.svg?branch=master)](https://coveralls.io/github/rxdi/xmigrate?branch=master)

Migration library for `Mongodb` and `Mongoose` written in `TypeScript`

## Features

- Simple UI/UX
- Rollback support
- Templates for migrations
- TypeScript/JavaScript compatible
- `async`/`await` configuration loader
- Mongoose and Mongodb compatibility
- ACID transactions provided by MongoDB
- `error` and `success` logs for `up`/`down` migrations
- Infinite rrror log with `append` NodeJS streaming technique
- 100% TypeScript support with JIT compilation provided by [@gapi/cli](https://github.com/Stradivario/gapi-cli) and [ParcelJS](https://parceljs.org)

## Installation

Using `binary`

```bash
wget https://github.com/rxdi/xmigrate/raw/master/dist/xmigrate-linux
```

Give it permission to execute

```bash
chmod +x xmigrate-linux
```

```bash
./xmigrate up|down|create|etc
```

Using `NodeJS`

```bash
npm i -g @rxdi/xmigrate
```

## Configuration

Automatic configuration

```bash
xmigrate init
```

Manual configuration

You can create a `xmigrate.js` file where you execute the `xmigrate` command:

```typescript
export default async () => {
  return {
    changelogCollectionName: 'migrations',
    migrationsDir: './migrations',
    defaultTemplate: 'es6',
    typescript: true,
    outDir: './.xmigrate',
    /* Custom datetime formatting can be applied like so */
    // dateTimeFormat: () => new Date().toISOString(),
    logger: {
      folder: './migrations-log',
      up: {
        success: 'up.success.log',
        error: 'up.error.log',
      },
      down: {
        success: 'down.success.log',
        error: 'down.error.log',
      },
    },
    mongodb: {
      url: `mongodb://localhost:27017`,
      databaseName: 'test',
      options: {
        useNewUrlParser: true,
      },
    },
  };
};
```

## Commands

#### First time run

```bash
xmigrate init
```

#### Creating migration

```bash
xmigrate create "my-migration"
```

#### Creating migration with template.

Templates to choose: `es5`, `es6`, `native`, `typescript`. By default `xmigrate create "my-migration"` executes with `es6` template

```bash
xmigrate create "my-migration" --template (es5|es6|native|typescript)
```

```bash
xmigrate create "my-migration" --template typescript
```

#### Up migrations

Will execute all migrations which have the status `PENDING`

```bash
xmigrate up
```

#### Up migrations with rollback down to current errored migration

```bash
xmigrate up --rollback
```

#### Down migrations

Will execute migrations one by one starting from the last created by timestamp

```bash
xmigrate down
```

#### Status of migrations

```bash
xmigrate status
```

Will print inside the console a table.
When there is a `PENDING` flag these migrations were not running against the current database.

```bash
🖥️  Database: test

💿  DBCollection: migrations

🗄️  LoggerDir: ./migrations-log

📁  MigrationsDir: migrations

👷  Script: xmigrate status

┌─────────┬───────────────────────────┬────────────────────────────┐
│ (index) │         fileName          │         appliedAt          │
├─────────┼───────────────────────────┼────────────────────────────┤
│    0    │ '20190725160010-pesho.js' │ '2019-07-25T16:07:27.012Z' │
│    1    │ '20190725160011-pesho.js' │         'PENDING'          │
│    2    │ '20190725160012-pesho.js' │         'PENDING'          │
│    3    │ '20190725160013-pesho.js' │         'PENDING'          │
└─────────┴───────────────────────────┴────────────────────────────┘

🔥  There are 3 migrations with status 'PENDING', run 'xmigrate up' command!
```

## Migration templates

Native mongo driver template

```typescript
module.exports = {
  async up(client) {
    await client
      .db()
      .collection('albums')
      .updateOne({ artist: 'The Beatles' }, { $set: { blacklisted: true } });
    await client
      .collection('albums')
      .updateOne({ artist: 'The Doors' }, { $set: { stars: 5 } });
  },

  async down(client) {
    await client
      .db()
      .collection('albums')
      .updateOne({ artist: 'The Doors' }, { $set: { stars: 0 } });
    await client
      .collection('albums')
      .updateOne({ artist: 'The Beatles' }, { $set: { blacklisted: false } });
  },
};
```

`ES5` template

```typescript
module.exports = {
  async up(client) {
    return ['UP'];
  },

  async down(client) {
    return ['DOWN'];
  },
};
```

`ES6` template

```typescript
export async function up(client) {
  return ['Up'];
}
export async function down(client) {
  return ['Down'];
}
```

`Typescript` template

(Optional) type definitions for `mongodb` and `mongoose`

```bash
npm install @types/mongodb @types/mongoose -D
```

```typescript
import { MongoClient } from 'mongodb';

export async function up(client: MongoClient) {
  await client
    .db()
    .collection('albums')
    .updateOne({ artist: 'The Beatles' }, { $set: { blacklisted: true } });

  await client
    .db()
    .collection('albums')
    .updateOne({ artist: 'The Doors' }, { $set: { stars: 5 } });
}

export async function down(client: MongoClient) {
  await client
    .db()
    .collection('albums')
    .updateOne({ artist: 'The Doors' }, { $set: { stars: 0 } });

  await client
    .db()
    .collection('albums')
    .updateOne({ artist: 'The Beatles' }, { $set: { blacklisted: false } });
}
```

## TypeScript migrations

To be able to run migrations with TypeScript you need to set `typescript: true` inside `xmigrate.js` and install `@gapi/cli` globally

Install `@gapi/cli` for runtime build using `glob`

```bash
npm i -g @gapi/cli
```

Command that will be run internally

```bash
npx gapi build --glob ./1-migration.ts,./2-migration.ts
```

After success transpiled migration will be started from `./.xmigrate/1-migration.js`
Before exit script will remove `artifacts` left from transpilation located inside `./.xmigrate` folder

## Rollback

When executing command `xmigrate up --rollback` this will trigger immediate rollback to DOWN migration on the current crashed migration
The log will look something like this:

```
🖥️  Database: test

💿  DBCollection: migrations

🗄️  LoggerDir: ./migrations-log

📁  MigrationsDir: migrations

👷  Script: xmigrate up


🔥  Status: Operation executed with error
🧨  Error: {"fileName":"20190725160011-pesho.js","migrated":[]}
📨  Message: AAA


🙏  Status: Executing rollback operation xmigrate down
📁  Migration: /migrations/20190725160011-pesho.js


🚀  Rollback operation success, nothing changed if written correctly!
```

## Logs

By default logs will append streaming content for every interaction made by migration

Down migration success Log

```json
🚀 ********* Thu Jul 25 2019 11:23:06 GMT+0300 (Eastern European Summer Time) *********

{
  "fileName": "20190723165157-example.js",
  "appliedAt": "2019-07-25T08:23:06.668Z",
  "result": [
    {
      "result": "DOWN Executed"
    }
  ]
}
```

Down migration error log

```json
🔥 ********* Thu Jul 25 2019 03:28:48 GMT+0300 (Eastern European Summer Time) *********

{
  "downgraded": [],
  "errorMessage": "AAA",
  "fileName": "20190724235527-pesho.js"
}
```

Up migration success log

```json
🚀 ********* Thu Jul 25 2019 11:23:24 GMT+0300 (Eastern European Summer Time) *********

{
  "fileName": "20190723165157-example.js",
  "appliedAt": "2019-07-25T08:23:24.642Z",
  "result": [
    {
      "result": "UP Executed"
    }
  ]
}
```

Up migration error log

```json
🔥 ********* Thu Jul 25 2019 03:39:00 GMT+0300 (Eastern European Summer Time) *********

{
  "migrated": [],
  "errorMessage": "AAA",
  "fileName": "20190724235545-pesho.js"
}
```

# TypeScript configuration

When you change your configuration file to `xmigrate.ts` it will automatically transpile to `ES5` and will be loaded

This type of configuration requires `@gapi/cli` to be installed since we will transpile configuration with it!

```bash
npm i -g @gapi/cli
```

```typescript
import { Config } from '@rxdi/xmigrate';

export default async (): Promise<Config> => {
  return {
    changelogCollectionName: 'migrations',
    migrationsDir: './migrations',
    defaultTemplate: 'typescript',
    typescript: true,
    outDir: './.xmigrate',
    logger: {
      folder: './migrations-log',
      up: {
        success: 'up.success.log',
        error: 'up.error.log',
      },
      down: {
        success: 'down.success.log',
        error: 'down.error.log',
      },
    },
    mongodb: {
      url: `mongodb://localhost:27017`,
      databaseName: 'test',
      options: {
        useNewUrlParser: true,
      },
    },
  };
};
```

Everytime `xmigrate.ts` is loaded `timestamp` is checked whether or not this file is changed

This information is saved inside `.xmigrate/config.temp` like a regular `Date` object

This will ensure that we don't need to transpile configuration if it is not changed inside `xmigrate.ts` file

Basically this is caching to improve performance and user experience with TypeScript configuration

# API Usage

```typescript
import { Container, setup } from '@rxdi/core';

import {
  MigrationService,
  GenericRunner,
  LogFactory,
  ConfigService,
  LoggerConfig,
  Config,
} from '@rxdi/xmigrate';

const config = {
  changelogCollectionName: 'migrations',
  migrationsDir: './migrations',
  defaultTemplate: 'typescript',
  typescript: true,
  outDir: './.xmigrate',
  logger: {
    folder: './migrations-log',
    up: {
      success: 'up.success.log',
      error: 'up.error.log',
    },
    down: {
      success: 'down.success.log',
      error: 'down.error.log',
    },
  },
  mongodb: {
    url: 'mongodb://localhost:27017',
    databaseName: 'test',
    options: {
      useNewUrlParser: true,
    },
  },
};

setup({
  providers: [
    GenericRunner,
    LogFactory,
    ConfigService,
    {
      provide: Config,
      useValue: config,
    },
    {
      provide: LoggerConfig,
      useValue: config.logger,
    },
  ],
}).subscribe(async () => {
  const template = `
import { MongoClient } from 'mongodb';

export async function up(client: MongoClient) {
  return true
}
export async function down(client: MongoClient) {
  return true
}
`;

  const migrationService = Container.get(MigrationService);

  // Create migration with template
  const filePath = await migrationService.createWithTemplate(
    template as 'typescript',
    'pesho1234',
    { raw: true, typescript: true },
  );
  console.log(filePath);

  // Up migration
  await migrationService.up();
  process.exit(0);

  // Down migration
  await migrationService.down();
  process.exit(0);

  // Status
  await migrationService.status();

  process.exit(0);
}, console.error.bind(console));
```

### Minimal configuration

```typescript
export default async () => {
  return {
    defaultTemplate: 'typescript',
    outDir: './.xmigrate',
    typescript: true,
    mongodb: {
      url: 'mongodb://localhost:27017',
      databaseName: 'test',
      options: {
        useNewUrlParser: true,
      },
    },
  };
};
```

### Performance tests

Running 600 `migrations` takes less than 15 seconds in TypeScript compiled right down to Javascript ES5.

Check [this](https://cloudflare-ipfs.com/ipfs/QmRsE9cRLxeVrya3eZUAheMRoxrM1RKn8MQwbczpicpvxK) video inside IPFS network

Link is not working at the moment...
