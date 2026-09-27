import { useSyncExternalStore } from 'react';
import { getLang, subscribeLang } from './index';

// Re-renders the component when the language changes
export function useLang ()
{
    return useSyncExternalStore(subscribeLang, getLang);
}
