import { t } from '../i18n';
import { useLang } from '../i18n/useLang';
import { SoundIcon } from './Icons';
import { LangToggle } from './LangToggle';

interface IProps
{
    muted: boolean;
    touch: boolean;
    onResume: () => void;
    onRestart: () => void;
    onMenu: () => void;
    onToggleMute: () => void;
}

export function PausePanel ({ muted, touch, onResume, onRestart, onMenu, onToggleMute }: IProps)
{
    useLang();

    return (
        <div className="overlay pause">
            <div className="panel">
                <h2>{t('pause.title')}</h2>
                <p className="pause-hint">{t('pause.subtitle')}</p>

                <div className="actions vertical">
                    <button className="button primary" onClick={onResume}>{t('pause.resume')} {!touch && <kbd>{t('key.esc')}</kbd>}</button>
                    <button className="button" onClick={onRestart}>{t('pause.restart')}</button>
                    <button className="button" onClick={onMenu}>{t('pause.menu')}</button>
                    <button className="button with-icon" onClick={onToggleMute} data-audio-toggle>
                        <SoundIcon muted={muted} />
                        {muted ? t('audio.off') : t('audio.on')} {!touch && <kbd>M</kbd>}
                    </button>
                </div>

                <LangToggle className="in-panel" />
            </div>
        </div>
    );
}
