import es5 from './es5';
import es6 from './es6';
import migration from './migration';
import native from './native';
import typescript from './typescript';

export { es6, es5, native, typescript, migration };
export type TemplateTypes =
  | 'es5'
  | 'es6'
  | 'native'
  | 'typescript'
  | 'migration';
