import { it } from './it';
import { en } from './en';
import { readStorage, STORAGE_KEYS, writeStorage } from '../storage';

// Tiny i18n shared by React and Phaser: the current language lives here,
// React subscribes to changes with useLang(), Phaser calls t() when it creates texts.

export type Lang = 'it' | 'en';
export type MessageKey = keyof typeof it;

export const LANGS: Lang[] = [ 'it', 'en' ];

const dictionaries: Record<Lang, Record<MessageKey, string>> = { it, en };
// A saved choice wins; otherwise Italian browsers get Italian and everyone else English
function detect (): Lang
{
    const saved = readStorage(STORAGE_KEYS.lang);
    if (saved === 'it' || saved === 'en') return saved;

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
    writeStorage(STORAGE_KEYS.lang, value);
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
