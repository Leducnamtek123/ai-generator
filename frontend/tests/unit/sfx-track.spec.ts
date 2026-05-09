import { expect, test } from '@playwright/test';

import { createSfxFilename, getSfxPreviewUrl } from '../../src/lib/sfx-track';

test.describe('sfx track helpers', () => {
    test('returns preview url only for non-empty result urls', async () => {
        expect(getSfxPreviewUrl({ resultUrl: 'https://cdn.example.com/sfx/rain.wav' })).toBe('https://cdn.example.com/sfx/rain.wav');
        expect(getSfxPreviewUrl({ resultUrl: '   ' })).toBeNull();
        expect(getSfxPreviewUrl({ resultUrl: null })).toBeNull();
    });

    test('creates stable downloadable filenames', async () => {
        expect(createSfxFilename({ id: 'sfx-1', prompt: 'Heavy rain on tin roof' }, 'wav')).toBe('heavy-rain-on-tin-roof.wav');
        expect(createSfxFilename({ id: 'sfx-2', prompt: '   ' }, 'json')).toBe('sfx-sfx-2.json');
    });
});
