import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { STORAGE_KEYS } from '../storage';

// The language is detected when the module loads, so each test imports a fresh copy
async function loadI18n ()
{
    vi.resetModules();

    return import('./index');
}

function setBrowserLanguage (language: string)
{
    vi.spyOn(navigator, 'language', 'get').mockReturnValue(language);
}

describe('i18n', () =>
{
    beforeEach(() => localStorage.clear());
    afterEach(() => vi.restoreAllMocks());

    it('uses Italian for Italian browsers and English otherwise', async () =>
    {
        setBrowserLanguage('it-IT');
        expect((await loadI18n()).getLang()).toBe('it');

        setBrowserLanguage('en-US');
        expect((await loadI18n()).getLang()).toBe('en');

        setBrowserLanguage('fr-FR');
        expect((await loadI18n()).getLang()).toBe('en');
    });

    it('prefers the saved choice over the browser language', async () =>
    {
        setBrowserLanguage('it-IT');
        localStorage.setItem(STORAGE_KEYS.lang, 'en');
        expect((await loadI18n()).getLang()).toBe('en');
    });

    it('switches, persists, updates <html lang> and notifies subscribers', async () =>
    {
        setBrowserLanguage('en-US');
        const i18n = await loadI18n();
        const listener = vi.fn();
        const unsubscribe = i18n.subscribeLang(listener);

        i18n.setLang('it');
        expect(i18n.t('menu.start')).toBe('Inizia');
        expect(localStorage.getItem(STORAGE_KEYS.lang)).toBe('it');
        expect(document.documentElement.lang).toBe('it');
        expect(listener).toHaveBeenCalledTimes(1);

        i18n.setLang('it');
        expect(listener).toHaveBeenCalledTimes(1);

        unsubscribe();
        i18n.setLang('en');
        expect(listener).toHaveBeenCalledTimes(1);
    });

    it('interpolates every occurrence of a parameter', async () =>
    {
        setBrowserLanguage('en-US');
        const { t } = await loadI18n();
        expect(t('record', { n: 42 })).toBe('Best: 42');
        expect(t('hud.dawnIn', { time: '1:05' })).toBe('Dawn in 1:05');
    });
});
