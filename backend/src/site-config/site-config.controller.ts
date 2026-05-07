import { Controller, Get, HttpCode, HttpStatus, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { SiteConfigService } from './site-config.service';
import { QuerySiteConfigsDto } from './dto/query-site-configs.dto';

@ApiTags('Site Config')
@Controller({
  path: 'site-config',
  version: '1',
})
export class SiteConfigController {
  constructor(private readonly siteConfigService: SiteConfigService) {}

  @ApiOkResponse({ description: 'Public site config directory.' })
  @Get()
  @HttpCode(HttpStatus.OK)
  list(@Query() query: QuerySiteConfigsDto) {
    return this.siteConfigService.list(query);
  }

  @ApiOkResponse({ description: 'Public site config entry.' })
  @Get(':key')
  @HttpCode(HttpStatus.OK)
  getByKey(@Param('key') key: string, @Query('locale') locale?: string) {
    return this.siteConfigService.getByKeyWithFallback(key, locale);
  }
}
