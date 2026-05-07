import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEnum,
  ValidateNested,
} from 'class-validator';
import { NotificationCategory } from '../notifications.types';

export class UpdateNotificationPreferenceItemDto {
  @IsEnum(NotificationCategory)
  category: NotificationCategory;

  @IsBoolean()
  emailEnabled: boolean;

  @IsBoolean()
  inAppEnabled: boolean;

  @IsBoolean()
  adminAlertsEnabled: boolean;
}

export class UpdateNotificationPreferencesDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => UpdateNotificationPreferenceItemDto)
  preferences: UpdateNotificationPreferenceItemDto[];
}

