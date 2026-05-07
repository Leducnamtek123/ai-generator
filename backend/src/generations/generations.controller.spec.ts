import { GenerationsController } from './generations.controller';
import { GenerationsService } from './generations.service';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';

describe('GenerationsController', () => {
  const user = {
    id: 42,
    email: 'user@example.com',
    role: null,
  } as AuthenticatedUser;

  const service = {
    findAll: jest.fn(),
    listProviders: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    generateImage: jest.fn(),
    generateVideo: jest.fn(),
    upscaleImage: jest.fn(),
    enhancePrompt: jest.fn(),
    generateAudio: jest.fn(),
    processVideo: jest.fn(),
    processImage: jest.fn(),
    handleCallback: jest.fn(),
  } as unknown as jest.Mocked<GenerationsService>;

  const controller = new GenerationsController(service);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should list only the authenticated user generations', () => {
    service.findAll.mockResolvedValue({
      data: [],
      total: 0,
      page: 2,
      limit: 25,
      hasNextPage: false,
    });

    const result = controller.findAll(user, '2', '25', 'image', 'sunset');

    expect(service.findAll).toHaveBeenCalledWith('42', {
      page: 2,
      limit: 25,
      type: 'image',
      search: 'sunset',
    });
    return expect(result).resolves.toEqual({
      data: [],
      total: 0,
      page: 2,
      limit: 25,
      hasNextPage: false,
    });
  });

  it('should fetch a generation for the authenticated user only', () => {
    service.findOne.mockResolvedValue({ id: 'gen-1' } as never);

    const result = controller.findOne('gen-1', user);

    expect(service.findOne).toHaveBeenCalledWith('gen-1', '42');
    return expect(result).resolves.toEqual({ id: 'gen-1' });
  });

  it('should delete a generation for the authenticated user only', () => {
    service.remove.mockResolvedValue(true);

    const result = controller.remove('gen-1', user);

    expect(service.remove).toHaveBeenCalledWith('gen-1', '42');
    return expect(result).resolves.toBe(true);
  });

  it('should create image generations for the authenticated user only', () => {
    service.generateImage.mockResolvedValue({ id: 'gen-1' } as never);

    const result = controller.generateImage({ prompt: 'hello' } as never, user);

    expect(service.generateImage).toHaveBeenCalledWith(
      { prompt: 'hello' },
      '42',
    );
    return expect(result).resolves.toEqual({ id: 'gen-1' });
  });

  it('should enhance prompts for the authenticated user only', () => {
    service.enhancePrompt.mockResolvedValue('better prompt');

    const result = controller.enhancePrompt({ prompt: 'hello' } as never, user);

    expect(service.enhancePrompt).toHaveBeenCalledWith(
      { prompt: 'hello' },
      '42',
    );
    return expect(result).resolves.toEqual({
      enhancedPrompt: 'better prompt',
    });
  });
});
