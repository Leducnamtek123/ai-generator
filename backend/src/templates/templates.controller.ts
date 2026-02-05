import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    Request,
} from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Templates')
@Controller({
    path: 'templates',
    version: '1',
})
export class TemplatesController {
    constructor(private readonly templatesService: TemplatesService) { }

    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @Post()
    create(@Request() req, @Body() createTemplateDto: CreateTemplateDto) {
        return this.templatesService.create(createTemplateDto, req.user.id);
    }

    @Get()
    findAll() {
        return this.templatesService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.templatesService.findOne(id);
    }

    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @Patch(':id')
    update(
        @Request() req,
        @Param('id') id: string,
        @Body() updateTemplateDto: UpdateTemplateDto,
    ) {
        return this.templatesService.update(id, updateTemplateDto, req.user.id);
    }

    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.templatesService.remove(id);
    }
}

