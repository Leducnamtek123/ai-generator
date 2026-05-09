import {
  QUEUE_RETRY_ATTEMPTS,
  QUEUE_RETRY_BACKOFF_MS,
  QUEUE_TIMEOUT_MS,
} from './queues.constants';

export const createReliableQueueRegistration = (name: string) => ({
  name,
  defaultJobOptions: {
    attempts: QUEUE_RETRY_ATTEMPTS,
    backoff: {
      type: 'exponential' as const,
      delay: QUEUE_RETRY_BACKOFF_MS,
    },
    timeout: QUEUE_TIMEOUT_MS,
  },
});
