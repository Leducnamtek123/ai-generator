'use client';

import React, { useReducer } from 'react';
import { useUpdateNodeInternals } from '@xyflow/react';
import {
    ExecutionMode,
    NodeStatus,
    UpscaleFactor,
    UpscaleMode,
    UpscaleModel,
    UpscalePreset,
} from '../types';
import { UpscaleNodeView } from './UpscaleNodeView';

export interface UpscaleNodeProps {
    id: string;
    data: {
        label?: string;
        inputUrl?: string;
        previewUrl?: string;
        scale?: UpscaleFactor;
        status?: NodeStatus;
        enhanceMode?: UpscaleMode;
        model?: UpscaleModel;
        preset?: UpscalePreset;
        sharpness?: number;
        grain?: number;
        onDelete?: (id: string) => void;
        onRun?: (id: string, mode?: ExecutionMode) => void;
        onDuplicate?: () => void;
        onSettings?: () => void;
        onReplace?: () => void;
        onReference?: () => void;
        onOpenImageEditor?: (url?: string | null) => void;
        onSettingsChange?: (id: string, settings: Record<string, unknown>) => void;
        onHandleClick?: (event: React.MouseEvent, handleId: string, handleType: 'source' | 'target') => void;
    };
    selected?: boolean;
}

type UpscaleState = {
    activeTab: UpscaleMode;
    scale: UpscaleFactor;
    model: UpscaleModel;
    preset: UpscalePreset;
    sharpness: number;
    grain: number;
    showFullscreen: boolean;
    mediaDimensions: { width: number; height: number } | null;
};

type UpscaleAction =
    | { type: 'setTab'; activeTab: UpscaleMode }
    | { type: 'setScale'; scale: UpscaleFactor }
    | { type: 'setModel'; model: UpscaleModel }
    | { type: 'setPreset'; preset: UpscalePreset }
    | { type: 'setSharpness'; sharpness: number }
    | { type: 'setGrain'; grain: number }
    | { type: 'setFullscreen'; showFullscreen: boolean }
    | { type: 'setMediaDimensions'; mediaDimensions: { width: number; height: number } | null };

function createInitialState(data: UpscaleNodeProps['data']): UpscaleState {
    return {
        activeTab: data.enhanceMode || UpscaleMode.CREATIVE,
        scale: data.scale || UpscaleFactor.TWO_X,
        model: data.model || UpscaleModel.MAGNIFIC_V2,
        preset: data.preset || UpscalePreset.BALANCED,
        sharpness: data.sharpness ?? 20,
        grain: data.grain ?? 10,
        showFullscreen: false,
        mediaDimensions: null,
    };
}

function reducer(state: UpscaleState, action: UpscaleAction): UpscaleState {
    switch (action.type) {
        case 'setTab':
            return { ...state, activeTab: action.activeTab };
        case 'setScale':
            return { ...state, scale: action.scale };
        case 'setModel':
            return { ...state, model: action.model };
        case 'setPreset':
            return { ...state, preset: action.preset };
        case 'setSharpness':
            return { ...state, sharpness: action.sharpness };
        case 'setGrain':
            return { ...state, grain: action.grain };
        case 'setFullscreen':
            return { ...state, showFullscreen: action.showFullscreen };
        case 'setMediaDimensions':
            return { ...state, mediaDimensions: action.mediaDimensions };
        default:
            return state;
    }
}

export function UpscaleNode({ id, data, selected }: UpscaleNodeProps) {
    const [state, dispatch] = useReducer(reducer, data, createInitialState);
    const updateNodeInternals = useUpdateNodeInternals();

    const handleSettingChange = (key: string, value: unknown) => {
        data.onSettingsChange?.(id, { [key]: value });
    };

    const handleMediaLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const target = e.currentTarget;
        dispatch({
            type: 'setMediaDimensions',
            mediaDimensions: { width: target.naturalWidth, height: target.naturalHeight },
        });
        updateNodeInternals(id);
    };

    const handleDownload = () => {
        if (!data.previewUrl) return;
        const link = document.createElement('a');
        link.href = data.previewUrl;
        link.download = `upscaled-${state.scale}-${id}-${Date.now()}.png`;
        link.click();
    };

    const finalWidth = state.mediaDimensions ? state.mediaDimensions.width * (state.scale as number) : 0;
    const finalHeight = state.mediaDimensions ? state.mediaDimensions.height * (state.scale as number) : 0;
    const isFinished = data.status === NodeStatus.SUCCESS && data.previewUrl;
    const isProcessing = data.status === NodeStatus.PROCESSING || data.status === NodeStatus.QUEUED;

    return (
        <UpscaleNodeView
            id={id}
            data={data}
            selected={selected}
            activeTab={state.activeTab}
            scale={state.scale}
            model={state.model}
            preset={state.preset}
            sharpness={state.sharpness}
            grain={state.grain}
            showFullscreen={state.showFullscreen}
            mediaDimensions={state.mediaDimensions}
            isFinished={Boolean(isFinished)}
            isProcessing={isProcessing}
            finalWidth={finalWidth}
            finalHeight={finalHeight}
            onSetTab={(activeTab) => {
                dispatch({ type: 'setTab', activeTab });
                handleSettingChange('enhanceMode', activeTab);
            }}
            onSetModel={(model) => {
                dispatch({ type: 'setModel', model });
                handleSettingChange('model', model);
            }}
            onSetPreset={(preset) => {
                dispatch({ type: 'setPreset', preset });
                handleSettingChange('preset', preset);
            }}
            onSetScale={(scale) => {
                dispatch({ type: 'setScale', scale });
                handleSettingChange('scale', scale);
            }}
            onSetSharpness={(sharpness) => {
                dispatch({ type: 'setSharpness', sharpness });
                handleSettingChange('sharpness', sharpness);
            }}
            onSetGrain={(grain) => {
                dispatch({ type: 'setGrain', grain });
                handleSettingChange('grain', grain);
            }}
            onSetFullscreen={(showFullscreen) => dispatch({ type: 'setFullscreen', showFullscreen })}
            onMediaLoad={handleMediaLoad}
            onDownload={handleDownload}
            onSettingChange={handleSettingChange}
        />
    );
}
