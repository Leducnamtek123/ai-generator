'use client';

import { useState, useEffect } from 'react';
import {
    User, Lock, CreditCard, Key, Bell, Shield,
    Camera, Save, Loader2, Eye, EyeOff, Trash2, LogOut, ChevronRight
} from 'lucide-react';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';
import { Label } from '@/ui/label';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const settingsTabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'account', label: 'Account', icon: Lock },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'api', label: 'API Keys', icon: Key },
];

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('profile');

    return (
        <div className="min-h-screen bg-background text-foreground">
            <div className="max-w-[1200px] mx-auto px-6 py-8">
                <h1 className="text-2xl font-bold mb-8">Settings</h1>

                <div className="flex gap-8">
                    {/* Sidebar */}
                    <nav className="w-[220px] shrink-0 space-y-1">
                        {settingsTabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
                                    activeTab === tab.id
                                        ? "bg-accent text-accent-foreground"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                )}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
                    </nav>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        {activeTab === 'profile' && <ProfileSettings />}
                        {activeTab === 'account' && <AccountSettings />}
                        {activeTab === 'billing' && <BillingSettings />}
                        {activeTab === 'notifications' && <NotificationSettings />}
                        {activeTab === 'api' && <ApiKeySettings />}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ──────────────────────────── Profile ────────────────────────────

function ProfileSettings() {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [bio, setBio] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // TODO: call API
            await new Promise(r => setTimeout(r, 500));
            toast.success('Profile updated');
        } catch {
            toast.error('Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-lg font-semibold mb-1">Profile</h2>
                <p className="text-sm text-muted-foreground">Manage your public profile information</p>
            </div>

            {/* Avatar */}
            <div className="flex items-center gap-6">
                <div className="relative">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/30 to-chart-2/30 flex items-center justify-center text-2xl font-bold">
                        {firstName?.[0] || 'U'}
                    </div>
                    <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-background border border-border rounded-lg flex items-center justify-center hover:bg-accent transition-colors">
                        <Camera className="w-3.5 h-3.5" />
                    </button>
                </div>
                <div>
                    <p className="text-sm font-medium">Profile photo</p>
                    <p className="text-xs text-muted-foreground">PNG, JPG up to 5MB</p>
                </div>
            </div>

            {/* Form */}
            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">First Name</Label>
                    <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="John" />
                </div>
                <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Last Name</Label>
                    <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Doe" />
                </div>
            </div>

            <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Email</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@example.com" type="email" />
            </div>

            <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Bio</Label>
                <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us about yourself..."
                    rows={3}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                />
            </div>

            <div className="flex justify-end pt-4 border-t border-border">
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Changes
                </Button>
            </div>
        </div>
    );
}

// ──────────────────────────── Account ────────────────────────────

function AccountSettings() {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-lg font-semibold mb-1">Account</h2>
                <p className="text-sm text-muted-foreground">Manage your account security</p>
            </div>

            {/* Change Password */}
            <div className="p-6 bg-card rounded-2xl border border-border space-y-4">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Lock className="w-4 h-4" /> Change Password
                </h3>
                <div className="space-y-3">
                    <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Current Password</Label>
                        <div className="relative">
                            <Input type={showPassword ? 'text' : 'password'} placeholder="••••••••" />
                            <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">New Password</Label>
                        <Input type="password" placeholder="••••••••" />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Confirm New Password</Label>
                        <Input type="password" placeholder="••••••••" />
                    </div>
                </div>
                <Button size="sm">Update Password</Button>
            </div>

            {/* Connected Accounts */}
            <div className="p-6 bg-card rounded-2xl border border-border space-y-4">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Shield className="w-4 h-4" /> Connected Accounts
                </h3>
                {['Google', 'Apple', 'Facebook'].map((provider) => (
                    <div key={provider} className="flex items-center justify-between py-2">
                        <span className="text-sm">{provider}</span>
                        <Button variant="outline" size="sm">Connect</Button>
                    </div>
                ))}
            </div>

            {/* Danger Zone */}
            <div className="p-6 bg-card rounded-2xl border border-destructive/30 space-y-4">
                <h3 className="text-sm font-semibold text-destructive flex items-center gap-2">
                    <Trash2 className="w-4 h-4" /> Danger Zone
                </h3>
                <p className="text-xs text-muted-foreground">Once deleted, your account cannot be recovered. All data will be permanently removed.</p>
                <div className="flex gap-3">
                    <Button variant="outline" size="sm">
                        <LogOut className="w-4 h-4 mr-2" /> Sign Out All Devices
                    </Button>
                    <Button variant="destructive" size="sm">
                        <Trash2 className="w-4 h-4 mr-2" /> Delete Account
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ──────────────────────────── Billing ────────────────────────────

function BillingSettings() {
    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-lg font-semibold mb-1">Billing</h2>
                <p className="text-sm text-muted-foreground">Manage credits and payment methods</p>
            </div>

            {/* Credit Balance */}
            <div className="p-6 bg-gradient-to-br from-primary/10 to-chart-2/10 rounded-2xl border border-border">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Credit Balance</p>
                        <p className="text-4xl font-bold">250</p>
                        <p className="text-xs text-muted-foreground mt-1">credits remaining</p>
                    </div>
                    <Button>Buy Credits</Button>
                </div>
            </div>

            {/* Plans */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { name: 'Starter', credits: 100, price: '$9.99', popular: false },
                    { name: 'Pro', credits: 500, price: '$39.99', popular: true },
                    { name: 'Enterprise', credits: 2000, price: '$129.99', popular: false },
                ].map((plan) => (
                    <div key={plan.name} className={cn(
                        "p-5 rounded-2xl border bg-card space-y-3 relative",
                        plan.popular ? "border-primary shadow-lg shadow-primary/10" : "border-border"
                    )}>
                        {plan.popular && (
                            <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider rounded-full">
                                Popular
                            </span>
                        )}
                        <h3 className="font-semibold">{plan.name}</h3>
                        <p className="text-2xl font-bold">{plan.price}</p>
                        <p className="text-xs text-muted-foreground">{plan.credits} credits</p>
                        <Button variant={plan.popular ? 'default' : 'outline'} className="w-full" size="sm">
                            Purchase
                        </Button>
                    </div>
                ))}
            </div>

            {/* Transaction History */}
            <div className="space-y-3">
                <h3 className="text-sm font-semibold">Transaction History</h3>
                <div className="border border-border rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border bg-muted/50">
                                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Type</th>
                                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Description</th>
                                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b border-border">
                                <td className="px-4 py-3 text-muted-foreground">No transactions yet</td>
                                <td></td><td></td><td></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// ──────────────────────────── Notifications ────────────────────────────

function NotificationSettings() {
    const [settings, setSettings] = useState({
        generationComplete: true,
        creditLow: true,
        weeklyDigest: false,
        communityMentions: true,
        productUpdates: false,
    });

    const toggle = (key: keyof typeof settings) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const items = [
        { key: 'generationComplete' as const, label: 'Generation Complete', description: 'Get notified when your generations finish' },
        { key: 'creditLow' as const, label: 'Low Credit Warning', description: 'Alert when credits drop below 10' },
        { key: 'weeklyDigest' as const, label: 'Weekly Digest', description: 'Summary of your weekly activity' },
        { key: 'communityMentions' as const, label: 'Community Mentions', description: 'When someone interacts with your content' },
        { key: 'productUpdates' as const, label: 'Product Updates', description: 'New features and improvements' },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-lg font-semibold mb-1">Notifications</h2>
                <p className="text-sm text-muted-foreground">Choose what you want to be notified about</p>
            </div>

            <div className="space-y-2">
                {items.map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-4 bg-card rounded-xl border border-border">
                        <div>
                            <p className="text-sm font-medium">{item.label}</p>
                            <p className="text-xs text-muted-foreground">{item.description}</p>
                        </div>
                        <button
                            onClick={() => toggle(item.key)}
                            className={cn(
                                "w-11 h-6 rounded-full transition-colors relative",
                                settings[item.key] ? "bg-primary" : "bg-muted-foreground/30"
                            )}
                        >
                            <span className={cn(
                                "absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform",
                                settings[item.key] ? "translate-x-[22px]" : "translate-x-0.5"
                            )} />
                        </button>
                    </div>
                ))}
            </div>

            <div className="flex justify-end pt-4 border-t border-border">
                <Button onClick={() => toast.success('Notification preferences saved')}>
                    <Save className="w-4 h-4 mr-2" /> Save Preferences
                </Button>
            </div>
        </div>
    );
}

// ──────────────────────────── API Keys ────────────────────────────

function ApiKeySettings() {
    const [showKey, setShowKey] = useState(false);

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-lg font-semibold mb-1">API Keys</h2>
                <p className="text-sm text-muted-foreground">Manage your API access keys</p>
            </div>

            <div className="p-6 bg-card rounded-2xl border border-border space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium">Production API Key</p>
                        <p className="text-xs text-muted-foreground">Created Dec 15, 2024</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => toast.success('New API key generated')}>
                        Generate New Key
                    </Button>
                </div>
                <div className="flex items-center gap-3">
                    <Input
                        readOnly
                        value={showKey ? 'sk-ai-gen-xxxxxxxxxxxxxxxxxxxx' : '••••••••••••••••••••••••'}
                        className="font-mono text-xs"
                    />
                    <Button variant="ghost" size="icon" onClick={() => setShowKey(!showKey)}>
                        {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                </div>
            </div>

            <div className="p-4 bg-muted/50 rounded-xl border border-border">
                <p className="text-xs text-muted-foreground">
                    <strong className="text-foreground">Rate Limits:</strong> 100 requests/minute for standard plans.
                    Upgrade to Pro for higher limits.
                </p>
            </div>
        </div>
    );
}
