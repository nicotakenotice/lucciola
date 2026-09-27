import { Fragment, ReactNode } from 'react';

// Rende un testo tradotto con qualche tag semplice (<b>, <kbd>, <pollen>…):
// così le traduzioni restano stringhe, ma possono evidenziare parole chiave.
const TAG = /<(\w+)>(.*?)<\/\1>/g;

export function Rich ({ text }: { text: string })
{
    const parts: ReactNode[] = [];
    let last = 0;

    for (const match of text.matchAll(TAG))
    {
        const [ whole, tag, inner ] = match;
        const index = match.index ?? 0;
        if (index > last) parts.push(text.slice(last, index));
        if (tag === 'kbd') parts.push(<kbd key={index}>{inner}</kbd>);
        else if (tag === 'b') parts.push(<b key={index}>{inner}</b>);
        else parts.push(<b key={index} className={`c-${tag}`}>{inner}</b>);
        last = index + whole.length;
    }
    if (last < text.length) parts.push(text.slice(last));

    return <Fragment>{parts}</Fragment>;
}
