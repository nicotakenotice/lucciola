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

export function FullscreenIcon ({ active }: { active: boolean })
{
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {active
                ? <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />
                : <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />}
        </svg>
    );
}

export function RotateIcon ()
{
    return (
        <svg viewBox="0 0 64 64" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <rect x="22" y="8" width="20" height="34" rx="3" />
            <rect x="12" y="36" width="34" height="20" rx="3" opacity="0.5" />
            <path d="M50 22a14 14 0 0 1-4 14M46 36l0-6M46 36l6-1" />
        </svg>
    );
}

