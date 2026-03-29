import {
  Controller,
  Post,
  Param,
  UseGuards,
  Request,
  Body,
  NotFoundException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { WorkflowsService } from './workflows.service';
import { WorkflowEngine } from './engine/workflow.engine';
import { WorkflowGraph } from './engine/types';

@ApiBearerAuth()
@ApiTags('Workflows Execution')
@Controller({
  path: 'workflows',
  version: '1',
})
export class WorkflowsExecutionController {
  constructor(
    private readonly workflowsService: WorkflowsService,
    private readonly workflowEngine: WorkflowEngine,
  ) {}

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/execute')
  @ApiOperation({ summary: 'Execute a workflow' })
  async execute(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { graph?: WorkflowGraph },
  ) {
    const workflow = await this.workflowsService.findOne(id);
    if (!workflow) {
      throw new NotFoundException('Workflow not found');
    }



    // Use provided graph or fallback to stored graph (if we store JSON in DB)
    // For now, we expect the frontend to send the latest graph state
    const graph: WorkflowGraph = body.graph || {
      nodes: workflow.nodes,
      edges: workflow.edges,
    };

    if (!graph || !graph.nodes) {
      throw new Error('Invalid workflow graph');
    }

    return this.workflowsService.execute(
      id,
      req.user.id,
      graph.nodes,
      graph.edges,
    );
  }
}
