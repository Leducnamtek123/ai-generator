'use client';

import { useReducer } from 'react';
import { useGenerationStore } from '@/stores/generation-store';
import { VoiceGeneratorView } from './view';

export type VoiceGeneratorState = {
    text: string;
    selectedVoice: string;
    selectedLanguage: string;
    selectedEmotion: string;
    speed: number;
    pitch: number;
    stability: number;
    isGenerating: boolean;
    activeTab: 'tts' | 'clone';
    contentTab: 'history' | 'voices';
};

export type VoiceGeneratorAction =
    | { type: 'setText'; text: string }
    | { type: 'setSelectedVoice'; selectedVoice: string }
    | { type: 'setSelectedLanguage'; selectedLanguage: string }
    | { type: 'setSelectedEmotion'; selectedEmotion: string }
    | { type: 'setSpeed'; speed: number }
    | { type: 'setPitch'; pitch: number }
    | { type: 'setStability'; stability: number }
    | { type: 'setIsGenerating'; isGenerating: boolean }
    | { type: 'setActiveTab'; activeTab: 'tts' | 'clone' }
    | { type: 'setContentTab'; contentTab: 'history' | 'voices' };

const initialState: VoiceGeneratorState = {
    text: '',
    selectedVoice: 'aria',
    selectedLanguage: 'en',
    selectedEmotion: 'neutral',
    speed: 100,
    pitch: 0,
    stability: 50,
    isGenerating: false,
    activeTab: 'tts',
    contentTab: 'history',
};

function reducer(state: VoiceGeneratorState, action: VoiceGeneratorAction): VoiceGeneratorState {
    switch (action.type) {
        case 'setText':
            return { ...state, text: action.text };
        case 'setSelectedVoice':
            return { ...state, selectedVoice: action.selectedVoice };
        case 'setSelectedLanguage':
            return { ...state, selectedLanguage: action.selectedLanguage };
        case 'setSelectedEmotion':
            return { ...state, selectedEmotion: action.selectedEmotion };
        case 'setSpeed':
            return { ...state, speed: action.speed };
        case 'setPitch':
            return { ...state, pitch: action.pitch };
        case 'setStability':
            return { ...state, stability: action.stability };
        case 'setIsGenerating':
            return { ...state, isGenerating: action.isGenerating };
        case 'setActiveTab':
            return { ...state, activeTab: action.activeTab };
        case 'setContentTab':
            return { ...state, contentTab: action.contentTab };
        default:
            return state;
    }
}

export default function VoiceGeneratorPage() {
    const [state, dispatch] = useReducer(reducer, initialState);
    const { generateVoice } = useGenerationStore();

    const handleGenerate = async () => {
        if (!state.text.trim()) return;
        dispatch({ type: 'setIsGenerating', isGenerating: true });
        await generateVoice({
            text: state.text,
            mode: state.activeTab,
            voiceId: state.selectedVoice,
            language: state.selectedLanguage,
            emotion: state.selectedEmotion,
            speed: state.speed / 100,
        });
        dispatch({ type: 'setIsGenerating', isGenerating: false });
    };

    return <VoiceGeneratorView state={state} dispatch={dispatch} onGenerate={handleGenerate} />;
}
