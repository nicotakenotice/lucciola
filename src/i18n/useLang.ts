import { useSyncExternalStore } from 'react';
import { getLang, subscribeLang } from './index';

// Fa ri-renderizzare il componente quando cambia la lingua
export function useLang ()
{
    return useSyncExternalStore(subscribeLang, getLang);
}
