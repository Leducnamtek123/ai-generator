import { Injectable, UnprocessableEntityException, HttpStatus, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import ms from 'ms';
import { UsersService } from '../../users/users.service';
import { MailService } from '../../mail/mail.service';
import { User } from '../../users/domain/user';
import { StatusEnum } from '../../statuses/statuses.enum';
import { SessionService } from '../../session/session.service';
import { AllConfigType } from '../../config/config.type';

@Injectable()
export class AuthPasswordService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService<AllConfigType>,
    private usersService: UsersService,
    private mailService: MailService,
    private sessionService: SessionService,
  ) {}

  async forgotPassword(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: { email: 'emailNotExists' },
      });
    }

    const tokenExpiresIn = this.configService.getOrThrow('auth.forgotExpires', { infer: true });
    const tokenExpires = Date.now() + ms(tokenExpiresIn);

    const hash = await this.jwtService.signAsync(
      { forgotUserId: user.id },
      {
        secret: this.configService.getOrThrow('auth.forgotSecret', { infer: true }),
        expiresIn: tokenExpiresIn,
      },
    );

    await this.mailService.forgotPassword({
      to: email,
      data: { hash, tokenExpires },
    });
  }

  async resetPassword(hash: string, password: string): Promise<void> {
    let userId: User['id'];

    try {
      const jwtData = await this.jwtService.verifyAsync<{ forgotUserId: User['id'] }>(hash, {
        secret: this.configService.getOrThrow('auth.forgotSecret', { infer: true }),
      });
      userId = jwtData.forgotUserId;
    } catch {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: { hash: `invalidHash` },
      });
    }

    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: { hash: `notFound` },
      });
    }

    user.password = password;
    await this.sessionService.deleteByUserId({ userId: user.id });
    await this.usersService.update(user.id, user);
  }

  async confirmEmail(hash: string): Promise<void> {
    let userId: User['id'];

    try {
      const jwtData = await this.jwtService.verifyAsync<{ confirmEmailUserId: User['id'] }>(hash, {
        secret: this.configService.getOrThrow('auth.confirmEmailSecret', { infer: true }),
      });
      userId = jwtData.confirmEmailUserId;
    } catch {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: { hash: `invalidHash` },
      });
    }

    const user = await this.usersService.findById(userId);
    if (!user || user?.status?.id?.toString() !== StatusEnum.inactive.toString()) {
      throw new NotFoundException({ status: HttpStatus.NOT_FOUND, error: `notFound` });
    }

    user.status = { id: StatusEnum.active };
    await this.usersService.update(user.id, user);
  }

  async confirmNewEmail(hash: string): Promise<void> {
    let userId: User['id'];
    let newEmail: User['email'];

    try {
      const jwtData = await this.jwtService.verifyAsync<{
        confirmEmailUserId: User['id'];
        newEmail: User['email'];
      }>(hash, {
        secret: this.configService.getOrThrow('auth.confirmEmailSecret', { infer: true }),
      });
      userId = jwtData.confirmEmailUserId;
      newEmail = jwtData.newEmail;
    } catch {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: { hash: `invalidHash` },
      });
    }

    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException({ status: HttpStatus.NOT_FOUND, error: `notFound` });
    }

    user.email = newEmail;
    user.status = { id: StatusEnum.active };
    await this.usersService.update(user.id, user);
  }
}
