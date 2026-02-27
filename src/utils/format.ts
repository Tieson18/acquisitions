interface ValidationError {
  issues?: ReadonlyArray<{ message: string }>;
}

export const formatValidationError = (errors: ValidationError): string => {
  if (!errors?.issues?.length) return 'Validation failed';
  return errors.issues.map((i) => i.message).join(', ');
};
