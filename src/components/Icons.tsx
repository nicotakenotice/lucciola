// Icone SVG minime, colorate con currentColor

export function PauseIcon ()
{
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="6" y="5" width="4" height="14" rx="1.5" fill="currentColor" />
            <rect x="14" y="5" width="4" height="14" rx="1.5" fill="currentColor" />
        </svg>
    );
}

export function SoundIcon ({ muted }: { muted: boolean })
{
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" />
            {muted
                ? <path d="M16 9.5l5 5M21 9.5l-5 5" />
                : <path d="M16 9a4.5 4.5 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11" />}
        </svg>
    );
}
