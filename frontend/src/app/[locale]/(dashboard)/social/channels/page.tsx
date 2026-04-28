'use client';

import React from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { 
    Facebook, 
    Twitter, 
    Linkedin, 
    Instagram, 
    MessageCircle, 
    Plus,
    CheckCircle2,
    XCircle,
    type LucideIcon
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { socialHubApi, type SocialProvider, type SocialChannel } from '@/services/socialHubApi';

const platformMeta: Record<
    string,
    { icon: LucideIcon; color: string; description: string; name: string }
> = {
    facebook: {
        icon: Facebook,
        color: '#1877F2',
        name: 'Facebook Page',
        description: 'Connect your Facebook pages to post updates and track interactions.',
    },
    twitter: {
        icon: Twitter,
        color: '#000000',
        name: 'X (Twitter)',
        description: 'Publish tweets, threads and engage with your audience.',
    },
    x: {
        icon: Twitter,
        color: '#000000',
        name: 'X (Twitter)',
        description: 'Publish tweets, threads and engage with your audience.',
    },
    linkedin: {
        icon: Linkedin,
        color: '#0A66C2',
        name: 'LinkedIn',
        description: 'Share professional updates and articles to your LinkedIn profile or page.',
    },
    instagram: {
        icon: Instagram,
        color: '#E4405F',
        name: 'Instagram',
        description: 'Schedule posts and reels to your Instagram business account.',
    },
};

export default function ChannelsPage() {
    const [accounts, setAccounts] = React.useState<SocialChannel[]>([]);
    const [providers, setProviders] = React.useState<SocialProvider[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    const fetchAccounts = React.useCallback(async () => {
        try {
            const [channels, providerList] = await Promise.all([
                socialHubApi.getChannels(),
                socialHubApi.getProviders(),
            ]);
            setAccounts(channels);
            setProviders(providerList);
        } catch (err) {
            console.error('Failed to fetch accounts', err);
            toast.error('Failed to load social channels');
        } finally {
            setIsLoading(false);
        }
    }, []);

    React.useEffect(() => {
        fetchAccounts();
    }, [fetchAccounts]);

    const handleConnect = async (platformId: string) => {
        try {
            const { url } = await socialHubApi.getAuthUrl(platformId);
            window.location.href = url;
        } catch (err) {
            console.error('Failed to initiate connection', err);
            toast.error('Failed to connect to social platform');
        }
    };

    const handleDisconnect = async (accountId: number) => {
        toast.promise(socialHubApi.disconnectChannel(accountId), {
            loading: 'Disconnecting channel...',
            success: () => {
                fetchAccounts();
                return 'Channel disconnected';
            },
            error: 'Failed to disconnect channel'
        });
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-bold tracking-tight">Social Channels</h1>
                <p className="text-muted-foreground">Connect and manage your social media accounts for cross-platform publishing.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                    <p className="text-sm text-muted-foreground">Loading social providers...</p>
                ) : null}
                {providers.map((provider, index) => {
                    const meta = platformMeta[provider.identifier] ?? {
                        icon: MessageCircle,
                        color: '#6b7280',
                        name: provider.name,
                        description: 'Connect this provider to publish and monitor interactions.',
                    };
                    const connectedAccount = accounts.find(a => a.platform === provider.identifier);
                    const isConnected = !!connectedAccount;
                    const Icon = meta.icon;

                    return (
                        <motion.div
                            key={provider.identifier}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <GlassCard 
                                variant="morphism" 
                                className="relative overflow-hidden group border border-white/10 hover:border-white/20 transition-all h-full flex flex-col"
                            >
                                <div className="absolute top-0 right-0 p-4">
                                    {isConnected ? (
                                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                                    ) : (
                                        <XCircle className="w-5 h-5 text-muted-foreground/30" />
                                    )}
                                </div>

                                <div className="flex items-center gap-4 mb-6">
                                    <div 
                                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white"
                                        style={{ backgroundColor: meta.color }}
                                    >
                                        <Icon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg">{meta.name}</h3>
                                        <span className={`text-xs ${isConnected ? 'text-green-500' : 'text-muted-foreground'}`}>
                                            {isConnected ? `Connected as ${connectedAccount.name}` : 'Not Connected'}
                                        </span>
                                    </div>
                                </div>

                                <p className="text-sm text-muted-foreground mb-8 flex-1">
                                    {meta.description}
                                </p>

                                <Button 
                                    variant={isConnected ? "outline" : "default"}
                                    className="w-full group"
                                    onClick={() => isConnected ? handleDisconnect(connectedAccount.id) : handleConnect(provider.identifier)}
                                >
                                    {isConnected ? 'Disconnect' : (
                                        <>
                                            <Plus className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform" />
                                            Connect Account
                                        </>
                                    )}
                                </Button>
                            </GlassCard>
                        </motion.div>
                    );
                })}
            </div>

            <div className="mt-12 p-6 rounded-2xl bg-primary/5 border border-primary/10">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Plus className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h4 className="font-bold">Missing a platform?</h4>
                        <p className="text-sm text-muted-foreground">We&apos;re constantly adding new integrations. Let us know which one you need!</p>
                    </div>
                    <Button variant="ghost" className="ml-auto">Send Request</Button>
                </div>
            </div>
        </div>
    );
}
