import { WorkflowProcessor } from './workflow.processor';
import { WorkflowEngine } from './workflow.engine';
import { WorkflowsService } from '../workflows.service';

describe('WorkflowProcessor', () => {
  const workflowEngine = {
    execute: jest.fn(),
  } as unknown as jest.Mocked<WorkflowEngine>;

  const workflowsService = {
    recordExecutionSnapshot: jest.fn(),
  } as unknown as jest.Mocked<WorkflowsService>;

  const queueReliabilityService = {
    archiveFailure: jest.fn().mockResolvedValue(false),
  };

  const processor = new WorkflowProcessor(
    workflowEngine,
    workflowsService,
    queueReliabilityService as any,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should persist the final workflow execution snapshot after a successful run', async () => {
    workflowsService.recordExecutionSnapshot.mockResolvedValue({} as never);
    workflowEngine.execute.mockResolvedValue({
      status: 'completed',
      nodeStates: new Map([
        [
          'node-1',
          {
            nodeId: 'node-1',
            status: 'completed',
          },
        ],
      ]),
      startedAt: new Date('2026-05-08T00:00:00.000Z'),
      completedAt: new Date('2026-05-08T00:00:10.000Z'),
    } as never);

    const result = await processor.process({
      id: 'job-1',
      data: {
        workflowId: 'workflow-1',
        userId: '42',
        graph: { nodes: [], edges: [] },
        projectId: 'project-1',
        runId: 'run-1',
      },
      updateProgress: jest.fn().mockResolvedValue(undefined),
    } as never);

    expect(workflowsService.recordExecutionSnapshot).toHaveBeenCalledWith(
      expect.objectContaining({
        workflowId: 'workflow-1',
        userId: '42',
        runId: 'run-1',
        status: 'completed',
        jobId: 'job-1',
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        status: 'completed',
      }),
    );
  });
});
