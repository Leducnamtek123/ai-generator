import { IsInt, IsString, Min } from 'class-validator';
import validateConfig from './validate-config';

class ExampleConfig {
  @IsString()
  name: string;

  @IsInt()
  @Min(1)
  port: number;
}

describe('validateConfig', () => {
  it('should coerce primitive env values and return the validated instance', () => {
    const config = validateConfig(
      { name: 'ai-generator', port: '3000' },
      ExampleConfig,
    );

    expect(config).toBeInstanceOf(ExampleConfig);
    expect(config).toEqual(
      expect.objectContaining({
        name: 'ai-generator',
        port: 3000,
      }),
    );
  });

  it('should report readable validation errors without leaking raw values', () => {
    expect(() =>
      validateConfig({ name: null, port: '0' }, ExampleConfig),
    ).toThrow(/name: name must be a string/);
    expect(() =>
      validateConfig({ name: null, port: '0' }, ExampleConfig),
    ).toThrow(/port: port must not be less than 1/);
  });
});
