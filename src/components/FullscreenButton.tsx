import { t } from '../i18n';
import { useLang } from '../i18n/useLang';
import { useFullscreen } from '../hooks/useFullscreen';
import { FullscreenIcon } from './Icons';
import { keepFocus } from './keepFocus';

// Renders nothing where the browser has no Fullscreen API (e.g. iPhone Safari)
export function FullscreenButton ()
{
    useLang();
    const { supported, active, toggle } = useFullscreen();
    if (!supported) return null;

    const label = active ? t('fullscreen.exit') : t('fullscreen.enter');

    return (
        <button className="icon-button" onClick={toggle} onMouseDown={keepFocus} title={label} aria-label={label}>
            <FullscreenIcon active={active} />
        </button>
    );
}
