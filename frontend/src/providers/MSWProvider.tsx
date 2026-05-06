'use client';

import * as React from 'react';
import { useEffect } from 'react';

export function MSWProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        let isMounted = true;

        void (async () => {
            if (typeof window === 'undefined' || process.env.NODE_ENV !== 'development') {
                return;
            }

            try {
                const { worker } = await import('../mocks/browser');

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
        })();

        return () => {
            isMounted = false;
        };
    }, []);

    return <>{children}</>;
}
