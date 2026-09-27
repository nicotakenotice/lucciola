import { it } from './it';
import { en } from './en';

// Tiny i18n shared by React and Phaser: the current language lives here,
// React subscribes to changes with useLang(), Phaser calls t() when it creates texts.

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
        // storage unavailable: fall back to the browser language
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
        // preference not saved: it only lasts for this session
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
