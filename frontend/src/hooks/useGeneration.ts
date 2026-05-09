'use client';

import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import {
    generateImage,
    generateVideo,
    upscaleImage,
    enhancePrompt,
    GenerationResult,
    GenerateImageParams,
    GenerateVideoParams,
    UpscaleImageParams,
    EnhancePromptParams,
} from '@/lib/api/generations';
import { getUserFacingErrorMessage, isAbortError } from '@/lib/async-operation';

interface UseGenerationReturn {
    isGenerating: boolean;
    result: GenerationResult | null;
    error: string | null;
    handleGenerateImage: (params: GenerateImageParams) => Promise<GenerationResult | null>;
    handleGenerateVideo: (params: GenerateVideoParams) => Promise<GenerationResult | null>;
    handleUpscaleImage: (params: UpscaleImageParams) => Promise<GenerationResult | null>;
    handleEnhancePrompt: (params: EnhancePromptParams) => Promise<string | null>;
    reset: () => void;
}

export function useGeneration(): UseGenerationReturn {
    const [isGenerating, setIsGenerating] = useState(false);
    const [result, setResult] = useState<GenerationResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const reset = useCallback(() => {
        setResult(null);
        setError(null);
    }, []);

    const runGeneration = useCallback(
        async <T,>(runner: () => Promise<T>, fallback: string, successMessage: string) => {
            setIsGenerating(true);
            setError(null);

            try {
                const value = await runner();
                toast.success(successMessage);
                return value;
            } catch (err: unknown) {
                const msg = getUserFacingErrorMessage(err, fallback);
                setError(msg);
                if (!isAbortError(err)) {
                    toast.error(msg);
                }
                return null;
            } finally {
                setIsGenerating(false);
            }
        },
        [],
    );

    const handleGenerateImage = useCallback(
        async (params: GenerateImageParams) => {
            const generated = await runGeneration(
                () => generateImage(params),
                'Failed to generate image',
                'Image generation started!',
            );
            if (generated) {
                setResult(generated);
            }
            return generated;
        },
        [runGeneration],
    );

    const handleGenerateVideo = useCallback(
        async (params: GenerateVideoParams) => {
            const generated = await runGeneration(
                () => generateVideo(params),
                'Failed to generate video',
                'Video generation started!',
            );
            if (generated) {
                setResult(generated);
            }
            return generated;
        },
        [runGeneration],
    );

    const handleUpscaleImage = useCallback(
        async (params: UpscaleImageParams) => {
            const generated = await runGeneration(
                () => upscaleImage(params),
                'Failed to upscale image',
                'Upscale started!',
            );
            if (generated) {
                setResult(generated);
            }
            return generated;
        },
        [runGeneration],
    );

    const handleEnhancePrompt = useCallback(
        async (params: EnhancePromptParams) => {
            const generated = await runGeneration(
                () => enhancePrompt(params),
                'Failed to enhance prompt',
                'Prompt enhanced!',
            );
            if (generated && typeof generated === 'object' && 'enhancedPrompt' in generated) {
                const value = generated as { enhancedPrompt?: string };
                return value.enhancedPrompt ?? null;
            }
            return null;
        },
        [runGeneration],
    );

    return {
        isGenerating,
        result,
        error,
        handleGenerateImage,
        handleGenerateVideo,
        handleUpscaleImage,
        handleEnhancePrompt,
        reset,
    };
}
