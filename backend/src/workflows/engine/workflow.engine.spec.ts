import { WorkflowEngine } from './workflow.engine';

describe('WorkflowEngine', () => {
  it('should keep workflow running when a node queues background generation', async () => {
    const generationQueue = {
      add: jest.fn().mockResolvedValue({ id: 'job-1' }),
      getJob: jest.fn().mockResolvedValue(null),
    };

    const engine = new WorkflowEngine(generationQueue as any);

    const result = await engine.execute(
      'workflow-1',
      {
        nodes: [
          {
            id: 'node-1',
            type: 'image_gen',
            data: {
              prompt: 'Build a cover image',
            },
            position: { x: 0, y: 0 },
          },
        ],
        edges: [],
      },
      'user-1',
      'project-1',
      'run-abc',
    );

    expect(result.status).toBe('running');
    expect(result.nodeStates.get('node-1')?.status).toBe('queued');
    expect(result.completedAt).toBeUndefined();
    expect(generationQueue.add).toHaveBeenCalledWith(
      'image',
      expect.objectContaining({
        type: 'image',
        userId: 'user-1',
        workflowId: 'workflow-1',
        projectId: 'project-1',
        runId: 'run-abc',
      }),
      expect.objectContaining({
        jobId: 'workflow-1:run-abc:node-1:image',
        removeOnComplete: true,
      }),
    );
  });

  it('should complete workflow immediately when no node is queued', async () => {
    const generationQueue = {
      add: jest.fn(),
      getJob: jest.fn(),
    };

    const engine = new WorkflowEngine(generationQueue as any);

    const result = await engine.execute(
      'workflow-2',
      {
        nodes: [
          {
            id: 'node-1',
            type: 'text',
            data: {
              text: 'Hello',
            },
            position: { x: 0, y: 0 },
          },
        ],
        edges: [],
      },
      'user-1',
      'project-1',
      'run-def',
    );

    expect(result.status).toBe('completed');
    expect(result.nodeStates.get('node-1')?.status).toBe('completed');
    expect(result.completedAt).toBeInstanceOf(Date);
    expect(generationQueue.add).not.toHaveBeenCalled();
  });

  it('should remove an existing queued job before re-enqueueing the same workflow node', async () => {
    const existingJob = {
      getState: jest.fn().mockResolvedValue('waiting'),
      remove: jest.fn().mockResolvedValue(undefined),
    };
    const generationQueue = {
      add: jest.fn().mockResolvedValue({ id: 'job-1' }),
      getJob: jest.fn().mockResolvedValue(existingJob),
    };

    const engine = new WorkflowEngine(generationQueue as any);

    await engine.execute(
      'workflow-1',
      {
        nodes: [
          {
            id: 'node-1',
            type: 'image_gen',
            data: {
              prompt: 'Build a cover image',
            },
            position: { x: 0, y: 0 },
          },
        ],
        edges: [],
      },
      'user-1',
      'project-1',
      'run-abc',
    );

    expect(existingJob.remove).toHaveBeenCalled();
    expect(generationQueue.add).toHaveBeenCalledWith(
      'image',
      expect.objectContaining({
        type: 'image',
        userId: 'user-1',
        workflowId: 'workflow-1',
        projectId: 'project-1',
        runId: 'run-abc',
      }),
      expect.objectContaining({
        jobId: 'workflow-1:run-abc:node-1:image',
        removeOnComplete: true,
        removeOnFail: 10,
      }),
    );
  });
});
