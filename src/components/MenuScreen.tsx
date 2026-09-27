import { loadBest } from '../game/constants';
import { t } from '../i18n';
import { useLang } from '../i18n/useLang';
import { SoundIcon } from './Icons';
import { keepFocus } from './keepFocus';
import { LangToggle } from './LangToggle';
import { Rich } from './Rich';

interface IProps
{
    muted: boolean;
    touch: boolean;
    onStart: () => void;
    onToggleMute: () => void;
}

export function MenuScreen ({ muted, touch, onStart, onToggleMute }: IProps)
{
    useLang();

    const best = loadBest();
    const lines = [
        touch ? t('menu.move.touch') : t('menu.move.pointer'),
        t('menu.pollen'),
        t('menu.lost'),
        touch ? t('menu.shadows.touch') : t('menu.shadows.pointer'),
        t('menu.dew')
    ];

    return (
        <div className="overlay menu">
            <div className="menu-corner">
                <button className="icon-button" onClick={onToggleMute} onMouseDown={keepFocus} data-audio-toggle title={muted ? t('audio.unmute') : t('audio.mute')}>
                    <SoundIcon muted={muted} />
                </button>
                <LangToggle />
            </div>

            <h1 className="title">Lucciola</h1>
            <p className="subtitle">{t('menu.subtitle')}</p>

            <ul className="howto">
                {lines.map((line) => <li key={line}><Rich text={line} /></li>)}
            </ul>

            <button className="button primary" onClick={onStart}>{t('menu.start')}</button>
            {!touch && <p className="hint">{t('menu.startHint')}</p>}
            {best > 0 && <p className="best">{t('record', { n: best })}</p>}
        </div>
    );
}
