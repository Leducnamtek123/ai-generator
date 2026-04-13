import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ProviderRegistry } from './provider.registry';
import { ReplicateAdapter } from './adapters/replicate.adapter';
import { StabilityAdapter } from './adapters/stability.adapter';
import { OpenAIAdapter } from './adapters/openai.adapter';
import { LeonardoAdapter } from './adapters/leonardo.adapter';
import { RunwayAdapter } from './adapters/runway.adapter';
import { ElevenLabsAdapter } from './adapters/elevenlabs.adapter';
import { FalAdapter } from './adapters/fal.adapter';

@Module({
  imports: [
    HttpModule.register({
      timeout: 300000, // 5 min default timeout for AI APIs
      maxRedirects: 5,
    }),
  ],
  providers: [
    ProviderRegistry,
    ReplicateAdapter,
    StabilityAdapter,
    OpenAIAdapter,
    LeonardoAdapter,
    RunwayAdapter,
    ElevenLabsAdapter,
    FalAdapter,
  ],
  exports: [ProviderRegistry],
})
export class ProvidersModule {}
