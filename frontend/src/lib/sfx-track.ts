export type SfxTrackLike = {
    id: string;
    prompt: string;
    resultUrl?: string | null;
};

export function getSfxPreviewUrl(track: Pick<SfxTrackLike, 'resultUrl'>): string | null {
    return track.resultUrl?.trim() || null;
}

export function createSfxFilename(track: Pick<SfxTrackLike, 'id' | 'prompt'>, extension: string): string {
    const slug = track.prompt
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 64) || `sfx-${track.id}`;

    return `${slug}.${extension}`;
}
