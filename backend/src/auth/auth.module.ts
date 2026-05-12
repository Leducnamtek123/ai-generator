import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AnonymousStrategy } from './strategies/anonymous.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { MailModule } from '../mail/mail.module';
import { SessionModule } from '../session/session.module';
import { ProjectsModule } from '../projects/projects.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { AuthTokenService } from './services/auth-token.service';
import { SocialAuthService } from './services/social-auth.service';
import { AuthProvisioningService } from './services/auth-provisioning.service';
import { AuthPasswordService } from './services/auth-password.service';
import { ApiKeyStrategy } from './strategies/api-key.strategy';
import { ApiKeysModule } from '../api-keys/api-keys.module';

@Module({
  imports: [
    UsersModule,
    SessionModule,
    PassportModule,
    MailModule,
    ProjectsModule,
    WorkspacesModule,
    ApiKeysModule,
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthTokenService,
    SocialAuthService,
    AuthProvisioningService,
    AuthPasswordService,
    JwtStrategy,
    JwtRefreshStrategy,
    AnonymousStrategy,
    ApiKeyStrategy,
  ],
  exports: [AuthService],
})
export class AuthModule {}
