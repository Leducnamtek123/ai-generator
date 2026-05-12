'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { isAxiosError } from 'axios';
import { z } from 'zod';
import { Link } from '@/i18n/navigation';
import { Loader2, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import AuthLayout from '@/components/auth/AuthLayout';
import { Input } from '@/components/ui/input';
import { authApi } from '@/services/authApi';

type ForgotPasswordValues = {
    email: string;
};

export default function ForgotPasswordPage() {
    const [submitted, setSubmitted] = useState(false);
    const t = useTranslations('Auth');
    const tForms = useTranslations('Forms');

    const forgotPasswordSchema = z.object({
        email: z.string().email(tForms('email')),
    });

    const form = useForm<ForgotPasswordValues>({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: { email: '' },
    });

    const onSubmit = async (values: ForgotPasswordValues) => {
        try {
            await authApi.forgotPassword(values.email);
            setSubmitted(true);
            toast.success(t('messages.resetLinkRequested'), {
                description: t('messages.resetLinkRequestedDescription'),
            });
        } catch (error) {
            if (isAxiosError(error) && error.response?.status === 422) {
                setSubmitted(true);
                toast.success(t('messages.resetLinkRequested'), {
                    description: t('messages.resetLinkRequestedDescription'),
                });
                return;
            }

            toast.error(t('messages.unableToRequestResetLink'), {
                description: t('messages.unableToRequestResetLinkDescription'),
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
                        <p className="auth-card__tagline">{t('titles.resetPassword')}</p>
                    </div>
                </div>

                {submitted ? (
                    <div className="rounded-3xl border border-border bg-card/70 p-5">
                        <h2 className="text-lg font-semibold text-foreground">{t('messages.checkInbox')}</h2>
                        <p className="mt-2 text-sm text-muted-foreground">
                            {t('messages.checkInboxDescription')}
                        </p>
                        <div className="mt-4 flex items-center justify-between">
                            <Link href="/sign-in" className="auth-field__link">
                                {t('actions.backToSignIn')}
                            </Link>
                            <div className="auth-footer__secured">
                                <Lock size={12} aria-hidden="true" />
                                <span>{t('brand.securedBy')}</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <div className="auth-field">
                            <label className="auth-field__label" htmlFor="forgot-email">
                                {t('fields.email')}
                            </label>
                            <Input
                                id="forgot-email"
                                {...form.register('email')}
                                className="auth-field__input"
                                placeholder={t('placeholders.email')}
                                autoComplete="email"
                            />
                            {form.formState.errors.email && (
                                <p className="auth-field__error">{form.formState.errors.email.message}</p>
                            )}
                        </div>

                        <button type="submit" disabled={form.formState.isSubmitting} className="auth-submit">
                            {form.formState.isSubmitting ? <Loader2 className="size-4 animate-spin" /> : t('actions.sendResetLink')}
                        </button>
                    </form>
                )}

                <div className="auth-footer">
                    <p className="auth-footer__text">
                        {t('links.rememberedPassword')} <Link href="/sign-in">{t('actions.signIn')}</Link>
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
