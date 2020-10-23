import { Module } from '@rxdi/core';

import { MigrationsModule } from './migrations.module';

@Module({
  imports: [MigrationsModule.forRoot()],
})
export class AppModule {}
