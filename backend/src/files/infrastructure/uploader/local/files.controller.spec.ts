import { BadRequestException } from '@nestjs/common';
import * as path from 'node:path';
import { FilesLocalController } from './files.controller';
import { FilesLocalService } from './files.service';

describe('FilesLocalController', () => {
  const service = {
    create: jest.fn(),
  } as unknown as jest.Mocked<FilesLocalService>;

  const controller = new FilesLocalController(service);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should pass uploads through to the file service', async () => {
    service.create.mockResolvedValue({
      file: { id: 'file-1', path: '/api/v1/files/example.png' } as never,
    });

    const result = await controller.uploadFile({
      path: 'example.png',
    } as Express.Multer.File);

    expect(service.create).toHaveBeenCalledWith({ path: 'example.png' });
    expect(result).toEqual({
      file: { id: 'file-1', path: '/api/v1/files/example.png' },
    });
  });

  it('should reject path traversal attempts on download', () => {
    const response = {
      sendFile: jest.fn(),
    };

    expect(() =>
      controller.download('../secrets.txt', response as never),
    ).toThrow(BadRequestException);
    expect(response.sendFile).not.toHaveBeenCalled();
  });

  it('should send files only from the local files root', () => {
    const response = {
      sendFile: jest.fn(),
    };

    controller.download('nested/example.png', response as never);

    expect(response.sendFile).toHaveBeenCalledWith(
      path.normalize('nested/example.png'),
      {
        root: path.resolve(process.cwd(), 'files'),
      },
    );
  });
});
