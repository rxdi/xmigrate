- v0.7.51

* Added `dateTimeFormat` method inside configuration and can be used to generate custom timestamp for files

```ts
export default async () => {
  return {
    defaultTemplate: 'typescript',
    outDir: './.xmigrate',
    typescript: true,
    dateTimeFormat: () => new Date().toISOString(),
  };
};
```

On every `xmigrate create my-migration` will trigger dateTimeFormat predefined function

- v0.7.39

* Fixed [issue](https://github.com/rxdi/xmigrate/issues/8) related with wrong format name when creating migration

- v0.7.38

* Fixed [issue](https://github.com/rxdi/xmigrate/issues/7) with new date format `Use `yyyy`instead of`YYYY` for formatting years; see: https://git.io/fxCyr`

- v0.7.16

* Fixed bug with `npm ERR! enoent ENOENT: no such file or directory,`

- v0.7.13

* Full typescript support! Files are Transpiled using ParcelJS insternally inside `@gapi/cli`
* 500 Migrations run with Typescript > Javascript > Execution in 13 seconds!
* Users can now choose `typescript` outFolder with config `outDir` defaults to `./dist`
* Connections for `mongoose` and `mongodb` can be closed forcefully
* Tests for specific scenarios added
* Modified `createWithTemplate` method inside `MigrationService` to return value with `/` instead of empty line since it was breaking consistency
* Introduced inside tests(For now) custom template providing string example: `xmigrate create mytemplate --typescript true --raw true --template 'oh my god i have a template'` later in version v0.7.14 will have this capabilities
* ES6 Configuration file can be loaded with `export default async function() {}` syntax
* Typescript Configuration file can be loaded `xmigrate.ts`
* `.xmigrate` temp folder is removed when command execution finish
* Added simple documentation for API usage

- v0.7.8

* Changed `db` to `client` since we are appending `MongoClient` instead of database
* Supports for ACID transactions
* Modified templates to fit new scenario

- v0.7.7

* Added `typescript` support on Rollbacked migration
* Added `es6` and `es5` modules. Removed `basic` template naming
* Fallback changed to Rollback `xmigrate up --rollback` instead of `xmigrate up --fallback`
* `ESM` module installed so we can transpile modules and use ES6 syntax
* Ensure directories is moved when we apply config instead of passing `DEFAULT_CONFIG`
* Templates are re-aranged to fit new `ES6` syntax
* Database connection passed to down migration when executing `xmigrate up --rollback`

- v0.7.6

* Added `typescript` support
* Added `init` script helping us to setup project which doesn't have configuration
* Removed Error message `DeprecationWarning: current URL string parser is deprecated` from `Mongoose.connect`

- v0.7.5

* Init commit
