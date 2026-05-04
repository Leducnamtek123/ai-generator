import { Test, TestingModule } from '@nestjs/testing';
import { PromptBuilderService } from '../../src/visual-flow/services/prompt-builder.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { VisualCharacterEntity } from '../../src/visual-flow/entities/visual-character.entity';

describe('PromptBuilderService (unit)', () => {
  let service: PromptBuilderService;
  const mockCharacterRepo = {
    find: jest.fn().mockResolvedValue([]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PromptBuilderService,
        {
          provide: getRepositoryToken(VisualCharacterEntity),
          useValue: mockCharacterRepo,
        },
      ],
    }).compile();

    service = module.get<PromptBuilderService>(PromptBuilderService);
  });

  describe('buildContinuationPrompt', () => {
    it('should prepend transformation context', () => {
      const result = service.buildContinuationPrompt('A hero stands tall');
      expect(result).toContain('Transform this image');
      expect(result).toContain('A hero stands tall');
    });
  });

  describe('buildVideoPrompt', () => {
    it('should add negative prompt by default', async () => {
      const result = await service.buildVideoPrompt('A cat walking');
      expect(result).toContain('Negative:');
      expect(result).toContain('subtitles');
      expect(result).toContain('watermark');
    });

    it('should add ambient-only audio when music not allowed', async () => {
      const result = await service.buildVideoPrompt('A cat walking', {
        allowMusic: false,
      });
      expect(result).toContain('Audio:');
      expect(result).toContain('no background music');
    });

    it('should NOT add audio label when music is allowed', async () => {
      const result = await service.buildVideoPrompt('A cat walking', {
        allowMusic: true,
      });
      expect(result).not.toContain('no background music');
    });

    it('should skip negative if already present', async () => {
      const result = await service.buildVideoPrompt(
        'A cat. Negative: ugly faces.',
      );
      // Should not duplicate negative
      const negativeCount = (result.match(/Negative:/g) || []).length;
      expect(negativeCount).toBe(1);
    });

    it('should skip audio label if already present', async () => {
      const result = await service.buildVideoPrompt(
        'A cat. Audio: dramatic music.',
      );
      const audioCount = (result.match(/Audio:/g) || []).length;
      expect(audioCount).toBe(1);
    });

    it('should detect dialogue and fetch character voices', async () => {
      mockCharacterRepo.find.mockResolvedValueOnce([
        { name: 'Luna', voiceDescription: 'soft, feminine voice' },
        { name: 'Max', voiceDescription: 'deep, rough voice' },
      ]);

      const result = await service.buildVideoPrompt(
        'Luna says hello to Max',
        {
          projectId: 'test-proj',
          characterNames: ['Luna', 'Max'],
          allowVoice: true,
        },
      );

      expect(result).toContain('Character voices:');
      expect(result).toContain('Luna: soft, feminine voice');
      expect(result).toContain('Max: deep, rough voice');
    });

    it('should NOT add voice context for non-dialogue prompts', async () => {
      mockCharacterRepo.find.mockClear();
      mockCharacterRepo.find.mockResolvedValueOnce([
        { name: 'Luna', voiceDescription: 'soft voice' },
      ]);

      const result = await service.buildVideoPrompt(
        'A beautiful sunset over the ocean',
        {
          projectId: 'test-proj',
          characterNames: ['Luna'],
        },
      );

      // No dialogue verbs → no "Character voices:" section even if chars exist
      expect(result).not.toContain('Character voices:');
    });
  });

  describe('enrichScenePrompts', () => {
    it('should process multiple scenes', async () => {
      const scenes = [
        { id: 's1', prompt: 'Scene one', chainType: 'ROOT' },
        { id: 's2', prompt: 'Scene two', chainType: 'CONTINUATION' },
      ];

      const results = await service.enrichScenePrompts(scenes);
      expect(results).toHaveLength(2);
      expect(results[0].sceneId).toBe('s1');
      expect(results[1].sceneId).toBe('s2');
    });

    it('should apply continuation transform for CONTINUATION scenes', async () => {
      const scenes = [
        { id: 's1', prompt: 'A hero arrives', chainType: 'CONTINUATION' },
      ];

      const results = await service.enrichScenePrompts(scenes);
      expect(results[0].imagePrompt).toContain('Transform this image');
    });

    it('should NOT apply continuation for ROOT scenes', async () => {
      const scenes = [
        { id: 's1', prompt: 'A hero arrives', chainType: 'ROOT' },
      ];

      const results = await service.enrichScenePrompts(scenes);
      expect(results[0].imagePrompt).not.toContain('Transform this image');
      expect(results[0].imagePrompt).toBe('A hero arrives');
    });
  });
});
