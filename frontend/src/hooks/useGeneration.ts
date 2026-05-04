'use client';

import { useState, useCallback } from 'react';
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

function getGenerationErrorMessage(err: unknown, fallback: string) {
    if (typeof err === 'object' && err !== null) {
        const maybeError = err as {
            response?: { data?: { message?: string } };
            message?: string;
        };
        return maybeError.response?.data?.message || maybeError.message || fallback;
    }

    return fallback;
}

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

    const handleGenerateImage = useCallback(async (params: GenerateImageParams) => {
        setIsGenerating(true);
        setError(null);
        let result: GenerationResult | null = null;
        try {
            result = await generateImage(params);
            setResult(result);
            toast.success('Image generation started!');
        } catch (err: unknown) {
            const msg = getGenerationErrorMessage(err, 'Failed to generate image');
            setError(msg);
            toast.error(msg);
        }
        setIsGenerating(false);
        return result;
    }, []);

    const handleGenerateVideo = useCallback(async (params: GenerateVideoParams) => {
        setIsGenerating(true);
        setError(null);
        let result: GenerationResult | null = null;
        try {
            result = await generateVideo(params);
            setResult(result);
            toast.success('Video generation started!');
        } catch (err: unknown) {
            const msg = getGenerationErrorMessage(err, 'Failed to generate video');
            setError(msg);
            toast.error(msg);
        }
        setIsGenerating(false);
        return result;
    }, []);

    const handleUpscaleImage = useCallback(async (params: UpscaleImageParams) => {
        setIsGenerating(true);
        setError(null);
        let result: GenerationResult | null = null;
        try {
            result = await upscaleImage(params);
            setResult(result);
            toast.success('Upscale started!');
        } catch (err: unknown) {
            const msg = getGenerationErrorMessage(err, 'Failed to upscale image');
            setError(msg);
            toast.error(msg);
        }
        setIsGenerating(false);
        return result;
    }, []);

    const handleEnhancePrompt = useCallback(async (params: EnhancePromptParams) => {
        setIsGenerating(true);
        setError(null);
        let result: string | null = null;
        try {
            const res = await enhancePrompt(params);
            toast.success('Prompt enhanced!');
            result = res.enhancedPrompt;
        } catch (err: unknown) {
            const msg = getGenerationErrorMessage(err, 'Failed to enhance prompt');
            setError(msg);
            toast.error(msg);
        }
        setIsGenerating(false);
        return result;
    }, []);

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
