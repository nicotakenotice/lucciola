import { LANGS, setLang, t } from '../i18n';
import { useLang } from '../i18n/useLang';

export function LangSwitch ({ className = '' }: { className?: string })
{
    const lang = useLang();

    return (
        <div className={`lang-switch ${className}`} role="group" aria-label={t('lang.label')}>
            {LANGS.map((code) => (
                <button
                    key={code}
                    className={code === lang ? 'active' : ''}
                    aria-pressed={code === lang}
                    onClick={() => setLang(code)}
                >
                    {code.toUpperCase()}
                </button>
            ))}
        </div>
    );
}
