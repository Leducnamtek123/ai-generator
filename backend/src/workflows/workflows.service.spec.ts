import { WorkflowsService } from './workflows.service';
import { WorkflowEngine } from './engine/workflow.engine';
import { WorkflowRepository } from './infrastructure/persistence/workflow.repository';
import { GenerationEventsService } from '../generations/services/generation-events.service';
import { NotificationsService } from '../notifications/notifications.service';
import { Queue } from 'bullmq';
import { WorkflowExecutionEntity } from './infrastructure/persistence/relational/entities/workflow-execution.entity';

describe('WorkflowsService', () => {
  const workflowRepository = {
    findById: jest.fn(),
    create: jest.fn(),
    findAll: jest.fn(),
    findCommunity: jest.fn(),
    findByProject: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  } as unknown as jest.Mocked<WorkflowRepository>;

  const workflowExecutionRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  } as unknown as jest.Mocked<any>;

  const workflowEngine = {
    execute: jest.fn(),
  } as unknown as jest.Mocked<WorkflowEngine>;

  const generationEventsService = {
    generationUpdated: {
      subscribe: jest.fn(),
    },
  } as unknown as jest.Mocked<GenerationEventsService>;

  const notificationsService = {
    notifyUser: jest.fn(),
  } as unknown as jest.Mocked<NotificationsService>;

  const workflowQueue = {
    add: jest.fn(),
  } as unknown as jest.Mocked<Queue>;

  const service = new WorkflowsService(
    workflowRepository,
    workflowExecutionRepository as unknown as any,
    workflowEngine,
    generationEventsService,
    notificationsService,
    workflowQueue,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should persist a queued workflow execution snapshot when execution starts', async () => {
    workflowRepository.findById.mockResolvedValue({
      id: 'workflow-1',
      name: 'Workflow 1',
      nodes: [{ id: 'node-1' }],
      edges: [],
      projectId: 'project-1',
    } as never);
    workflowQueue.add.mockResolvedValue({ id: 'job-1' } as never);
    const snapshotSpy = jest
      .spyOn(service, 'recordExecutionSnapshot')
      .mockResolvedValue({ id: 'execution-1' } as WorkflowExecutionEntity);

    const result = await service.execute('workflow-1', '42');

    expect(workflowQueue.add).toHaveBeenCalledWith(
      'workflow_execution',
      expect.objectContaining({
        workflowId: 'workflow-1',
        userId: '42',
        runId: expect.any(String),
      }),
    );
    expect(snapshotSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        workflowId: 'workflow-1',
        userId: '42',
        projectId: 'project-1',
        status: 'queued',
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        status: 'queued',
        workflowId: 'workflow-1',
        workflowName: 'Workflow 1',
      }),
    );
  });
});
