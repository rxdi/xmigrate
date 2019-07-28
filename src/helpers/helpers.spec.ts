import { nextOrDefault, includes } from './args-extractors';

describe('Helpers', () => {
  it('Should set "es6" template when argument --template es6 present', async () => {
    expect(nextOrDefault('--template', 'typescript')).toBe('typescript');
    process.argv.push('--template');
    process.argv.push('es6');
    expect(nextOrDefault('--template', 'typescript')).toBe('es6');
    process.argv.pop();
    process.argv.pop();
  });

  it('Should set default template when no value present', async () => {
    expect(nextOrDefault('--template', 'typescript')).toBe('typescript');
  });

  it('Should set default property to be trutty with fallback', async () => {
    process.argv.push('--template');
    process.argv.push('yes');
    expect(
      nextOrDefault('--template', 'typescript', v =>
        v === 'yes' ? 'Oh yeah' : 'Noo'
      )
    ).toBe('Oh yeah');
    process.argv.pop();
    process.argv.pop();
  });

  it('Should set default property to be trutty with fallback', async () => {
    process.argv.push('--template');
    process.argv.push('no');
    expect(
      nextOrDefault('--template' as any, 'typescript', v =>
        v === 'yes' ? 'Oh yeah' : 'Noo'
      )
    ).toBe('Noo');
    process.argv.pop();
    process.argv.pop();
  });

  it('Adding "up" argument should equal to true', () => {
    process.argv.push('up');
    expect(includes('up')).toBeTruthy();
    process.argv.pop();
  });

  it('Adding "up" argument should equal to true', () => {
    process.argv.push('down');
    expect(includes('down')).toBeTruthy();
    process.argv.pop();
  });

  it('Includes extractor method tests', () => {
    process.argv.push('up');
    expect(includes('up')).toBeTruthy();
    process.argv.pop();
  });
});
