'use client';

import { useReducer, useEffect, useState } from 'react';
import { useGenerationStore } from '@/stores/generation-store';
import { useTemplateStore } from '@/stores/template-store';
import { TemplateTypeEnum } from '@/lib/api/templates';
import { CONTENT_TABS, COMMUNITY_TAB, TEMPLATES_TAB } from '@/components/layouts/navigation-data';
import { VoiceGeneratorView } from './view';

export type VoiceGeneratorState = {
    text: string;
    selectedVoice: string;
    selectedLanguage: string;
    selectedEmotion: string;
    speed: number;
    pitch: number;
    stability: number;
    activeTab: 'tts' | 'clone';
    activeContentTab: string;
};

export type VoiceGeneratorAction =
    | { type: 'setText'; text: string }
    | { type: 'setSelectedVoice'; selectedVoice: string }
    | { type: 'setSelectedLanguage'; selectedLanguage: string }
    | { type: 'setSelectedEmotion'; selectedEmotion: string }
    | { type: 'setSpeed'; speed: number }
    | { type: 'setPitch'; pitch: number }
    | { type: 'setStability'; stability: number }
    | { type: 'setActiveTab'; activeTab: 'tts' | 'clone' }
    | { type: 'setActiveContentTab'; tab: string };

const initialState: VoiceGeneratorState = {
    text: '',
    selectedVoice: 'aria',
    selectedLanguage: 'en',
    selectedEmotion: 'neutral',
    speed: 100,
    pitch: 0,
    stability: 50,
    activeTab: 'tts',
    activeContentTab: TEMPLATES_TAB,
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
        case 'setActiveTab':
            return { ...state, activeTab: action.activeTab };
        case 'setActiveContentTab':
            return { ...state, activeContentTab: action.tab };
        default:
            return state;
    }
}

export default function VoiceGeneratorPage() {
    const [state, dispatch] = useReducer(reducer, initialState);
    const { generateVoice, isGenerating, generations, fetchGenerations, isLoading: isGenerationsLoading } = useGenerationStore();
    const { templates, fetchTemplates, isLoading: isTemplatesLoading } = useTemplateStore();
    const [communityListings, setCommunityListings] = useState<any[]>([]);
    const [isCommunityLoading, setIsCommunityLoading] = useState(false);

    useEffect(() => {
        if (state.activeContentTab === CONTENT_TABS[0]) { // Personal
            fetchGenerations({ type: TemplateTypeEnum.VOICE_GENERATOR, limit: 12 });
        } else if (state.activeContentTab === COMMUNITY_TAB) { // Community
            const fetchCommunity = async () => {
                setIsCommunityLoading(true);
                try {
                    const res = await import('@/lib/api').then(m => m.get<{ data: any[] }>(`/community-marketplace/listings?type=${TemplateTypeEnum.VOICE_GENERATOR}&limit=12`));
                    setCommunityListings(res.data || []);
                } catch (err) {
                    console.error('Failed to fetch community listings', err);
                } finally {
                    setIsCommunityLoading(false);
                }
            };
            fetchCommunity();
        } else if (state.activeContentTab === TEMPLATES_TAB) { // Templates
            fetchTemplates(TemplateTypeEnum.VOICE_GENERATOR);
        }
    }, [state.activeContentTab, fetchGenerations, fetchTemplates]);

    const handleGenerate = async () => {
        if (!state.text.trim()) return;
        await generateVoice({
            text: state.text,
            mode: state.activeTab,
            voiceId: state.selectedVoice,
            language: state.selectedLanguage,
            emotion: state.selectedEmotion,
            speed: state.speed / 100,
        });
    };

    return (
        <VoiceGeneratorView 
            state={state} 
            dispatch={dispatch} 
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
            generations={generations}
            isGenerationsLoading={isGenerationsLoading}
            templates={templates}
            isTemplatesLoading={isTemplatesLoading}
            communityListings={communityListings}
            isCommunityLoading={isCommunityLoading}
        />
    );
}
