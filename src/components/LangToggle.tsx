import { getLang, setLang, t } from '../i18n';
import { useLang } from '../i18n/useLang';
import { keepFocus } from './keepFocus';

export function LangToggle ({ className = '' }: { className?: string })
{
    const lang = useLang();
    const toggle = () => setLang(getLang() === 'it' ? 'en' : 'it');

    return (
        <button
            className={`lang-toggle ${lang} ${className}`}
            onClick={toggle}
            onMouseDown={keepFocus}
            title={t('lang.toggle')}
            aria-label={t('lang.toggle')}
        >
            <span className="lang-toggle-knob" aria-hidden="true" />
            <span className={`lang-toggle-label${lang === 'it' ? ' active' : ''}`}>IT</span>
            <span className={`lang-toggle-label${lang === 'en' ? ' active' : ''}`}>EN</span>
        </button>
    );
}
