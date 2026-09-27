import type { HudState } from '../game/events';
import { t } from '../i18n';
import { useLang } from '../i18n/useLang';
import { PauseIcon, SoundIcon } from './Icons';
import { keepFocus } from './keepFocus';
import { Rich } from './Rich';

interface IProps
{
    hud: HudState;
    muted: boolean;
    touch: boolean;
    onPause: () => void;
    onToggleMute: () => void;
    onFlash: () => void;
}

export function Hud ({ hud, muted, touch, onPause, onToggleMute, onFlash }: IProps)
{
    useLang();

    const minutes = Math.floor(hud.secondsToDawn / 60);
    const seconds = String(hud.secondsToDawn % 60).padStart(2, '0');
    const danger = hud.alive && hud.energy < 25;

    return (
        <div className="overlay hud">
            <div className={`vignette${danger ? ' danger' : ''}${hud.splendor > 0 ? ' splendor' : ''}`} />

            <div className="hud-left">
                <div className="label">{t('hud.light')}</div>
                <div className="bar-row">
                    <div className={`bar${danger ? ' low' : ''}${hud.splendor > 0 ? ' shining' : ''}`}>
                        <div className="bar-fill" style={{ width: `${hud.energy}%` }} />
                        <div className="bar-mark" style={{ left: `${hud.flashMin}%` }} />
                    </div>
                    <div className={`flash-dot${hud.flashReady ? ' ready' : ''}`} title={t('hud.flash')} />
                </div>

                {hud.splendor > 0 && (
                    <div className="splendor">
                        <span>{t('hud.splendor')}</span>
                        <div className="splendor-track">
                            <div className="splendor-fill" style={{ width: `${hud.splendor * 100}%` }} />
                        </div>
                    </div>
                )}

                <div className="label">{t('hud.swarm')}</div>
                <div className="swarm">
                    {Array.from({ length: hud.maxFollowers }, (_, i) => (
                        <span key={i} className={i < hud.followers ? 'on' : ''} />
                    ))}
                </div>
            </div>

            <div className="hud-center">
                <div className="dawn-label">{hud.dawn ? t('hud.dawn') : t('hud.dawnIn', { time: `${minutes}:${seconds}` })}</div>
                <div className="night">
                    <span className="moon" />
                    <div className="night-track">
                        <div className="night-fill" style={{ width: `${hud.nightProgress * 100}%` }} />
                    </div>
                    <span className="sun" />
                </div>
            </div>

            <div className="hud-right">
                <div className="hud-score">{hud.score}</div>
                {hud.combo > 1 && <div key={hud.combo} className="combo">{t('hud.combo', { n: hud.combo })}</div>}
                <div className="hud-buttons">
                    <button className="icon-button" onClick={onToggleMute} onMouseDown={keepFocus} data-audio-toggle title={muted ? t('audio.unmute') : t('audio.mute')}>
                        <SoundIcon muted={muted} />
                    </button>
                    <button className="icon-button" onClick={onPause} onMouseDown={keepFocus} title={t('hud.pause')}>
                        <PauseIcon />
                    </button>
                </div>
            </div>

            <div className="intro">{t('hud.intro')}</div>

            {touch
                ? <button className={`touch-flash${hud.flashReady ? ' ready' : ''}`} onPointerDown={onFlash}>{t('hud.flash')}</button>
                : <div className="hud-hint"><Rich text={t('hud.keys')} /></div>}
        </div>
    );
}
