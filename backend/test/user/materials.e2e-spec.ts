import { Test, TestingModule } from '@nestjs/testing';
import { MaterialsService } from '../../src/visual-flow/services/materials.service';

describe('MaterialsService (unit)', () => {
  let service: MaterialsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MaterialsService],
    }).compile();

    service = module.get<MaterialsService>(MaterialsService);
  });

  describe('listMaterials', () => {
    it('should return 13 built-in materials', () => {
      const materials = service.listMaterials();
      expect(materials.length).toBe(13);
    });

    it('should include "realistic" material', () => {
      const materials = service.listMaterials();
      const realistic = materials.find((m) => m.id === 'realistic');
      expect(realistic).toBeDefined();
      expect(realistic?.name).toBe('Photorealistic');
    });

    it('should include "anime" material', () => {
      const materials = service.listMaterials();
      const anime = materials.find((m) => m.id === 'anime');
      expect(anime).toBeDefined();
    });
  });

  describe('getMaterial', () => {
    it('should return material by ID', () => {
      const material = service.getMaterial('3d_pixar');
      expect(material).toBeDefined();
      expect(material?.id).toBe('3d_pixar');
    });

    it('should return undefined for unknown ID', () => {
      const material = service.getMaterial('nonexistent');
      expect(material).toBeUndefined();
    });
  });

  describe('registerMaterial / unregisterMaterial', () => {
    it('should register and retrieve custom material', () => {
      service.registerMaterial({
        id: 'test-custom',
        name: 'Test Custom',
        styleInstruction: 'in a test style',
        negativePrompt: 'bad quality',
        scenePrefix: 'test prefix',
        lighting: 'test lighting',
      });

      const material = service.getMaterial('test-custom');
      expect(material).toBeDefined();
      expect(material?.name).toBe('Test Custom');
      expect(material?.isBuiltin).toBe(false);

      // Cleanup
      service.unregisterMaterial('test-custom');
      expect(service.getMaterial('test-custom')).toBeUndefined();
    });

    it('should throw when trying to remove built-in materials', () => {
      expect(() => service.unregisterMaterial('realistic')).toThrow();
    });
  });

  describe('applyToPrompt', () => {
    it('should prepend material prompt to base prompt', () => {
      const result = service.applyToPrompt('3d_pixar', 'A cat sitting');
      expect(result).toContain('A cat sitting');
      expect(result.length).toBeGreaterThan('A cat sitting'.length);
    });

    it('should return original prompt for unknown material', () => {
      const result = service.applyToPrompt('nonexistent', 'A cat sitting');
      expect(result).toBe('A cat sitting');
    });
  });
});
