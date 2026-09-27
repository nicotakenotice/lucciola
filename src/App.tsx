import { useCallback, useEffect, useRef, useState } from 'react';
import { IRefPhaserGame, PhaserGame } from './PhaserGame';
import { EventBus } from './game/EventBus';
import { Events, GameEndResult, Hint, HudState } from './game/events';
import { audioReady, isMuted, music, setMuted, sfx } from './game/audio';
import { MenuScreen } from './components/MenuScreen';
import { Hud } from './components/Hud';
import { EndPanel } from './components/EndPanel';
import { PausePanel } from './components/PausePanel';
import { Toast } from './components/Toast';

// 'transition' copre i cambi di scena, così i comandi non partono due volte
type Screen = 'loading' | 'menu' | 'game' | 'paused' | 'end' | 'transition';

function App()
{
    //  References to the PhaserGame component (game and scene are exposed)
    const phaserRef = useRef<IRefPhaserGame | null>(null);

    const [screen, setScreen] = useState<Screen>('loading');
    const [hud, setHud] = useState<HudState | null>(null);
    const [result, setResult] = useState<GameEndResult | null>(null);
    const [hint, setHint] = useState<(Hint & { id: number }) | null>(null);
    const [muted, setMutedState] = useState(isMuted);
    const [touch] = useState(() => window.matchMedia('(pointer: coarse)').matches);

    // Event emitted from the PhaserGame component
    const currentScene = useCallback((scene: Phaser.Scene) => {

        const key = scene.scene.key;

        if (key === 'Menu' || key === 'Game')
        {
            setResult(null);
            setHint(null);
            setScreen(key === 'Menu' ? 'menu' : 'game');
        }

    }, []);

    useEffect(() => {

        const onHud = (state: HudState) => setHud(state);
        const onEnd = (res: GameEndResult) => {
            setResult(res);
            setScreen('end');
        };
        const onPaused = (paused: boolean) => {
            music.setDucked(paused);
            setScreen(paused ? 'paused' : 'game');
        };
        const onHint = (h: Hint) => setHint({ ...h, id: Date.now() });

        EventBus.on(Events.Hud, onHud);
        EventBus.on(Events.GameEnd, onEnd);
        EventBus.on(Events.Paused, onPaused);
        EventBus.on(Events.Hint, onHint);

        return () => {
            EventBus.off(Events.Hud, onHud);
            EventBus.off(Events.GameEnd, onEnd);
            EventBus.off(Events.Paused, onPaused);
            EventBus.off(Events.Hint, onHint);
        };

    }, []);

    const start = useCallback(() => {

        // Il primo gesto dell'utente sblocca l'audio del browser
        sfx.unlock();
        sfx.start();
        music.start();
        setScreen('transition');
        EventBus.emit(Events.UiStart);

    }, []);

    const restart = useCallback(() => {

        music.setDucked(false);
        sfx.unlock();
        setScreen('transition');
        EventBus.emit(Events.UiRestart);

    }, []);

    const toMenu = useCallback(() => {

        music.setDucked(false);
        setScreen('transition');
        EventBus.emit(Events.UiMenu);

    }, []);

    const toggleMute = useCallback(() => {

        // Se l'audio non è ancora partito (il browser aspetta un gesto) e non era silenziato,
        // il primo clic lo avvia invece di spegnerlo
        const wasRunning = audioReady();
        sfx.unlock();
        music.start();
        if (wasRunning || isMuted()) setMuted(!isMuted());
        setMutedState(isMuted());

    }, []);

    // I browser avviano l'audio solo dopo un gesto: la musica parte al primo clic o tasto,
    // già nel menu. Il pulsante audio gestisce da sé il proprio clic.
    useEffect(() => {

        const unlock = (e: Event) => {
            if (e.target instanceof Element && e.target.closest('[data-audio-toggle]')) return;
            if (e instanceof KeyboardEvent && e.code === 'KeyM') return;
            sfx.unlock();
            music.start();
            window.removeEventListener('pointerdown', unlock);
            window.removeEventListener('keydown', unlock);
        };

        window.addEventListener('pointerdown', unlock);
        window.addEventListener('keydown', unlock);

        return () => {
            window.removeEventListener('pointerdown', unlock);
            window.removeEventListener('keydown', unlock);
        };

    }, []);

    const flash = useCallback(() => EventBus.emit(Events.UiFlash), []);

    const pause = useCallback(() => EventBus.emit(Events.UiPause), []);
    const resume = useCallback(() => EventBus.emit(Events.UiResume), []);

    useEffect(() => {

        const onKey = (e: KeyboardEvent) => {

            if (e.repeat) return;

            const confirm = e.code === 'Space' || e.code === 'Enter';
            const togglePause = e.code === 'Escape' || e.code === 'KeyP';

            if (e.code === 'KeyM')
            {
                toggleMute();
            }
            else if (screen === 'game' && togglePause)
            {
                pause();
            }
            else if (screen === 'paused' && togglePause)
            {
                resume();
            }
            else if (screen === 'menu' && confirm)
            {
                start();
            }
            else if (screen === 'end' && confirm)
            {
                restart();
            }
            else if (screen === 'end' && e.code === 'Escape')
            {
                toMenu();
            }

        };

        window.addEventListener('keydown', onKey);

        return () => window.removeEventListener('keydown', onKey);

    }, [ screen, start, restart, toMenu, pause, resume, toggleMute ]);

    // Pausa automatica se la finestra perde il focus o la scheda viene nascosta
    useEffect(() => {

        if (screen !== 'game') return;

        const onVisibility = () => {
            if (document.hidden) pause();
        };

        window.addEventListener('blur', pause);
        document.addEventListener('visibilitychange', onVisibility);

        return () => {
            window.removeEventListener('blur', pause);
            document.removeEventListener('visibilitychange', onVisibility);
        };

    }, [ screen, pause ]);

    return (
        <div id="app">
            <div className="stage">
                <PhaserGame ref={phaserRef} currentActiveScene={currentScene} />
                {screen === 'menu' && <MenuScreen muted={muted} touch={touch} onStart={start} onToggleMute={toggleMute} />}
                {(screen === 'game' || screen === 'paused' || screen === 'end') && hud && (
                    <Hud hud={hud} muted={muted} touch={touch} onPause={pause} onToggleMute={toggleMute} onFlash={flash} />
                )}
                {screen === 'game' && hint && <Toast hint={hint} />}
                {screen === 'paused' && (
                    <PausePanel muted={muted} onResume={resume} onRestart={restart} onMenu={toMenu} onToggleMute={toggleMute} />
                )}
                {screen === 'end' && result && <EndPanel result={result} onRestart={restart} onMenu={toMenu} />}
            </div>
        </div>
    )
}

export default App
