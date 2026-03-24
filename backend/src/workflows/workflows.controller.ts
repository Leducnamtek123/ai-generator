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
import { ExecuteWorkflowDto } from './dto/execute-workflow.dto';
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
  constructor(private readonly workflowsService: WorkflowsService) {}

  @Post()
  create(@Body() createWorkflowDto: CreateWorkflowDto) {
    return this.workflowsService.create(createWorkflowDto);
  }

  @Get()
  findAll(@Request() req, @Query('projectId') projectId: string) {
    if (projectId) {
      return this.workflowsService.findByProject(projectId, req.user.id);
    }
    return this.workflowsService.findAll(req.user.id);
  }

  @Get('community')
  findCommunity() {
    return this.workflowsService.findCommunity();
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.workflowsService.findOne(id, req.user.id);
  }

  @Patch(':id')
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateWorkflowDto: UpdateWorkflowDto,
  ) {
    return this.workflowsService.update(id, req.user.id, updateWorkflowDto);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.workflowsService.remove(id, req.user.id);
  }

  @Post(':id/execute')
  execute(
    @Request() req: any,
    @Param('id') id: string,
    @Body() executeDto: ExecuteWorkflowDto,
  ) {
    return this.workflowsService.execute(
      id,
      req.user.id,
      executeDto.graph?.nodes,
      executeDto.graph?.edges,
    );
  }
}
