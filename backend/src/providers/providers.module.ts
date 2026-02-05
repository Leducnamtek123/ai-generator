import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ProviderRegistry } from './provider.registry';
import { N8nAdapter } from './adapters/n8n.adapter';
import { LeonardoAdapter } from './adapters/leonardo.adapter';
import { OpenAIAdapter } from './adapters/openai.adapter';

@Module({
    imports: [HttpModule],
    providers: [
        ProviderRegistry,
        N8nAdapter,
        LeonardoAdapter,
        OpenAIAdapter,
    ],
    exports: [ProviderRegistry],
})
export class ProvidersModule { }
