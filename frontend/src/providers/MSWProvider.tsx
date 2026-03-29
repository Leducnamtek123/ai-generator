'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';

export function MSWProvider({ children }: { children: React.ReactNode }) {
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        async function initMSW() {
            if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {

                try {
                    const { worker } = await import('../mocks/browser');
                    await worker.start({
                        onUnhandledRequest: 'bypass',
                        serviceWorker: {
                            url: '/mockServiceWorker.js'
                        }
                    });

                    setIsReady(true);
                } catch (error) {
                    console.error('[MSW] Failed to initialize:', error);
                }
            } else {
                setIsReady(true);
            }
        }

        initMSW();
    }, []);

    return <>{children}</>;
}
