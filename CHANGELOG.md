* v0.7.7
- Added `typescript` support on Rollbacked migration
- Added `es6` and `es5` modules. Removed `basic` template naming
- Fallback changed to Rollback `xmigrate up --rollback` instead of `xmigrate up --fallback`
- `ESM` module installed so we can transpile modules and use ES6 syntax
- Ensure directories is moved when we apply config instead of passing `DEFAULT_CONFIG`
- Templates are re-aranged to fit new `ES6` syntax
- Database connection passed to down migration when executing `xmigrate up --rollback`

* v0.7.6
- Added `typescript` support
- Added `init` script helping us to setup project which doesn't have configuration
- Removed Error message `DeprecationWarning: current URL string parser is deprecated` from `Mongoose.connect`

* v0.7.5
- Init commit