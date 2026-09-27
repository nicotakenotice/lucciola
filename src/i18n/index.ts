import { it } from './it';
import { en } from './en';

// Mini-i18n condiviso da React e Phaser: la lingua corrente vive qui,
// React si iscrive ai cambi con useLang(), Phaser legge t() quando crea i testi.

export type Lang = 'it' | 'en';
export type MessageKey = keyof typeof it;

export const LANGS: Lang[] = [ 'it', 'en' ];

const dictionaries: Record<Lang, Record<MessageKey, string>> = { it, en };
const LANG_KEY = 'lucciola.lang';

function detect (): Lang
{
    try
    {
        const saved = localStorage.getItem(LANG_KEY);
        if (saved === 'it' || saved === 'en') return saved;
    }
    catch
    {
        // storage non disponibile: si usa la lingua del browser
    }

    return navigator.language?.toLowerCase().startsWith('it') ? 'it' : 'en';
}

let lang: Lang = detect();
const listeners = new Set<() => void>();
document.documentElement.lang = lang;

export function getLang (): Lang
{
    return lang;
}

export function setLang (value: Lang)
{
    if (value === lang) return;
    lang = value;
    document.documentElement.lang = value;
    try
    {
        localStorage.setItem(LANG_KEY, value);
    }
    catch
    {
        // preferenza non salvata: vale solo per questa sessione
    }
    listeners.forEach((fn) => fn());
}

export function subscribeLang (fn: () => void)
{
    listeners.add(fn);

    return () =>
    {
        listeners.delete(fn);
    };
}

export function t (key: MessageKey, params?: Record<string, string | number>): string
{
    let text = dictionaries[lang][key];
    if (params)
    {
        for (const [ name, value ] of Object.entries(params)) text = text.split(`{${name}}`).join(String(value));
    }

    return text;
}
