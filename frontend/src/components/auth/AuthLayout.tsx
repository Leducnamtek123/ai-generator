'use client';

import React from 'react';
import './auth-layout.css';

interface AuthLayoutProps {
    children: React.ReactNode;
    variant?: 'sign-in' | 'sign-up';
}

export default function AuthLayout({ children, variant = 'sign-in' }: AuthLayoutProps) {
    const isSignUp = variant === 'sign-up';

    return (
        <div className="auth-layout">
            {/* ── Visual Panel ── */}
            <aside className="auth-visual" aria-hidden="true">
                <div className="auth-visual__mesh" />
                <div className="auth-visual__orb auth-visual__orb--1" />
                <div className="auth-visual__orb auth-visual__orb--2" />
                <div className="auth-visual__orb auth-visual__orb--3" />
                <div className="auth-visual__orb auth-visual__orb--4" />
                <div className="auth-visual__grid" />
                <div className="auth-visual__noise" />

                <div className="auth-visual__content">
                    <div className="auth-visual__icon">
                        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M32 4L58 18V46L32 60L6 46V18L32 4Z" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
                            <path d="M32 4L58 18L32 32L6 18L32 4Z" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                            <path d="M32 32V60L6 46V18L32 32Z" fill="rgba(255,255,255,0.04)" />
                            <path d="M32 32V60L58 46V18L32 32Z" fill="rgba(255,255,255,0.06)" />
                            <circle cx="32" cy="28" r="6" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
                            <path d="M28 28L31 31L36 25" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>

                    <h2 className="auth-visual__title">
                        {isSignUp ? 'Start Creating' : 'Welcome Back'}
                    </h2>
                    <p className="auth-visual__subtitle">
                        {isSignUp
                            ? 'Join thousands of creators using AI to bring their visions to life.'
                            : 'Your creative workspace is waiting. Sign in to continue building amazing things.'}
                    </p>

                    <div className="auth-pills">
                        <span className="auth-pill">
                            <span className="auth-pill__dot" style={{ background: 'oklch(0.65 0.25 270)' }} />
                            AI Generation
                        </span>
                        <span className="auth-pill">
                            <span className="auth-pill__dot" style={{ background: 'oklch(0.72 0.19 160)' }} />
                            Smart Workflows
                        </span>
                        <span className="auth-pill">
                            <span className="auth-pill__dot" style={{ background: 'oklch(0.68 0.18 340)' }} />
                            Real-time Editor
                        </span>
                    </div>
                </div>

                <div className="auth-visual__lines">
                    <div className="auth-visual__line auth-visual__line--1" />
                    <div className="auth-visual__line auth-visual__line--2" />
                    <div className="auth-visual__line auth-visual__line--3" />
                </div>

                <div className="auth-visual__watermark">PaintAI</div>
            </aside>

            {/* ── Form Panel ── */}
            <main className="auth-form-panel">
                <div className="auth-form-panel__inner">
                    {children}
                </div>
            </main>
        </div>
    );
}
