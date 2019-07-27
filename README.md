
# @rxdi/xmigrate 
[![Build Status](https://travis-ci.org/rxdi/xmigrate.svg?branch=master)](https://travis-ci.org/rxdi/xmigrate)

Migration library for `Mongodb` and `Mongoose` written in `typescript`

## Features

* Simple UI/UX
* Rollback support
* Templates for migrations
* Typescript/Javascript compatible
* `async`/`await` configuration loader
* Mongoose and Mongodb compatability
* ACID Transactions provided by MongoDB
* `error` and `success` logs for `up`/`down` migrations 
* Infinite Error log with `append` nodejs streaming technique
* 100% Typescript support with JIT Compilation provided by [@gapi/cli](https://github.com/Stradivario/gapi-cli) and [ParcelJS](https://parceljs.org)

## Installation

```bash
npm i -g @rxdi/xmigrate
```

## Configuration

Automatic configuration

```bash
xmigrate init
```

Manual configuration

You can define `xmigrate.js` file where you execute command `xmigrate`

```typescript
module.exports = async () => {
  return {
    changelogCollectionName: 'migrations',
    migrationsDir: 'migrations',
    defaultTemplate: 'es6',
    typescript: true,
    outDir: './dist',
    logger: {
      folder: './migrations-log',
      up: {
        success: 'up.success.log',
        error: 'up.error.log'
      },
      down: {
        success: 'down.success.log',
        error: 'down.error.log'
      }
    },
    mongodb: {
      url: `mongodb://localhost:27017`,
      databaseName: 'test',
      options: {
        useNewUrlParser: true
      }
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

Will execute all migrations which are with status `PENDING`

```bash
xmigrate up
```

#### Up migrations with rollback down to current errored migration

```bash
xmigrate up --rollback
```

#### Down migrations

Will execute migrations one by one starting from the last created by tamstamp

```bash
xmigrate down
```

#### Status of migrations

```bash
xmigrate status
```

Will print inside the console a `table`
When there is a `PENDING` flag these migrations where not runned against current database.

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

🔥  There are 3 migration with status 'PENDING' run 'xmigrate up' command!
```

## Migration templates

`Native` mongo driver template

```typescript
module.exports = {
  async up (client) {
    await client
      .db()
      .collection('albums')
      .updateOne({ artist: 'The Beatles' }, { $set: { blacklisted: true } })
    await client
      .collection('albums')
      .updateOne({ artist: 'The Doors' }, { $set: { stars: 5 } })
  },

  async down (client) {
    await client
      .db()
      .collection('albums')
      .updateOne({ artist: 'The Doors' }, { $set: { stars: 0 } })
    await client
      .collection('albums')
      .updateOne({ artist: 'The Beatles' }, { $set: { blacklisted: false } })
  }
}
```


`ES5` template

```typescript

module.exports = {
  async up (client) {
    return ['UP']
  },

  async down (client) {
    return ['DOWN']
  }
}
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
  await client.db()
    .collection('albums')
    .updateOne({ artist: 'The Beatles' }, { $set: { blacklisted: true } });

  await client.db()
    .collection('albums')
    .updateOne({ artist: 'The Doors' }, { $set: { stars: 5 } });
}

export async function down(client: MongoClient) {
  await client.db()
    .collection('albums')
    .updateOne({ artist: 'The Doors' }, { $set: { stars: 0 } });

  await client.db()
    .collection('albums')
    .updateOne({ artist: 'The Beatles' }, { $set: { blacklisted: false } });
}
```

## Typescript migrations

To be able to run Migrations with typescript you need to set `typescript: true` inside `xmigrate.js` and install `@gapi/cli` globally

Install `@gapi/cli` for runtime build using `glob`

```bash
npm i -g @gapi/cli
```

Command that will be runned internally
```bash
npx gapi build --glob ./1-migration.ts,./2-migration.ts
```
After success transpiled migration will be started from `./dist/1-migration.js`
Before exit script will remove `artifacts` left from transpilation located inside `./dist` folder

## Rallback

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
      

🙏  Status: Executing rallback operation xmigrate down
📁  Migration: /migrations/20190725160011-pesho.js
        

🚀  Rallback operation success, nothing changed if written correctly!
```


## Logs

By default logs will append streaming content for every interaction made by migration

Down Migration Success Log

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


Down Migration Error log
```json
🔥 ********* Thu Jul 25 2019 03:28:48 GMT+0300 (Eastern European Summer Time) ********* 

{
  "downgraded": [],
  "errorMessage": "AAA",
  "fileName": "20190724235527-pesho.js"
}
```


Up Migration Success log

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

Up Migration Error log

```json
🔥 ********* Thu Jul 25 2019 03:39:00 GMT+0300 (Eastern European Summer Time) ********* 

{
  "migrated": [],
  "errorMessage": "AAA",
  "fileName": "20190724235545-pesho.js"
}
```