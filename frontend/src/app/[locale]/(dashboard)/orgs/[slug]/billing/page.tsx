'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { billingApi, type BillingDetails } from '@/services/billingApi';
import {
    CreditCard, Users, Loader2, ArrowLeft,
    DollarSign, TrendingUp
} from 'lucide-react';
import { Link } from '@/i18n/navigation';

export default function BillingPage() {
    const params = useParams();
    const slug = params?.slug as string;

    const [billing, setBilling] = useState<BillingDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const loadBilling = useCallback(async () => {
        try {
            const data = await billingApi.get(slug);
            setBilling(data);
        } catch {
            setError('Failed to load billing details');
        }
        setLoading(false);
    }, [slug]);

    useEffect(() => {
        queueMicrotask(() => { void loadBilling(); });
    }, [loadBilling]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(value);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6">
            <div className="mb-8">
                <Link
                    href={"/dashboard" as string}
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </Link>
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <CreditCard className="w-6 h-6 text-primary" />
                    Billing
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Current billing cycle overview
                </p>
            </div>

            {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-xl px-4 py-3 text-sm mb-6">
                    {error}
                </div>
            )}

            {billing && (
                <div className="space-y-6">
                    {/* Total card */}
                    <div className="relative overflow-hidden bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 rounded-2xl p-8 text-white">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(255,255,255,0.15),transparent_50%)]" />
                        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl" />
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 text-white/70 text-sm mb-2">
                                <TrendingUp className="w-4 h-4" />
                                Monthly Total
                            </div>
                            <div className="text-4xl font-bold tracking-tight">
                                {formatCurrency(billing.total)}
                            </div>
                            <div className="text-sm text-white/60 mt-2">
                                Billed monthly based on active seats
                            </div>
                        </div>
                    </div>

                    {/* Seats breakdown */}
                    <div className="bg-card border border-border rounded-xl p-6 hover:border-primary/20 transition-colors">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                    <Users className="w-4 h-4 text-blue-500" />
                                </div>
                                Seats
                            </div>
                            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                                {formatCurrency(billing.seats.unit)}/seat
                            </span>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-end justify-between">
                                <span className="text-3xl font-bold text-foreground">{billing.seats.amount}</span>
                                <span className="text-lg font-semibold text-foreground">
                                    {formatCurrency(billing.seats.total)}
                                </span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                                    style={{ width: '100%' }}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Excludes members with Billing role
                            </p>
                        </div>
                    </div>

                    {/* Breakdown Table */}
                    <div className="bg-card border border-border rounded-xl overflow-hidden">
                        <div className="px-5 py-4 border-b border-border">
                            <h3 className="text-sm font-semibold flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-primary" />
                                Billing Breakdown
                            </h3>
                        </div>
                        <div className="divide-y divide-border">
                            <div className="flex items-center justify-between px-5 py-3.5 text-sm">
                                <span className="text-muted-foreground">
                                    Seats ({billing.seats.amount} × {formatCurrency(billing.seats.unit)})
                                </span>
                                <span className="font-medium">{formatCurrency(billing.seats.total)}</span>
                            </div>
                            <div className="flex items-center justify-between px-5 py-3.5 text-sm bg-muted/30">
                                <span className="font-semibold">Total</span>
                                <span className="font-bold text-lg">{formatCurrency(billing.total)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {!billing && !error && (
                <div className="text-center py-16 text-muted-foreground">
                    <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">No billing information available</p>
                </div>
            )}
        </div>
    );
}
