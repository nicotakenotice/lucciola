import { t } from '../i18n';
import { useLang } from '../i18n/useLang';
import { RotateIcon } from './Icons';

export function RotateNotice ()
{
    useLang();

    return (
        <div className="rotate-notice" role="alert">
            <RotateIcon />
            <h2>{t('rotate.title')}</h2>
            <p>{t('rotate.text')}</p>
        </div>
    );
}
