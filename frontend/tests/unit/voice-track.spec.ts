import { expect, test } from '@playwright/test';

import { createVoiceExportFilename, getVoicePreviewUrl } from '../../src/lib/voice-track';

test.describe('voice track helpers', () => {
    test('returns preview urls only when present', async () => {
        expect(getVoicePreviewUrl({ resultUrl: 'https://cdn.example.com/voice/sample.mp3' })).toBe('https://cdn.example.com/voice/sample.mp3');
        expect(getVoicePreviewUrl({ resultUrl: '   ' })).toBeNull();
        expect(getVoicePreviewUrl({ resultUrl: null })).toBeNull();
    });

    test('builds safe filenames for rendered audio and exports', async () => {
        expect(createVoiceExportFilename({ id: 'voice-1', prompt: 'Warm Narration' }, 'mp3')).toBe('warm-narration.mp3');
        expect(createVoiceExportFilename({ id: 'voice-2', prompt: '   ' }, 'json')).toBe('voice-voice-2.json');
    });
});
