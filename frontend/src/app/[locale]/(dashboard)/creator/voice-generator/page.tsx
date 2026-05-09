'use client';

import { useReducer, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { useGenerationStore } from '@/stores/generation-store';
import { useTemplateStore } from '@/stores/template-store';
import { MediaPickerModal } from '@/components/common/MediaPickerModal';
import { TemplateTypeEnum } from '@/lib/api/templates';
import { CONTENT_TABS, COMMUNITY_TAB, TEMPLATES_TAB } from '@/components/layouts/navigation-data';
import { VoiceGeneratorView } from './view';
import type { MediaItem } from '@/types/media';
import { uploadFileWithToast } from '@/lib/upload';
import { getUserFacingErrorMessage } from '@/lib/async-operation';
import { projectApi } from '@/services/projectApi';

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
    sampleUrl: string | null;
    sampleName: string;
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
    | { type: 'setActiveContentTab'; tab: string }
    | { type: 'setSampleUrl'; sampleUrl: string | null }
    | { type: 'setSampleName'; sampleName: string }
    | { type: 'reset' };

type VoiceListingItem = {
    id: string;
    title?: string;
    name?: string;
    description?: string;
};

type VoiceSnapshot = {
    text: string;
    selectedVoice: string;
    selectedLanguage: string;
    selectedEmotion: string;
    speed: number;
    pitch: number;
    stability: number;
    activeTab: 'tts' | 'clone';
    activeContentTab: string;
    sampleUrl: string | null;
    sampleName: string;
};

type VoiceProjectPayload = {
    version: number;
    savedAt: string;
    snapshot: Partial<VoiceSnapshot>;
};

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
    sampleUrl: null,
    sampleName: '',
};

const normalizeVoiceSnapshot = (value: unknown): Partial<VoiceSnapshot> => {
    const raw = (value ?? {}) as Record<string, unknown>;
    const snapshot = (raw.snapshot && typeof raw.snapshot === 'object' ? raw.snapshot : raw) as Record<string, unknown>;

    return {
        text: typeof snapshot.text === 'string' ? snapshot.text : '',
        selectedVoice: typeof snapshot.selectedVoice === 'string' ? snapshot.selectedVoice : initialState.selectedVoice,
        selectedLanguage: typeof snapshot.selectedLanguage === 'string' ? snapshot.selectedLanguage : initialState.selectedLanguage,
        selectedEmotion: typeof snapshot.selectedEmotion === 'string' ? snapshot.selectedEmotion : initialState.selectedEmotion,
        speed: typeof snapshot.speed === 'number' ? snapshot.speed : initialState.speed,
        pitch: typeof snapshot.pitch === 'number' ? snapshot.pitch : initialState.pitch,
        stability: typeof snapshot.stability === 'number' ? snapshot.stability : initialState.stability,
        activeTab: snapshot.activeTab === 'clone' ? 'clone' : 'tts',
        activeContentTab: typeof snapshot.activeContentTab === 'string' ? snapshot.activeContentTab : initialState.activeContentTab,
        sampleUrl: typeof snapshot.sampleUrl === 'string' ? snapshot.sampleUrl : null,
        sampleName: typeof snapshot.sampleName === 'string' ? snapshot.sampleName : '',
    };
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
        case 'setSampleUrl':
            return { ...state, sampleUrl: action.sampleUrl };
        case 'setSampleName':
            return { ...state, sampleName: action.sampleName };
        case 'reset':
            return initialState;
        default:
            return state;
    }
}

export default function VoiceGeneratorPage() {
    const [state, dispatch] = useReducer(reducer, initialState);
    const { generateVoice, isGenerating, generations, fetchGenerations, isLoading: isGenerationsLoading } = useGenerationStore();
    const { templates, fetchTemplates, isLoading: isTemplatesLoading } = useTemplateStore();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [communityListings, setCommunityListings] = useState<VoiceListingItem[]>([]);
    const [isCommunityLoading, setIsCommunityLoading] = useState(false);
    const [isAudioPickerOpen, setIsAudioPickerOpen] = useState(false);
    const [projectId, setProjectId] = useState<string | null>(null);
    const [isProjectLoading, setIsProjectLoading] = useState(false);
    const [isProjectSaving, setIsProjectSaving] = useState(false);
    const [projectError, setProjectError] = useState<string | null>(null);
    const isProjectBusy = isProjectLoading || isProjectSaving;

    useEffect(() => {
        if (state.activeContentTab === CONTENT_TABS[0]) { // Personal
            fetchGenerations({ type: TemplateTypeEnum.VOICE_GENERATOR, limit: 12 });
        } else if (state.activeContentTab === COMMUNITY_TAB) { // Community
            const fetchCommunity = async () => {
                setIsCommunityLoading(true);
                try {
                    const res = await import('@/lib/api').then(m => m.get<{ data: VoiceListingItem[] }>(`/community-marketplace/listings?type=${TemplateTypeEnum.VOICE_GENERATOR}&limit=12`));
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

    useEffect(() => {
        const requestedProjectId = searchParams.get('projectId');
        setProjectId(requestedProjectId);

        const applySnapshot = (snapshot: Partial<VoiceSnapshot>) => {
            dispatch({ type: 'setText', text: snapshot.text ?? '' });
            dispatch({ type: 'setSelectedVoice', selectedVoice: snapshot.selectedVoice ?? initialState.selectedVoice });
            dispatch({ type: 'setSelectedLanguage', selectedLanguage: snapshot.selectedLanguage ?? initialState.selectedLanguage });
            dispatch({ type: 'setSelectedEmotion', selectedEmotion: snapshot.selectedEmotion ?? initialState.selectedEmotion });
            dispatch({ type: 'setSpeed', speed: snapshot.speed ?? initialState.speed });
            dispatch({ type: 'setPitch', pitch: snapshot.pitch ?? initialState.pitch });
            dispatch({ type: 'setStability', stability: snapshot.stability ?? initialState.stability });
            dispatch({ type: 'setActiveTab', activeTab: snapshot.activeTab ?? initialState.activeTab });
            dispatch({ type: 'setActiveContentTab', tab: snapshot.activeContentTab ?? initialState.activeContentTab });
            dispatch({ type: 'setSampleUrl', sampleUrl: snapshot.sampleUrl ?? null });
            dispatch({ type: 'setSampleName', sampleName: snapshot.sampleName ?? '' });
            setProjectError(null);
        };

        const loadDraft = () => {
            const draftRaw = localStorage.getItem('voice-generator:draft');
            if (!draftRaw) return;

            try {
                applySnapshot(normalizeVoiceSnapshot(JSON.parse(draftRaw)));
            } catch (error) {
                console.error('Failed to load voice draft', error);
            }
        };

        if (!requestedProjectId) {
            loadDraft();
            return;
        }

        let cancelled = false;
        setIsProjectLoading(true);

        void (async () => {
            try {
                const project = await projectApi.get(requestedProjectId);
                if (cancelled) return;

                applySnapshot(normalizeVoiceSnapshot(project.content));
            } catch (error) {
                console.error('Failed to load voice project', error);
                if (!cancelled) {
                    setProjectError('Loaded local draft because backend project load failed.');
                    loadDraft();
                }
            } finally {
                if (!cancelled) {
                    setIsProjectLoading(false);
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [searchParams]);

    const handleGenerate = async () => {
        if (!state.text.trim() || isProjectBusy) return;
        try {
            await generateVoice({
                text: state.text,
                mode: state.activeTab,
                voiceId: state.selectedVoice,
                language: state.selectedLanguage,
                emotion: state.selectedEmotion,
                speed: state.speed / 100,
            });
        } catch (error) {
            toast.error(getUserFacingErrorMessage(error, 'Failed to generate voice'));
        }
    };

    const handleReset = () => {
        dispatch({ type: 'reset' });
        setProjectError(null);
    };

    const handleSaveProject = () => {
        const payload: VoiceProjectPayload = {
            version: 1,
            savedAt: new Date().toISOString(),
            snapshot: {
                text: state.text,
                selectedVoice: state.selectedVoice,
                selectedLanguage: state.selectedLanguage,
                selectedEmotion: state.selectedEmotion,
                speed: state.speed,
                pitch: state.pitch,
                stability: state.stability,
                activeTab: state.activeTab,
                activeContentTab: state.activeContentTab,
                sampleUrl: state.sampleUrl,
                sampleName: state.sampleName,
            },
        };

        localStorage.setItem('voice-generator:draft', JSON.stringify(payload));

        const persistProject = async () => {
            setIsProjectSaving(true);
            try {
                if (projectId) {
                    await projectApi.update(projectId, {
                        name: 'Voice Generator Draft',
                        description: 'Voice generator draft',
                        content: payload,
                    });
                } else {
                    const created = await projectApi.create({
                        name: 'Voice Generator Draft',
                        description: 'Voice generator draft',
                        content: payload,
                    });
                    setProjectId(created.project.id);
                    router.replace(`${window.location.pathname}?projectId=${created.project.id}`);
                }

                setProjectError(null);
                toast.success('Voice saved to your projects.');
            } catch (error) {
                console.error('Failed to persist voice project', error);
                setProjectError('Saved locally, but backend project save failed.');
                toast.error('Saved locally, but backend project save failed.');
            } finally {
                setIsProjectSaving(false);
            }
        };

        void persistProject();
    };

    const handleSampleUpload = async (file: File) => {
        const uploaded = await uploadFileWithToast(file, file.name);
        if (!uploaded?.url) return;

        dispatch({ type: 'setSampleUrl', sampleUrl: uploaded.url });
        dispatch({ type: 'setSampleName', sampleName: file.name });
    };

    const handleSampleSelect = (media: MediaItem) => {
        dispatch({ type: 'setSampleUrl', sampleUrl: media.url });
        dispatch({ type: 'setSampleName', sampleName: media.name });
    };

    return (
        <>
            <VoiceGeneratorView
                state={state}
                dispatch={dispatch}
                onGenerate={handleGenerate}
                onReset={handleReset}
                onSaveProject={handleSaveProject}
                isGenerating={isGenerating}
                generations={generations}
                isGenerationsLoading={isGenerationsLoading}
                templates={templates}
                isTemplatesLoading={isTemplatesLoading}
                communityListings={communityListings}
                isCommunityLoading={isCommunityLoading}
                sampleUrl={state.sampleUrl}
                sampleName={state.sampleName}
                projectError={projectError}
                isProjectLoading={isProjectLoading}
                isProjectSaving={isProjectSaving}
                onPickSample={() => setIsAudioPickerOpen(true)}
                onUploadSample={handleSampleUpload}
            />
            <MediaPickerModal
                isOpen={isAudioPickerOpen}
                onClose={() => setIsAudioPickerOpen(false)}
                onSelect={handleSampleSelect}
                mediaType="audio"
            />
        </>
    );
}
