import { registerAs } from '@nestjs/config';
import { IsString, IsInt, IsOptional, Min, Max } from 'class-validator';
import validateConfig from '../../utils/validate-config';

class RedisConfigValidator {
    @IsString()
    @IsOptional()
    REDIS_HOST?: string;

    @IsInt()
    @Min(1)
    @Max(65535)
    @IsOptional()
    REDIS_PORT?: number;

    @IsString()
    @IsOptional()
    REDIS_PASSWORD?: string;
}

export default registerAs('redis', () => {
    validateConfig(process.env, RedisConfigValidator);

    return {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD || undefined,
    };
});
