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
        try {
            const res = await generateImage(params);
            setResult(res);
            toast.success('Image generation started!');
            return res;
        } catch (err: any) {
            const msg = err?.response?.data?.message || err?.message || 'Failed to generate image';
            setError(msg);
            toast.error(msg);
            return null;
        } finally {
            setIsGenerating(false);
        }
    }, []);

    const handleGenerateVideo = useCallback(async (params: GenerateVideoParams) => {
        setIsGenerating(true);
        setError(null);
        try {
            const res = await generateVideo(params);
            setResult(res);
            toast.success('Video generation started!');
            return res;
        } catch (err: any) {
            const msg = err?.response?.data?.message || err?.message || 'Failed to generate video';
            setError(msg);
            toast.error(msg);
            return null;
        } finally {
            setIsGenerating(false);
        }
    }, []);

    const handleUpscaleImage = useCallback(async (params: UpscaleImageParams) => {
        setIsGenerating(true);
        setError(null);
        try {
            const res = await upscaleImage(params);
            setResult(res);
            toast.success('Upscale started!');
            return res;
        } catch (err: any) {
            const msg = err?.response?.data?.message || err?.message || 'Failed to upscale image';
            setError(msg);
            toast.error(msg);
            return null;
        } finally {
            setIsGenerating(false);
        }
    }, []);

    const handleEnhancePrompt = useCallback(async (params: EnhancePromptParams) => {
        setIsGenerating(true);
        setError(null);
        try {
            const res = await enhancePrompt(params);
            toast.success('Prompt enhanced!');
            return res.enhancedPrompt;
        } catch (err: any) {
            const msg = err?.response?.data?.message || err?.message || 'Failed to enhance prompt';
            setError(msg);
            toast.error(msg);
            return null;
        } finally {
            setIsGenerating(false);
        }
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
