export type MusicTrackRow = {
    id: string;
    title: string;
    genre: string;
    duration: string;
    bpm: number;
    time: string;
    resultUrl?: string;
};

export function toMusicTrackRow(track: Partial<MusicTrackRow> & { id: string }): MusicTrackRow {
    return {
        id: track.id,
        title: typeof track.title === 'string' && track.title.trim() ? track.title : 'Untitled Track',
        genre: typeof track.genre === 'string' && track.genre.trim() ? track.genre : 'Music',
        duration: typeof track.duration === 'string' && track.duration.trim() ? track.duration : '0:30',
        bpm: typeof track.bpm === 'number' && Number.isFinite(track.bpm) ? track.bpm : 120,
        time: typeof track.time === 'string' && track.time.trim() ? track.time : 'Recently',
        resultUrl: typeof track.resultUrl === 'string' && track.resultUrl.trim() ? track.resultUrl : undefined,
    };
}

export function getTrackPreviewUrl(track: Pick<MusicTrackRow, 'resultUrl'>): string | null {
    return track.resultUrl?.trim() || null;
}

export function createTrackFilename(track: Pick<MusicTrackRow, 'id' | 'title'>, extension: string): string {
    const slug = track.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 64) || `music-track-${track.id}`;

    return `${slug}.${extension}`;
}
