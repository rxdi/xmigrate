import { Bootstrap } from '@rxdi/core';

import { AppModule } from './app.module';

Bootstrap(AppModule).subscribe({
  complete: () => console.log(''),
  error: (e: Error) => console.error(e),
});
