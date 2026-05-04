'use client';

import { useReducer, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { inviteApi, type InviteDetails } from '@/services/inviteApi';
import {
    Mail, Loader2, Check, X, Building2, User, Shield
} from 'lucide-react';
import { Button } from '@/ui/button';

type InviteState = {
    invite: InviteDetails | null;
    accepting: boolean;
    rejecting: boolean;
    error: string;
    result: 'accepted' | 'rejected' | null;
};

type InviteAction =
    | { type: 'setInvite'; invite: InviteDetails }
    | { type: 'setAccepting'; accepting: boolean }
    | { type: 'setRejecting'; rejecting: boolean }
    | { type: 'setError'; error: string }
    | { type: 'setResult'; result: 'accepted' | 'rejected' | null }
    | { type: 'clearError' };

const initialState: InviteState = {
    invite: null,
    accepting: false,
    rejecting: false,
    error: '',
    result: null,
};

function inviteReducer(state: InviteState, action: InviteAction): InviteState {
    switch (action.type) {
        case 'setInvite':
            return { ...state, invite: action.invite, error: '' };
        case 'setAccepting':
            return { ...state, accepting: action.accepting };
        case 'setRejecting':
            return { ...state, rejecting: action.rejecting };
        case 'setError':
            return { ...state, error: action.error };
        case 'setResult':
            return { ...state, result: action.result };
        case 'clearError':
            return { ...state, error: '' };
        default:
            return state;
    }
}

export default function InviteAcceptPage() {
    const params = useParams();
    const router = useRouter();
    const inviteId = params?.inviteId as string;
    const [state, dispatch] = useReducer(inviteReducer, initialState);

    const loadInvite = useCallback(async () => {
        try {
            const data = await inviteApi.getDetails(inviteId);
            dispatch({ type: 'setInvite', invite: data });
        } catch {
            dispatch({ type: 'setError', error: 'Invite not found or has expired' });
        }
    }, [inviteId]);

    useEffect(() => {
        queueMicrotask(() => { void loadInvite(); });
    }, [loadInvite]);

    const handleAccept = async () => {
        dispatch({ type: 'setAccepting', accepting: true });
        try {
            await inviteApi.accept(inviteId);
            dispatch({ type: 'setResult', result: 'accepted' });
            setTimeout(() => router.push('/dashboard'), 2000);
        } catch {
            dispatch({ type: 'setError', error: 'Failed to accept invite' });
        }
        dispatch({ type: 'setAccepting', accepting: false });
    };

    const handleReject = async () => {
        dispatch({ type: 'setRejecting', rejecting: true });
        try {
            await inviteApi.reject(inviteId);
            dispatch({ type: 'setResult', result: 'rejected' });
        } catch {
            dispatch({ type: 'setError', error: 'Failed to reject invite' });
        }
        dispatch({ type: 'setRejecting', rejecting: false });
    };

    if (!state.invite && !state.error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (state.error && !state.invite) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center max-w-md">
                    <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                        <X className="w-8 h-8 text-destructive" />
                    </div>
                    <h1 className="text-xl font-bold text-foreground mb-2">Invalid Invite</h1>
                    <p className="text-sm text-muted-foreground">{state.error}</p>
                </div>
            </div>
        );
    }

    if (state.result) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center max-w-md">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                        state.result === 'accepted' ? 'bg-emerald-500/10' : 'bg-muted'
                    }`}>
                        {state.result === 'accepted' ? (
                            <Check className="w-8 h-8 text-emerald-500" />
                        ) : (
                            <X className="w-8 h-8 text-muted-foreground" />
                        )}
                    </div>
                    <h1 className="text-xl font-bold text-foreground mb-2">
                        {state.result === 'accepted' ? 'Invite Accepted!' : 'Invite Rejected'}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {state.result === 'accepted'
                            ? `You are now a member of ${state.invite?.org?.name}. Redirecting...`
                            : 'The invite has been rejected.'}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="w-full max-w-md">
                <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xl">
                    {/* Header gradient */}
                    <div className="h-32 bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 relative">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.15),transparent_60%)]" />
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
                            <div className="w-16 h-16 rounded-2xl bg-card border-4 border-card flex items-center justify-center shadow-lg">
                                <Mail className="w-7 h-7 text-primary" />
                            </div>
                        </div>
                    </div>

                    <div className="pt-12 pb-8 px-8 text-center">
                        <h1 className="text-xl font-bold text-foreground mb-1">You&apos;re Invited!</h1>
                        <p className="text-sm text-muted-foreground mb-8">
                            You&apos;ve been invited to join an organization
                        </p>

                        {/* Org Info */}
                        <div className="bg-muted/50 rounded-xl p-5 mb-6 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold">
                        {state.invite?.org?.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div className="text-left">
                        <div className="text-sm font-semibold flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                            {state.invite?.org?.name}
                        </div>
                    </div>
                </div>

                            <div className="h-px bg-border" />

                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <User className="w-3.5 h-3.5" />
                                    Invited by
                                </div>
                                <span className="font-medium text-foreground">
                                    {state.invite?.author?.userInfo?.name || 'Unknown'}
                                </span>
                            </div>

                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Shield className="w-3.5 h-3.5" />
                                    Role
                                </div>
                                <span className="font-medium text-foreground capitalize">
                                    {state.invite?.invite?.role?.toLowerCase()}
                                </span>
                            </div>

                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Mail className="w-3.5 h-3.5" />
                                    Email
                                </div>
                                <span className="font-medium text-foreground">
                                    {state.invite?.invite?.email}
                                </span>
                            </div>
                        </div>

                        {state.error && (
                            <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-lg px-3 py-2 text-sm mb-4">
                                {state.error}
                            </div>
                        )}

                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={handleReject}
                                disabled={state.rejecting || state.accepting}
                            >
                                {state.rejecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                                Decline
                            </Button>
                            <Button
                                className="flex-1"
                                onClick={handleAccept}
                                disabled={state.accepting || state.rejecting}
                            >
                                {state.accepting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                Accept
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
