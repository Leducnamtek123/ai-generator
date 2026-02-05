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
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AuthGuard } from '@nestjs/passport';

import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiBearerAuth()
@ApiTags('Projects')
@Controller({
  path: 'projects',
  version: '1',
})
@UseGuards(AuthGuard('jwt'))
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  create(@Request() req, @Body() createProjectDto: CreateProjectDto) {
    return this.projectsService.create(createProjectDto, req.user.id);
  }

  @Get()
  findAll(@Request() req) {
    return this.projectsService.findAll(req.user.id);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.projectsService.findOne(id, req.user.id);
  }

  @Patch(':id')
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    return this.projectsService.update(id, req.user.id, updateProjectDto);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.projectsService.remove(id, req.user.id);
  }
}
