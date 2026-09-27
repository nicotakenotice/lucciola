import type { MouseEvent } from 'react';

// I controlli piccoli (audio, lingua, pausa) non prendono il fuoco al clic del mouse:
// altrimenti SPAZIO, che nel gioco avvia la partita o lancia il Lampo, li "ricliccherebbe".
// Con la tastiera (Tab) restano comunque raggiungibili.
export const keepFocus = (e: MouseEvent) => e.preventDefault();
