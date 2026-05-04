'use client';

import React from 'react';
import { toast } from 'sonner';
import { socialHubApi, type SocialChannel } from '@/services/socialHubApi';
import { PublishPageView } from './view';
import type { PublishAction, PublishState } from './publish.types';

export default function PublishPage() {
    const scheduleAnchorRef = React.useRef(new Date());
    const [state, dispatch] = React.useReducer(
        (
            current: PublishState,
            action: PublishAction,
        ): PublishState => {
            switch (action.type) {
                case 'channelsLoaded':
                    return {
                        ...current,
                        accounts: action.accounts,
                        isLoadingAccounts: false,
                        selectedAccountIds: action.accounts.length > 0 ? [action.accounts[0].id] : [],
                        previewPlatform: action.accounts[0]?.platform ?? 'facebook',
                    };
                case 'channelsFailed':
                    return { ...current, isLoadingAccounts: false };
                case 'toggleAccount':
                    return {
                        ...current,
                        selectedAccountIds: current.selectedAccountIds.includes(action.accountId)
                            ? current.selectedAccountIds.filter((id) => id !== action.accountId)
                            : [...current.selectedAccountIds, action.accountId],
                    };
                case 'setPreviewPlatform':
                    return { ...current, previewPlatform: action.platform };
                case 'setContent':
                    return { ...current, content: action.content };
                case 'toggleScheduling':
                    return {
                        ...current,
                        isScheduling: !current.isScheduling,
                        scheduledAt: current.isScheduling ? '' : action.anchor.toISOString().slice(0, 16),
                    };
                case 'setScheduledAt':
                    return { ...current, scheduledAt: action.scheduledAt };
                case 'openAiModal':
                    return { ...current, isAiModalOpen: true };
                case 'closeAiModal':
                    return { ...current, isAiModalOpen: false };
                case 'setPublishing':
                    return { ...current, isPublishing: action.isPublishing };
                default:
                    return current;
            }
        },
        {
            accounts: [],
            isLoadingAccounts: true,
            selectedAccountIds: [],
            previewPlatform: 'facebook',
            content: '',
            isScheduling: false,
            scheduledAt: '',
            isAiModalOpen: false,
            isPublishing: false,
        }
    );

    React.useEffect(() => {
        const fetchChannels = async () => {
            try {
                const data = await socialHubApi.getChannels();
                dispatch({ type: 'channelsLoaded', accounts: data });
            } catch (error) {
                console.error('Failed to load social channels', error);
                toast.error('Failed to load connected channels.');
                dispatch({ type: 'channelsFailed' });
            }
        };
        void fetchChannels();
    }, []);

    const selectedAccounts = state.accounts.filter((account) =>
        state.selectedAccountIds.includes(account.id)
    );

    const toggleAccount = (account: SocialChannel) => {
        dispatch({ type: 'toggleAccount', accountId: account.id });
    };

    const handlePublish = async () => {
        if (!state.content) {
            toast.error('Please enter some content first!');
            return;
        }
        if (state.selectedAccountIds.length === 0) {
            toast.error('Select at least one connected channel.');
            return;
        }
        if (state.isScheduling && !state.scheduledAt) {
            toast.error('Please select a date and time for scheduling.');
            return;
        }

        dispatch({ type: 'setPublishing', isPublishing: true });
        toast.promise(
            socialHubApi.createPost({
                content: state.content,
                scheduledAt: state.isScheduling ? new Date(state.scheduledAt).toISOString() : null,
                socialAccountIds: state.selectedAccountIds,
            }),
            {
                loading: state.isScheduling ? 'Scheduling posts...' : 'Publishing to selected channels...',
                success: () => {
                    dispatch({ type: 'setPublishing', isPublishing: false });
                    dispatch({ type: 'setContent', content: '' });
                    if (state.isScheduling) {
                        dispatch({ type: 'setScheduledAt', scheduledAt: '' });
                    }
                    return `Successfully processed for ${state.selectedAccountIds.length} channels!`;
                },
                error: (err) => {
                    dispatch({ type: 'setPublishing', isPublishing: false });
                    return `Failed to publish: ${err.message || 'Unknown error'}`;
                },
            }
        );
    };

    return (
        <PublishPageView
            state={state}
            selectedAccounts={selectedAccounts}
            onToggleAccount={toggleAccount}
            onToggleScheduling={() => {
                dispatch({
                    type: 'toggleScheduling',
                    anchor: scheduleAnchorRef.current,
                });
            }}
            onPublish={handlePublish}
            onOpenAiModal={() => dispatch({ type: 'openAiModal' })}
            onCloseAiModal={() => dispatch({ type: 'closeAiModal' })}
            onSetContent={(content) => dispatch({ type: 'setContent', content })}
            onSetScheduledAt={(scheduledAt) => dispatch({ type: 'setScheduledAt', scheduledAt })}
            onSetPreviewPlatform={(platform) => dispatch({ type: 'setPreviewPlatform', platform })}
            onClearDraft={() => {
                if (state.content && confirm('Are you sure you want to clear the draft?')) {
                    dispatch({ type: 'setContent', content: '' });
                }
            }}
        />
    );
}
