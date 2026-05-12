'use client';

import { Suspense, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useRouter } from '@/i18n/navigation';
import { useSearchParams } from 'next/navigation';
import { Loader2, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { signIn } from 'next-auth/react';
import AuthLayout from '@/components/auth/AuthLayout';
import { Input } from '@/components/ui/input';
import { sanitizeAppPath } from '@/lib/auth-redirect';

type LoginValues = {
    email: string;
    password: string;
};

export default function SignInPage() {
    return (
        <Suspense fallback={<div className="auth-card" />}>
            <SignInPageContent />
        </Suspense>
    );
}

function SignInPageContent() {
    const { replace } = useRouter();
    const t = useTranslations('Auth');
    const tForms = useTranslations('Forms');
    const searchParams = useSearchParams();
    const searchParamsSnapshot = useMemo(() => new URLSearchParams(searchParams), [searchParams]);
    const nextPath = sanitizeAppPath(searchParamsSnapshot.get('next'));
    const emailPrefill = searchParamsSnapshot.get('email') ?? '';

    const loginSchema = z.object({
        email: z.string().email(tForms('email')),
        password: z.string().min(6, tForms('passwordMin6')),
    });

    const form = useForm<LoginValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: emailPrefill, password: '' }
    });

    const signUpHref = nextPath === '/dashboard'
        ? '/sign-up'
        : `/sign-up?next=${encodeURIComponent(nextPath)}`;

    useEffect(() => {
        const error = searchParamsSnapshot.get('error');
        if (error) {
            if (error === 'OAuthAccountNotLinked') {
                toast.error(t('messages.accountExists'), {
                    description: t('messages.accountExistsDescription')
                });
            } else if (error === 'CredentialsSignin') {
                toast.error(t('messages.loginFailed'), {
                    description: t('messages.loginFailedDescription')
                });
            } else {
                toast.error(t('messages.authFailed'), {
                    description: t('messages.authFailedDescription')
                });
            }
        }
    }, [searchParamsSnapshot, t]);

    const onSubmit = async (data: LoginValues) => {
        try {
            const result = await signIn('credentials', {
                email: data.email,
                password: data.password,
                redirect: false,
            });

            if (result?.error) {
                toast.error(t('messages.loginFailed'), {
                    description: t('messages.loginFailedDescription'),
                });
            } else {
                toast.success(t('messages.welcomeBack'), {
                    description: t('messages.welcomeBackDescription')
                });
                replace(nextPath);
            }
        } catch {
            toast.error(t('messages.loginFailed'), {
                description: t('messages.authFailedDescription')
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
                        <p className="auth-card__tagline">{t('brand.tagline')}</p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => signIn('google', { callbackUrl: nextPath })}
                    className="auth-social"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    {t('actions.googleSignIn')}
                </button>

                <div className="auth-divider">
                    <hr className="auth-divider__line" />
                    <span className="auth-divider__label">{t('actions.or')}</span>
                </div>

                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <div className="auth-field">
                        <label className="auth-field__label" htmlFor="signin-email">{t('fields.email')}</label>
                        <Input
                            id="signin-email"
                            {...form.register('email')}
                            className="auth-field__input"
                            placeholder={t('placeholders.email')}
                            autoComplete="email"
                        />
                        {form.formState.errors.email && (
                            <p className="auth-field__error">{form.formState.errors.email.message}</p>
                        )}
                    </div>

                    <div className="auth-field">
                        <div className="auth-field__header">
                            <label className="auth-field__label" htmlFor="signin-password">{t('fields.password')}</label>
                            <Link href="/forgot-password" className="auth-field__link">{t('links.forgotPassword')}</Link>
                        </div>
                        <Input
                            id="signin-password"
                            {...form.register('password')}
                            type="password"
                            className="auth-field__input"
                            placeholder={t('placeholders.password')}
                            autoComplete="current-password"
                        />
                        {form.formState.errors.password && (
                            <p className="auth-field__error">{form.formState.errors.password.message}</p>
                        )}
                    </div>

                    <button type="submit" disabled={form.formState.isSubmitting} className="auth-submit">
                        {form.formState.isSubmitting ? <Loader2 className="size-4 animate-spin" /> : t('actions.continue')}
                    </button>
                </form>

                <div className="auth-footer">
                    <p className="auth-footer__text">
                        {t('links.dontHaveAccount')}{' '}
                        <Link href={signUpHref}>{t('actions.signUp')}</Link>
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
