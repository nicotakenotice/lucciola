import { beforeEach, describe, expect, it } from 'vitest';
import { getLang, setLang, t } from './index';

describe('t()', () =>
{
    beforeEach(() => setLang('en'));

    it('interpolates every occurrence of a parameter', () =>
    {
        expect(t('record', { n: 42 })).toBe('Best: 42');
        expect(t('hud.dawnIn', { time: '1:05' })).toBe('Dawn in 1:05');
    });

    it('follows the current language', () =>
    {
        setLang('it');
        expect(getLang()).toBe('it');
        expect(t('menu.start')).toBe('Inizia');
    });
});
