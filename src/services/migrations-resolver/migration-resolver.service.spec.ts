import { Container, createTestBed } from '@rxdi/core';
import { join } from 'path';

import { MigrationsResolver } from './migrations-resolver.service';

describe('Migration resolver service', () => {
  let resolver: MigrationsResolver;
  beforeAll(async () => {
    await createTestBed({
      providers: [MigrationsResolver],
    });
    resolver = Container.get(MigrationsResolver);
  });

  it('Should return only js files from getDistFileNames', async () => {
    const spy = spyOn(resolver, 'readDir').and.callFake(() => [
      'my-filename.js',
    ]);
    const fileNames = await resolver.getDistFileNames();
    expect(fileNames.length).toBe(1);
    expect(fileNames[0]).toBe(join(process.cwd(), '.xmigrate/my-filename.js'));
    expect(spy).toHaveBeenCalled();
  });
});
