'use client';

import * as React from 'react';
import { useEffect } from 'react';
import { worker } from '../mocks/browser';

export function MSWProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        let isMounted = true;

        void (async () => {
            if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
                try {
                    if (!isMounted) return;
                    await worker.start({
                        onUnhandledRequest: 'bypass',
                        serviceWorker: {
                            url: '/mockServiceWorker.js',
                        },
                    });
                } catch (error) {
                    console.error('[MSW] Failed to initialize:', error);
                }
            }

        })();

        return () => {
            isMounted = false;
        };
    }, []);

    return <>{children}</>;
}
