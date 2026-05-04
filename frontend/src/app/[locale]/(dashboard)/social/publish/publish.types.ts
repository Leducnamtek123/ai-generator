import type { SocialChannel } from '@/services/socialHubApi';

export type PublishState = {
    accounts: SocialChannel[];
    isLoadingAccounts: boolean;
    selectedAccountIds: number[];
    previewPlatform: string;
    content: string;
    isScheduling: boolean;
    scheduledAt: string;
    isAiModalOpen: boolean;
    isPublishing: boolean;
};

export type PublishAction =
    | { type: 'channelsLoaded'; accounts: SocialChannel[] }
    | { type: 'channelsFailed' }
    | { type: 'toggleAccount'; accountId: number }
    | { type: 'setPreviewPlatform'; platform: string }
    | { type: 'setContent'; content: string }
    | { type: 'toggleScheduling'; anchor: Date }
    | { type: 'setScheduledAt'; scheduledAt: string }
    | { type: 'openAiModal' }
    | { type: 'closeAiModal' }
    | { type: 'setPublishing'; isPublishing: boolean };

export type PublishPageViewProps = {
    state: PublishState;
    selectedAccounts: SocialChannel[];
    onToggleAccount: (account: SocialChannel) => void;
    onToggleScheduling: () => void;
    onPublish: () => void;
    onOpenAiModal: () => void;
    onCloseAiModal: () => void;
    onSetContent: (content: string) => void;
    onSetScheduledAt: (scheduledAt: string) => void;
    onSetPreviewPlatform: (platform: string) => void;
    onClearDraft: () => void;
};
