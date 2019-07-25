import { ReturnType } from '../injection.tokens';

export class ErrorMap extends Error implements ReturnType {
  fileName: string;
  downgraded: ReturnType[];
  appliedAt: string | Date;
  result: unknown;
  migrated: ReturnType[];
}
