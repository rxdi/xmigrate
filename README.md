
# @rxdi/xmigrate 

Migration library for `Mongodb` and `Mongoose` written in `typescript`

* Rollback support
* Typescript/Javascript compatible
* Simple UI/UX
* Templates for migrations
* Mongoose and Mongodb compatability
* Infinite Error log with Append streaming technique
* `async`/`await` configuration loader

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
    defaultTemplate: 'basic',
    typescript: true,
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

Templates to choose: `basic`, `native`, `typescript`. By default `xmigrate create "my-migration"` executes `basic` template

```bash
xmigrate create "my-migration" --template (basic|native|typescript)
```

```bash
xmigrate create "my-migration" --template typescript
```

#### Up migrations

Will execute all migrations which are with status `PENDING`

```bash
xmigrate up
```

#### Up migrations with fallback down to current errored migration

```bash
xmigrate up --fallback
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

Native mongo driver template

```typescript
module.exports = {
  async up (db) {
    await db
      .collection('albums')
      .updateOne({ artist: 'The Beatles' }, { $set: { blacklisted: true } })
    await db
      .collection('albums')
      .updateOne({ artist: 'The Doors' }, { $set: { stars: 5 } })
  },

  async down (db) {
    await db
      .collection('albums')
      .updateOne({ artist: 'The Doors' }, { $set: { stars: 0 } })
    await db
      .collection('albums')
      .updateOne({ artist: 'The Beatles' }, { $set: { blacklisted: false } })
  }
}
```


Mongoose driver template

```typescript

module.exports = {
  async up () {
    return ['UP']
  },

  async down () {
    return ['DOWN']
  }
}
```

Typescript template

(Optional) type definitions for `mongodb`

```bash
npm install @types/mongodb -D
```

```typescript
import { Db } from 'mongodb';

export = {
  async up(db: Db) {
    await db
      .collection('albums')
      .updateOne({ artist: 'The Beatles' }, { $set: { blacklisted: true } });
    await db
      .collection('albums')
      .updateOne({ artist: 'The Doors' }, { $set: { stars: 5 } });
  },

  async down(db: Db) {
    await db
      .collection('albums')
      .updateOne({ artist: 'The Doors' }, { $set: { stars: 0 } });
    await db
      .collection('albums')
      .updateOne({ artist: 'The Beatles' }, { $set: { blacklisted: false } });
  }
};
```

## Typescript migrations

To be able to run Migrations with typescript you need to set `typescript: true` inside `xmigrate.js`

This will run command internally when there is a `.ts` files inside the migrations directory:

```bash
npx gapi build --path=./your-migrations-dir/3414213131231312-migration.ts
```

After success build it will start `.js` transpiled file from `./dist/3414213131231312-migration.js`

## Fallback

When executing command `xmigrate up --falback` this will trigger immediate fallback to DOWN migration on the current crashed migration
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
      

🙏  Status: Executing fallback operation xmigrate down
📁  Migration: /migrations/20190725160011-pesho.js
        

🚀  Fallback operation success, nothing changed if written correctly!
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