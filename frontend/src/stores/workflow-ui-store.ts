'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type MouseWheelMode = 'pan' | 'zoom';

interface WorkflowUIState {
    helperLines: boolean;
    richTooltips: boolean;
    experimentalTools: boolean;
    autoplayVideos: boolean;
    mouseWheelMode: MouseWheelMode;
    setHelperLines: (enabled: boolean) => void;
    setRichTooltips: (enabled: boolean) => void;
    setExperimentalTools: (enabled: boolean) => void;
    setAutoplayVideos: (enabled: boolean) => void;
    setMouseWheelMode: (mode: MouseWheelMode) => void;
    reset: () => void;
}

const initialState = {
    helperLines: true,
    richTooltips: true,
    experimentalTools: false,
    autoplayVideos: true,
    mouseWheelMode: 'pan' as MouseWheelMode,
};

export const useWorkflowUIStore = create<WorkflowUIState>()(
    persist(
        (set) => ({
            ...initialState,
            setHelperLines: (enabled) => set({ helperLines: enabled }),
            setRichTooltips: (enabled) => set({ richTooltips: enabled }),
            setExperimentalTools: (enabled) => set({ experimentalTools: enabled }),
            setAutoplayVideos: (enabled) => set({ autoplayVideos: enabled }),
            setMouseWheelMode: (mode) => set({ mouseWheelMode: mode }),
            reset: () => set(initialState),
        }),
        {
            name: 'workflow-ui-storage',
            partialize: (state) => ({
                helperLines: state.helperLines,
                richTooltips: state.richTooltips,
                experimentalTools: state.experimentalTools,
                autoplayVideos: state.autoplayVideos,
                mouseWheelMode: state.mouseWheelMode,
            }),
        },
    ),
);
