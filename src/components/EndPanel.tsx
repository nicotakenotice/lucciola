import type { GameEndResult } from '../game/events';

interface IProps
{
    result: GameEndResult;
    onRestart: () => void;
    onMenu: () => void;
}

export function EndPanel ({ result, onRestart, onMenu }: IProps)
{
    const dawn = result.kind === 'dawn';
    const { stats } = result;
    const rows: [ string, number ][] = [
        [ 'Polline raccolto', stats.pollen ],
        [ 'Lucciole salvate', stats.rescued ],
        [ 'Ombre dissolte', stats.dissolved ],
        [ 'Sciame massimo', stats.maxSwarm ],
        [ 'Lampi', stats.flashes ],
        [ 'Rugiade lunari', stats.dew ]
    ];

    return (
        <div className="overlay end">
            <div className={`panel${dawn ? ' dawn' : ''}`}>
                <h2>{dawn ? 'L\'alba!' : 'La tua luce si è spenta'}</h2>

                {dawn
                    ? <p>Hai attraversato la notte.<br />Bonus sciame e luce: <b>+{result.bonus}</b></p>
                    : <p>Hai resistito {result.seconds} secondi nel buio.</p>}

                <div className="final-score">{result.score}</div>
                <p className={`best${result.newRecord ? ' record' : ''}`}>{result.newRecord ? 'Nuovo record!' : `Record: ${result.best}`}</p>

                <dl className="stats">
                    {rows.map(([ label, value ]) => (
                        <div key={label}>
                            <dt>{label}</dt>
                            <dd>{value}</dd>
                        </div>
                    ))}
                </dl>

                <div className="actions">
                    <button className="button primary" onClick={onRestart}>Rigioca <kbd>Spazio</kbd></button>
                    <button className="button" onClick={onMenu}>Menu <kbd>Esc</kbd></button>
                </div>
            </div>
        </div>
    );
}
