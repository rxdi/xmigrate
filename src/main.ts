import { Bootstrap } from '@rxdi/core';

import { AppModule } from './app.module';

Bootstrap(AppModule).subscribe(() => {
  console.log('');
}, console.error.bind(console));
