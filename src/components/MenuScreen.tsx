import { loadBest } from '../game/constants';
import { SoundIcon } from './Icons';

interface IProps
{
    muted: boolean;
    touch: boolean;
    onStart: () => void;
    onToggleMute: () => void;
}

export function MenuScreen ({ muted, touch, onStart, onToggleMute }: IProps)
{
    const best = loadBest();

    return (
        <div className="overlay menu">
            <button className="icon-button corner" onClick={onToggleMute} data-audio-toggle title={muted ? 'Attiva audio (M)' : 'Silenzia (M)'}>
                <SoundIcon muted={muted} />
            </button>

            <h1 className="title">Lucciola</h1>
            <p className="subtitle">Una notte nel bosco. Una piccola luce.</p>

            <ul className="howto">
                {touch
                    ? <li><b>Tocca</b> lo schermo per muoverti</li>
                    : <li>Muoviti con il <b>mouse</b>, <b>WASD</b> o le <b>frecce</b></li>}
                <li>La tua luce si consuma: raccogli il <b className="c-pollen">polline</b> per nutrirla</li>
                <li>Le <b className="c-lost">lucciole smarrite</b> si uniranno a te e ti faranno da scudo</li>
                <li>
                    Le <b className="c-shadow">Ombre</b> temono la luce:{' '}
                    {touch ? <>il pulsante <b>Lampo</b> le dissolve</> : <><b>clic</b> o <b>SPAZIO</b> per un Lampo che le dissolve</>}
                </li>
                <li>La <b className="c-dew">rugiada lunare</b> ti dona lo Splendore. Sopravvivi fino all'alba</li>
            </ul>

            <button className="button primary" onClick={onStart}>Inizia</button>
            {!touch && <p className="hint">oppure premi SPAZIO · ESC per la pausa</p>}
            {best > 0 && <p className="best">Record: {best}</p>}
        </div>
    );
}
