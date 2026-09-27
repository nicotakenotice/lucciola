import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Rich } from './Rich';

const html = (text: string) => renderToStaticMarkup(<Rich text={text} />);

describe('<Rich>', () =>
{
    it('renders plain text as is', () =>
    {
        expect(html('Just words')).toBe('Just words');
    });

    it('renders bold and keyboard tags', () =>
    {
        expect(html('Press <kbd>Esc</kbd> to <b>pause</b>')).toBe('Press <kbd>Esc</kbd> to <b>pause</b>');
    });

    it('renders game terms as highlighted words with a color class', () =>
    {
        expect(html('Collect <pollen>pollen</pollen>!')).toBe('Collect <b class="c-pollen">pollen</b>!');
    });

    it('escapes anything that is not a known tag pattern', () =>
    {
        expect(html('a < b & <unclosed')).toBe('a &lt; b &amp; &lt;unclosed');
    });
});
