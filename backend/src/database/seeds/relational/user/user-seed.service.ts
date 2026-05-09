import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';
import bcrypt from 'bcryptjs';
import { RoleEnum } from '../../../../roles/roles.enum';
import { StatusEnum } from '../../../../statuses/statuses.enum';
import { UserEntity } from '../../../../users/infrastructure/persistence/relational/entities/user.entity';

@Injectable()
export class UserSeedService {
  constructor(
    @InjectRepository(UserEntity)
    private repository: Repository<UserEntity>,
  ) {}

  async run() {
    const password = await bcrypt.hash('secret', await bcrypt.genSalt());

    const admin = await this.repository.findOne({
      where: {
        email: 'admin@example.com',
      },
    });

    await this.repository.save(
      this.repository.create({
        id: admin?.id,
        firstName: 'Super',
        lastName: 'Admin',
        email: 'admin@example.com',
        password,
        role: {
          id: RoleEnum.admin,
          name: 'Admin',
        },
        status: {
          id: StatusEnum.active,
          name: 'Active',
        },
      }),
    );

    const user = await this.repository.findOne({
      where: {
        email: 'john.doe@example.com',
      },
    });

    await this.repository.save(
      this.repository.create({
        id: user?.id,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password,
        role: {
          id: RoleEnum.user,
          name: 'User',
        },
        status: {
          id: StatusEnum.active,
          name: 'Active',
        },
      }),
    );
  }
}
