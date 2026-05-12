'use client';

import { Suspense, useMemo, useState } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams } from 'next/navigation';
import { z } from 'zod';
import { Link } from '@/i18n/navigation';
import { Loader2, Lock, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import AuthLayout from '@/components/auth/AuthLayout';
import { Input } from '@/components/ui/input';
import { authApi } from '@/services/authApi';

type PasswordChangeValues = {
    password: string;
    confirmPassword: string;
};

export default function PasswordChangePage() {
    return (
        <Suspense fallback={<div className="auth-card" />}>
            <PasswordChangePageContent />
        </Suspense>
    );
}

function PasswordChangePageContent() {
    const searchParams = useSearchParams();
    const searchParamsSnapshot = useMemo(() => new URLSearchParams(searchParams), [searchParams]);
    const t = useTranslations('Auth');
    const tForms = useTranslations('Forms');
    const hash = searchParamsSnapshot.get('hash') ?? '';
    const [completed, setCompleted] = useState(false);

    const expires = searchParamsSnapshot.get('expires');
    const hasValidHash = hash.length > 0;

    const passwordChangeSchema = z
        .object({
            password: z.string().min(8, tForms('passwordMin8')),
            confirmPassword: z.string().min(8, tForms('passwordMin8')),
        })
        .refine((values) => values.password === values.confirmPassword, {
            message: tForms('passwordsDoNotMatch'),
            path: ['confirmPassword'],
        });

    const form = useForm<PasswordChangeValues>({
        resolver: zodResolver(passwordChangeSchema),
        defaultValues: { password: '', confirmPassword: '' },
    });

    const onSubmit = async (values: PasswordChangeValues) => {
        if (!hasValidHash) {
            toast.error(t('messages.invalidResetLink'), {
                description: t('messages.invalidResetLinkDescription'),
            });
            return;
        }

        try {
            await authApi.resetPassword({ hash, password: values.password });
            setCompleted(true);
            toast.success(t('messages.passwordUpdated'), {
                description: t('messages.passwordUpdatedDescription'),
            });
        } catch {
            toast.error(t('messages.unableToUpdatePassword'), {
                description: t('messages.unableToUpdatePasswordDescription'),
            });
        }
    };

    return (
        <AuthLayout variant="sign-in">
            <div className="auth-card">
                <div className="auth-card__logo">
                    <div className="auth-card__logo-icon">
                        <Image src="/logo.svg" alt="PaintAI" width={32} height={32} />
                    </div>
                    <div>
                        <h1 className="auth-card__title">PaintAI</h1>
                        <p className="auth-card__tagline">{t('titles.chooseNewPassword')}</p>
                    </div>
                </div>

                {!hasValidHash ? (
                    <div className="rounded-3xl border border-amber-500/20 bg-amber-500/10 p-5">
                        <div className="flex items-start gap-3">
                            <ShieldAlert className="mt-0.5 size-5 text-amber-300" />
                            <div>
                                <h2 className="text-lg font-semibold text-foreground">{t('messages.resetLinkMissing')}</h2>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    {t('messages.resetLinkMissingDescription')}
                                </p>
                            </div>
                        </div>
                        <div className="mt-4">
                            <Link href="/forgot-password" className="auth-field__link">
                                {t('actions.requestNewLink')}
                            </Link>
                        </div>
                    </div>
                ) : completed ? (
                    <div className="rounded-3xl border border-border bg-card p-5">
                        <h2 className="text-lg font-semibold text-foreground">{t('messages.passwordChanged')}</h2>
                        <p className="mt-2 text-sm text-muted-foreground">
                            {t('messages.passwordChangedDescription')}
                        </p>
                        <div className="mt-4 flex items-center justify-between">
                            <Link href="/sign-in" className="auth-field__link">
                                {t('actions.goToSignIn')}
                            </Link>
                            <div className="auth-footer__secured">
                                <Lock size={12} aria-hidden="true" />
                                <span>{t('brand.securedBy')}</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <div className="mb-4 rounded-2xl border border-border bg-muted/20 p-4 text-xs text-muted-foreground">
                            <p>{t('messages.tokenStatus')}</p>
                            <p className="mt-1 break-all font-mono text-[11px] text-muted-foreground/70">
                                {expires ? `${t('messages.tokenExpiryPrefix')}${expires}` : t('messages.tokenNoExpiry')}
                            </p>
                        </div>

                        <div className="auth-field">
                            <label className="auth-field__label" htmlFor="password-change-password">
                                {t('fields.password')}
                            </label>
                            <Input
                                id="password-change-password"
                                {...form.register('password')}
                                className="auth-field__input"
                                type="password"
                                placeholder={t('placeholders.newPassword')}
                                autoComplete="new-password"
                            />
                            {form.formState.errors.password && (
                                <p className="auth-field__error">{form.formState.errors.password.message}</p>
                            )}
                        </div>

                        <div className="auth-field">
                            <label className="auth-field__label" htmlFor="password-change-confirm">
                                {t('fields.confirmPassword')}
                            </label>
                            <Input
                                id="password-change-confirm"
                                {...form.register('confirmPassword')}
                                className="auth-field__input"
                                type="password"
                                placeholder={t('placeholders.confirmPassword')}
                                autoComplete="new-password"
                            />
                            {form.formState.errors.confirmPassword && (
                                <p className="auth-field__error">{form.formState.errors.confirmPassword.message}</p>
                            )}
                        </div>

                        <button type="submit" disabled={form.formState.isSubmitting} className="auth-submit">
                            {form.formState.isSubmitting ? <Loader2 className="size-4 animate-spin" /> : t('actions.updatePassword')}
                        </button>
                    </form>
                )}

                <div className="auth-footer">
                    <p className="auth-footer__text">
                        {t('actions.needAnotherLink')} <Link href="/forgot-password">{t('actions.resetPassword')}</Link>
                    </p>
                    <div className="auth-footer__secured">
                        <Lock size={12} aria-hidden="true" />
                        <span>{t('brand.securedBy')}</span>
                    </div>
                </div>
            </div>
        </AuthLayout>
    );
}
