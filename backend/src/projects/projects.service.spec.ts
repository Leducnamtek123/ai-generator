import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ProjectsService } from './projects.service';

describe('ProjectsService', () => {
  it('should reject project creation for organizations the user does not belong to', async () => {
    const projectRepository = {
      create: jest.fn(),
    };
    const orgRepository = {
      findById: jest.fn().mockResolvedValue({
        id: 'org-1',
      }),
    };
    const memberRepository = {
      findByUserAndOrg: jest.fn().mockResolvedValue(null),
    };

    const service = new ProjectsService(
      projectRepository as any,
      orgRepository as any,
      memberRepository as any,
    );

    await expect(
      service.create(
        {
          name: 'Hidden project',
        } as any,
        7,
        'org-1',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(projectRepository.create).not.toHaveBeenCalled();
  });

  it('should allow project creation for a member of the organization', async () => {
    const projectRepository = {
      create: jest.fn().mockResolvedValue({
        id: 'project-1',
      }),
    };
    const orgRepository = {
      findById: jest.fn().mockResolvedValue({
        id: 'org-1',
      }),
    };
    const memberRepository = {
      findByUserAndOrg: jest.fn().mockResolvedValue({
        id: 'member-1',
      }),
    };

    const service = new ProjectsService(
      projectRepository as any,
      orgRepository as any,
      memberRepository as any,
    );

    await expect(
      service.create(
        {
          name: 'Workspace project',
        } as any,
        7,
        'org-1',
      ),
    ).resolves.toEqual({
      id: 'project-1',
    });

    expect(projectRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: 'org-1',
        userId: '7',
      }),
    );
  });

  it('should throw not found when the organization does not exist', async () => {
    const projectRepository = {
      create: jest.fn(),
    };
    const orgRepository = {
      findById: jest.fn().mockResolvedValue(null),
    };
    const memberRepository = {
      findByUserAndOrg: jest.fn(),
    };

    const service = new ProjectsService(
      projectRepository as any,
      orgRepository as any,
      memberRepository as any,
    );

    await expect(
      service.create(
        {
          name: 'Workspace project',
        } as any,
        7,
        'org-404',
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
