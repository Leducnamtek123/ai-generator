'use client';

import React from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { 
    BarChart3, 
    Users, 
    MessageSquare, 
    Share2, 
    ArrowUpRight,
    ArrowDownRight,
    Facebook,
    Twitter,
    Linkedin,
    Instagram
} from 'lucide-react';
import { motion } from 'framer-motion';
import { 
    AreaChart, 
    Area, 
    XAxis, 
    YAxis, 
    Tooltip, 
    ResponsiveContainer
} from 'recharts';
import { socialHubApi, type SocialAnalytics } from '@/services/socialHubApi';

export default function SocialDashboardPage() {
    const [stats, setStats] = React.useState<SocialAnalytics | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await socialHubApi.getAnalytics();
                setStats(data);
            } catch (err) {
                console.error('Failed to fetch analytics', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (isLoading || !stats) {
        return <div className="p-8">Loading analytics...</div>;
    }

    const DISPLAY_STATS = [
        { label: 'Total Engagement', value: stats.totals.likes + stats.totals.comments + stats.totals.shares, change: '+12.4%', type: 'up', icon: BarChart3 },
        { label: 'Total Likes', value: stats.totals.likes, change: '+8.2%', type: 'up', icon: Users },
        { label: 'Total Comments', value: stats.totals.comments, change: '+5.1%', type: 'up', icon: MessageSquare },
        { label: 'Total Shares', value: stats.totals.shares, change: '-2.4%', type: 'down', icon: Share2 },
    ];
    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-bold tracking-tight">Social Dashboard</h1>
                <p className="text-muted-foreground">Monitor your performance across all connected social channels.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {DISPLAY_STATS.map((stat, index) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <GlassCard variant="morphism" className="border border-white/10 p-6 flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                    <stat.icon className="w-5 h-5" />
                                </div>
                                <div className={`flex items-center text-xs font-bold ${stat.type === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                                    {stat.change}
                                    {stat.type === 'up' ? <ArrowUpRight className="w-3 h-3 ml-1" /> : <ArrowDownRight className="w-3 h-3 ml-1" />}
                                </div>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
                                <h3 className="text-2xl font-bold mt-1 text-white">{typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}</h3>
                            </div>
                        </GlassCard>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Main Engagement Chart */}
                <GlassCard variant="morphism" className="lg:col-span-8 h-[400px] border border-white/10 flex flex-col">
                    <div className="flex items-center justify-between p-6">
                        <h3 className="font-bold text-lg">Engagement Overview</h3>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm">7 Days</Button>
                            <Button variant="outline" size="sm" className="bg-primary/5 border-primary/20 text-primary">30 Days</Button>
                        </div>
                    </div>
                    <div className="flex-1 w-full min-h-[260px] pb-6 pr-6">
                        <ResponsiveContainer
                            width="100%"
                            height="100%"
                            minWidth={0}
                            minHeight={220}
                        >
                            <AreaChart data={stats.chartData}>
                                <defs>
                                    <linearGradient id="colorEngage" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <XAxis 
                                    dataKey="name" 
                                    stroke="rgba(255,255,255,0.2)" 
                                    fontSize={12} 
                                    tickLine={false} 
                                    axisLine={false} 
                                />
                                <YAxis 
                                    stroke="rgba(255,255,255,0.2)" 
                                    fontSize={12} 
                                    tickLine={false} 
                                    axisLine={false} 
                                    tickFormatter={(value) => `${value}`}
                                />
                                <Tooltip 
                                    contentStyle={{ 
                                        backgroundColor: 'rgba(0,0,0,0.8)', 
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '12px',
                                        fontSize: '12px'
                                    }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="engagement" 
                                    stroke="var(--primary)" 
                                    fillOpacity={1} 
                                    fill="url(#colorEngage)" 
                                    strokeWidth={3}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </GlassCard>

                {/* Platform Distribution */}
                <GlassCard variant="morphism" className="lg:col-span-4 h-[400px] border border-white/10">
                    <h3 className="font-bold text-lg mb-8">Audience Distribution</h3>
                    <div className="space-y-6">
                        {[
                            { name: 'Facebook', icon: Facebook, color: '#1877F2', pct: 45 },
                            { name: 'X (Twitter)', icon: Twitter, color: '#000000', pct: 25 },
                            { name: 'LinkedIn', icon: Linkedin, color: '#0A66C2', pct: 20 },
                            { name: 'Instagram', icon: Instagram, color: '#E4405F', pct: 10 },
                        ].map((p) => (
                            <div key={p.name} className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <p.icon className="w-4 h-4" style={{ color: p.color }} />
                                        <span className="font-medium">{p.name}</span>
                                    </div>
                                    <span className="font-bold">{p.pct}%</span>
                                </div>
                                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${p.pct}%` }}
                                        className="h-full bg-primary"
                                        style={{ backgroundColor: p.color }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </GlassCard>
            </div>
        </div>
    );
}
