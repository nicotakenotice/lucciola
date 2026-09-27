import { SoundIcon } from './Icons';

interface IProps
{
    muted: boolean;
    onResume: () => void;
    onRestart: () => void;
    onMenu: () => void;
    onToggleMute: () => void;
}

export function PausePanel ({ muted, onResume, onRestart, onMenu, onToggleMute }: IProps)
{
    return (
        <div className="overlay pause">
            <div className="panel">
                <h2>Pausa</h2>
                <p className="pause-hint">La notte ti aspetta.</p>

                <div className="actions vertical">
                    <button className="button primary" onClick={onResume}>Riprendi <kbd>Esc</kbd></button>
                    <button className="button" onClick={onRestart}>Ricomincia</button>
                    <button className="button" onClick={onMenu}>Menu</button>
                    <button className="button with-icon" onClick={onToggleMute} data-audio-toggle>
                        <SoundIcon muted={muted} />
                        {muted ? 'Audio disattivato' : 'Audio attivo'} <kbd>M</kbd>
                    </button>
                </div>
            </div>
        </div>
    );
}
