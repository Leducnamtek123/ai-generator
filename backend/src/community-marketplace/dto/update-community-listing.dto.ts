import { PartialType } from '@nestjs/swagger';
import { CreateCommunityListingDto } from './create-community-listing.dto';

export class UpdateCommunityListingDto extends PartialType(
  CreateCommunityListingDto,
) {}
