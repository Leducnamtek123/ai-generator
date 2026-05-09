import { expect, test } from '@playwright/test';

import { createTrackFilename, getTrackPreviewUrl, toMusicTrackRow } from '../../src/lib/music-track';

test.describe('music track helpers', () => {
    test('normalizes incomplete track payloads', async () => {
        expect(
            toMusicTrackRow({
                id: 'track-1',
                title: '  ',
                genre: '',
                duration: '',
                bpm: Number.NaN,
                time: '  ',
                resultUrl: '   ',
            }),
        ).toEqual({
            id: 'track-1',
            title: 'Untitled Track',
            genre: 'Music',
            duration: '0:30',
            bpm: 120,
            time: 'Recently',
            resultUrl: undefined,
        });
    });

    test('keeps valid metadata and preview urls', async () => {
        const track = toMusicTrackRow({
            id: 'track-2',
            title: 'Evening Drive',
            genre: 'Cinematic',
            duration: '3:21',
            bpm: 96,
            time: 'Just now',
            resultUrl: 'https://cdn.example.com/audio/evening-drive.mp3',
        });

        expect(track).toEqual({
            id: 'track-2',
            title: 'Evening Drive',
            genre: 'Cinematic',
            duration: '3:21',
            bpm: 96,
            time: 'Just now',
            resultUrl: 'https://cdn.example.com/audio/evening-drive.mp3',
        });
        expect(getTrackPreviewUrl(track)).toBe('https://cdn.example.com/audio/evening-drive.mp3');
    });

    test('creates a safe downloadable filename', async () => {
        expect(createTrackFilename({ id: 'track-3', title: 'My Big Song!' }, 'mp3')).toBe('my-big-song.mp3');
        expect(createTrackFilename({ id: 'track-4', title: '   ' }, 'json')).toBe('music-track-track-4.json');
    });
});
