import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync, ValidationError } from 'class-validator';
import { ClassConstructor } from 'class-transformer/types/interfaces';

function collectErrorMessages(
  errors: ValidationError[],
  parentPath = '',
): string[] {
  return errors.flatMap((error) => {
    const path = parentPath
      ? `${parentPath}.${error.property}`
      : error.property;
    const constraintMessages = Object.values(error.constraints ?? {}).map(
      (message) => `${path}: ${message}`,
    );
    const childMessages = collectErrorMessages(error.children ?? [], path);

    return [...constraintMessages, ...childMessages];
  });
}

function validateConfig<T extends object>(
  config: Record<string, unknown>,
  envVariablesClass: ClassConstructor<T>,
) {
  const validatedConfig = plainToInstance(envVariablesClass, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
    forbidUnknownValues: true,
    validationError: {
      target: false,
      value: false,
    },
  });

  if (errors.length > 0) {
    throw new Error(collectErrorMessages(errors).join('; '));
  }
  return validatedConfig;
}

export default validateConfig;
