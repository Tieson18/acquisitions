import type { ValidationErrorShape } from '#types';

export const formatValidationError = (errors: ValidationErrorShape): string => {
  if (!errors?.issues?.length) return 'Validation failed';
  return errors.issues.map(i => i.message).join(', ');
};
