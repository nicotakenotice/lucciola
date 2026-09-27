import type { Hint } from '../game/events';

interface IProps
{
    hint: Hint & { id: number };
}

// Temporary hint: keying on the id restarts the animation for every new message
export function Toast ({ hint }: IProps)
{
    return (
        <div className="overlay toast-layer">
            <div key={hint.id} className={`toast ${hint.tone}`}>{hint.text}</div>
        </div>
    );
}
