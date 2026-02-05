import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { WorkflowsService } from './workflows.service';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { UpdateWorkflowDto } from './dto/update-workflow.dto';
import { AuthGuard } from '@nestjs/passport';

import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiBearerAuth()
@ApiTags('Workflows')
@Controller({
  path: 'workflows',
  version: '1',
})
@UseGuards(AuthGuard('jwt'))
export class WorkflowsController {
  constructor(private readonly workflowsService: WorkflowsService) { }

  @Post()
  create(@Body() createWorkflowDto: CreateWorkflowDto) {
    console.log('Creating workflow:', createWorkflowDto);
    return this.workflowsService.create(createWorkflowDto);
  }

  @Get()
  findAll(@Request() req, @Query('projectId') projectId: string) {
    console.log('Finding workflows for project:', projectId);
    if (projectId) {
      return this.workflowsService.findByProject(projectId);
    }
    return this.workflowsService.findAll(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.workflowsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateWorkflowDto: UpdateWorkflowDto,
  ) {
    console.log('Updating workflow:', id, 'Payload keys:', Object.keys(updateWorkflowDto));
    return this.workflowsService.update(id, updateWorkflowDto);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.workflowsService.remove(id);
  }

  @Post(':id/execute')
  execute(@Request() req: any, @Param('id') id: string) {
    return this.workflowsService.execute(id, req.user.id);
  }
}
