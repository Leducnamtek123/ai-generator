import { AdminQueueService } from './admin-queue.service';

describe('AdminQueueService', () => {
  const deadLetterQueue = {
    getJobs: jest.fn(),
    getJob: jest.fn(),
  };

  const makeQueue = () => ({
    getJob: jest.fn(),
    add: jest.fn().mockResolvedValue(undefined),
  });

  const generationQueue = makeQueue();
  const workflowQueue = makeQueue();
  const socialPostingQueue = makeQueue();
  const socialAnalyticsQueue = makeQueue();
  const visualFlowQueue = makeQueue();

  const service = new AdminQueueService(
    deadLetterQueue as any,
    generationQueue as any,
    workflowQueue as any,
    socialPostingQueue as any,
    socialAnalyticsQueue as any,
    visualFlowQueue as any,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists dead-letter jobs as a compact summary', async () => {
    deadLetterQueue.getJobs.mockResolvedValueOnce([
      {
        id: 'dlq:generation:job-1',
        name: 'failed-job',
        data: {
          sourceQueue: 'generation',
          jobId: 'job-1',
          jobName: 'image',
          attemptsMade: 3,
          failedAt: '2026-05-08T00:00:00.000Z',
          error: { message: 'provider offline' },
        },
        attemptsMade: 3,
        timestamp: Date.parse('2026-05-08T00:00:00.000Z'),
      },
    ] as any);

    await expect(service.listDeadLetterJobs()).resolves.toEqual([
      expect.objectContaining({
        id: 'dlq:generation:job-1',
        sourceQueue: 'generation',
        jobId: 'job-1',
        jobName: 'image',
        attemptsMade: 3,
        errorMessage: 'provider offline',
      }),
    ]);
  });

  it('requeues a dead-letter job back to its source queue', async () => {
    const deadLetterJob = {
      id: 'dlq:generation:job-1',
      remove: jest.fn().mockResolvedValue(undefined),
      data: {
        sourceQueue: 'generation',
        jobId: 'job-1',
        jobName: 'image',
        attemptsMade: 3,
        maxAttempts: 3,
        failedAt: '2026-05-08T00:00:00.000Z',
        error: { message: 'provider offline' },
        data: { prompt: 'hello' },
        metadata: { workflowId: 'workflow-1' },
      },
    };

    deadLetterQueue.getJob.mockResolvedValueOnce(deadLetterJob as any);
    generationQueue.getJob.mockResolvedValueOnce(null);

    await expect(
      service.recoverDeadLetterJob('dlq:generation:job-1'),
    ).resolves.toEqual(
      expect.objectContaining({
        recovered: true,
        deadLetterJobId: 'dlq:generation:job-1',
        sourceQueue: 'generation',
        sourceJobId: 'job-1',
      }),
    );

    expect(generationQueue.add).toHaveBeenCalledWith(
      'image',
      { prompt: 'hello' },
      expect.objectContaining({
        jobId: 'job-1',
        attempts: 3,
      }),
    );
    expect(deadLetterJob.remove).toHaveBeenCalled();
  });
});
