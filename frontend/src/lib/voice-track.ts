export type VoiceTrackLike = {
    id: string;
    prompt: string;
    resultUrl?: string | null;
};

export function getVoicePreviewUrl(track: Pick<VoiceTrackLike, 'resultUrl'>): string | null {
    return track.resultUrl?.trim() || null;
}

export function createVoiceExportFilename(track: Pick<VoiceTrackLike, 'id' | 'prompt'>, extension: string): string {
    const slug = track.prompt
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 64) || `voice-${track.id}`;

    return `${slug}.${extension}`;
}
