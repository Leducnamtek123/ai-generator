import { UsersService } from './users.service';

describe('UsersService', () => {
  it('should delete sessions before removing the user', async () => {
    const sessionService = {
      deleteByUserId: jest.fn().mockResolvedValue(undefined),
    };

    const usersRepository = {
      remove: jest.fn().mockResolvedValue(undefined),
    };

    const filesService = {} as any;

    const service = new UsersService(
      usersRepository as any,
      filesService,
      sessionService as any,
    );

    await service.remove(42);

    expect(sessionService.deleteByUserId).toHaveBeenCalledWith({
      userId: 42,
    });
    expect(usersRepository.remove).toHaveBeenCalledWith(42);
    expect(
      sessionService.deleteByUserId.mock.invocationCallOrder[0],
    ).toBeLessThan(usersRepository.remove.mock.invocationCallOrder[0]);
  });
});
