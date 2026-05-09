export const GENERATION_QUEUE = 'generation';
export const WORKFLOW_QUEUE = 'workflow';
export const SOCIAL_POSTING_QUEUE = 'social-posting';
export const SOCIAL_ANALYTICS_QUEUE = 'social-analytics';
export const VISUAL_FLOW_QUEUE = 'visual-flow';
export const DEAD_LETTER_QUEUE = 'dead-letter';

export const QUEUE_RETRY_ATTEMPTS = 3;
export const QUEUE_RETRY_BACKOFF_MS = 2000;
export const QUEUE_TIMEOUT_MS = 15 * 60 * 1000;
