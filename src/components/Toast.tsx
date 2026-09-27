import type { Hint } from '../game/events';

interface IProps
{
    hint: Hint & { id: number };
    onDone: () => void;
}

// Temporary hint: keying on the id restarts the animation for every new message, and the hint is
// dropped when its animation ends so a pause or remount never replays an old one
export function Toast ({ hint, onDone }: IProps)
{
    return (
        <div className="overlay toast-layer">
            <div key={hint.id} className={`toast ${hint.tone}`} onAnimationEnd={onDone}>{hint.text}</div>
        </div>
    );
}
