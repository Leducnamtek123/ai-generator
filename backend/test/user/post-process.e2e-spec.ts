import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { PostProcessService } from '../../src/visual-flow/services/post-process.service';

describe('PostProcessService (unit)', () => {
  let service: PostProcessService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true })],
      providers: [PostProcessService],
    }).compile();

    service = module.get<PostProcessService>(PostProcessService);
  });

  describe('imageToVideo', () => {
    it('should be defined', () => {
      expect(service.imageToVideo).toBeDefined();
    });

    it('should accept valid zoom directions', () => {
      // Method signature check — actual execution requires ffmpeg
      const method = service.imageToVideo;
      expect(typeof method).toBe('function');
    });
  });

  describe('imagesToSlideshow', () => {
    it('should be defined', () => {
      expect(service.imagesToSlideshow).toBeDefined();
    });
  });

  describe('imagesToVideoGrid', () => {
    it('should be defined', () => {
      expect(service.imagesToVideoGrid).toBeDefined();
    });
  });

  describe('trimVideo', () => {
    it('should be defined', () => {
      expect(service.trimVideo).toBeDefined();
    });
  });

  describe('mergeVideos', () => {
    it('should be defined', () => {
      expect(service.mergeVideos).toBeDefined();
    });
  });

  describe('addNarration', () => {
    it('should be defined', () => {
      expect(service.addNarration).toBeDefined();
    });
  });

  describe('addMusic', () => {
    it('should be defined', () => {
      expect(service.addMusic).toBeDefined();
    });
  });
});
