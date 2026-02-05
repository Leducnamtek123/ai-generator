import { Test, TestingModule } from '@nestjs/testing';
import { TemplatesService } from './templates.service';
import { TemplateRepository } from './infrastructure/persistence/relational/template.repository';

describe('TemplatesService', () => {
  let service: TemplatesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TemplatesService,
        {
          provide: TemplateRepository,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<TemplatesService>(TemplatesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
