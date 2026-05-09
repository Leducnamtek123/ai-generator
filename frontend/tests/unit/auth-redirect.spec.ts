import { expect, test } from '@playwright/test';

import { sanitizeAppPath } from '../../src/lib/auth-redirect';

test.describe('auth redirect helper', () => {
    test('keeps internal app paths and rejects external ones', async () => {
        expect(sanitizeAppPath('/creator/workflow-editor?workflowId=123')).toBe('/creator/workflow-editor?workflowId=123');
        expect(sanitizeAppPath('/spaces')).toBe('/spaces');
        expect(sanitizeAppPath('https://evil.example')).toBe('/dashboard');
        expect(sanitizeAppPath('//evil.example')).toBe('/dashboard');
        expect(sanitizeAppPath('workflow-editor')).toBe('/dashboard');
        expect(sanitizeAppPath(null)).toBe('/dashboard');
    });
});
