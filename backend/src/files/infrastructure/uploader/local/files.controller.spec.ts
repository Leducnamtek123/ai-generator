import { BadRequestException } from '@nestjs/common';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { FilesLocalController } from './files.controller';
import { FilesLocalService } from './files.service';

jest.mock('node:fs', () => ({
  ...jest.requireActual('node:fs'),
  createReadStream: jest.fn(),
  existsSync: jest.fn(),
}));

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
    } as Express.Multer.File, {
      id: 'user-1',
    } as never);

    expect(service.create).toHaveBeenCalledWith(
      { path: 'example.png' },
      'user-1',
    );
    expect(result).toEqual({
      file: { id: 'file-1', path: '/api/v1/files/example.png' },
    });
  });

  it('should reject path traversal attempts on download', () => {
    const response = {
      setHeader: jest.fn(),
      pipe: jest.fn(),
    };

    expect(() =>
      controller.download('../secrets.txt', response as never),
    ).toThrow(BadRequestException);
    expect(response.setHeader).not.toHaveBeenCalled();
  });

  it('should stream files only from the local files root', () => {
    const existsSyncMock = jest.mocked(fs.existsSync);
    const pipe = jest.fn();
    const createReadStreamMock = jest
      .mocked(fs.createReadStream)
      .mockReturnValue({ pipe } as never);
    existsSyncMock.mockReturnValue(true);
    const response = {
      setHeader: jest.fn(),
    };

    controller.download('nested/example.png', response as never);

    expect(existsSyncMock).toHaveBeenCalledWith(
      path.resolve(process.cwd(), 'files', 'nested/example.png'),
    );
    expect(response.setHeader).toHaveBeenCalledWith(
      'Content-Type',
      expect.any(String),
    );
    expect(createReadStreamMock).toHaveBeenCalledWith(
      path.resolve(process.cwd(), 'files', 'nested/example.png'),
    );
    expect(pipe).toHaveBeenCalledWith(response);
  });
});
