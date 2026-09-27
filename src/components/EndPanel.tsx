import type { GameEndResult, GameStats } from '../game/events';
import { MessageKey, t } from '../i18n';
import { useLang } from '../i18n/useLang';
import { Rich } from './Rich';

interface IProps
{
    result: GameEndResult;
    touch: boolean;
    onRestart: () => void;
    onMenu: () => void;
}

const STAT_LABELS: [ keyof GameStats, MessageKey ][] = [
    [ 'pollen', 'stats.pollen' ],
    [ 'rescued', 'stats.rescued' ],
    [ 'dissolved', 'stats.dissolved' ],
    [ 'maxSwarm', 'stats.maxSwarm' ],
    [ 'flashes', 'stats.flashes' ],
    [ 'dew', 'stats.dew' ]
];

export function EndPanel ({ result, touch, onRestart, onMenu }: IProps)
{
    useLang();

    const dawn = result.kind === 'dawn';

    return (
        <div className="overlay end">
            <div className={`panel${dawn ? ' dawn' : ''}`}>
                <h2>{dawn ? t('end.dawnTitle') : t('end.overTitle')}</h2>

                {dawn
                    ? <p>{t('end.dawnText')}<br /><Rich text={t('end.bonus', { n: result.bonus })} /></p>
                    : <p>{t('end.overText', { n: result.seconds })}</p>}

                <div className="final-score">{result.score}</div>
                <p className={`best${result.newRecord ? ' record' : ''}`}>
                    {result.newRecord ? t('end.newRecord') : t('record', { n: result.best })}
                </p>

                <dl className="stats">
                    {STAT_LABELS.map(([ stat, label ]) => (
                        <div key={stat}>
                            <dt>{t(label)}</dt>
                            <dd>{result.stats[stat]}</dd>
                        </div>
                    ))}
                </dl>

                <div className="actions">
                    <button className="button primary" onClick={onRestart}>{t('end.again')} {!touch && <kbd>{t('key.space')}</kbd>}</button>
                    <button className="button" onClick={onMenu}>{t('end.menu')} {!touch && <kbd>{t('key.esc')}</kbd>}</button>
                </div>
            </div>
        </div>
    );
}
