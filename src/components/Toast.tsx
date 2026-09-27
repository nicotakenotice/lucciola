import type { Hint } from '../game/events';

interface IProps
{
    hint: Hint & { id: number };
}

// Suggerimento temporaneo: la key sull'id fa ripartire l'animazione a ogni nuovo messaggio
export function Toast ({ hint }: IProps)
{
    return (
        <div className="overlay toast-layer">
            <div key={hint.id} className={`toast ${hint.tone}`}>{hint.text}</div>
        </div>
    );
}
