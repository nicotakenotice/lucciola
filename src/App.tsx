import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { PhaserGame } from './PhaserGame';
import { EventBus } from './game/EventBus';
import { Events, GameEndResult, Hint, HudState } from './game/events';
import { audioReady, isMuted, music, setMuted, sfx } from './audio';
import { MenuScreen } from './components/MenuScreen';
import { Hud } from './components/Hud';
import { EndPanel } from './components/EndPanel';
import { PausePanel } from './components/PausePanel';
import { Toast } from './components/Toast';
import { RotateNotice } from './components/RotateNotice';
import { usePortrait, useTouch } from './hooks/useMediaQuery';
import { useAudioUnlock } from './hooks/useAudioUnlock';
import { useAutoPause } from './hooks/useAutoPause';

// 'transition' covers scene changes, so commands are not triggered twice
type Screen = 'loading' | 'menu' | 'game' | 'paused' | 'end' | 'transition';

function App ()
{
    const [ screen, setScreen ] = useState<Screen>('loading');
    const [ hud, setHud ] = useState<HudState | null>(null);
    const [ result, setResult ] = useState<GameEndResult | null>(null);
    const [ hint, setHint ] = useState<(Hint & { id: number }) | null>(null);
    const [ muted, setMutedState ] = useState(isMuted);
    const touch = useTouch();
    const portrait = usePortrait();

    const onSceneReady = useCallback((scene: Phaser.Scene) =>
    {
        const key = scene.scene.key;
        if (key !== 'Menu' && key !== 'Game') return;

        setResult(null);
        setHint(null);
        setScreen(key === 'Menu' ? 'menu' : 'game');
    }, []);

    useEffect(() =>
    {
        const onHud = (state: HudState) => setHud(state);
        const onEnd = (res: GameEndResult) =>
        {
            setResult(res);
            setScreen('end');
        };
        const onPaused = (paused: boolean) =>
        {
            music.setDucked(paused);
            setScreen(paused ? 'paused' : 'game');
        };
        const onHint = (h: Hint) => setHint({ ...h, id: Date.now() });

        return EventBus.subscribe({
            [Events.Hud]: onHud,
            [Events.GameEnd]: onEnd,
            [Events.Paused]: onPaused,
            [Events.Hint]: onHint
        });
    }, []);

    const start = useCallback(() =>
    {
        sfx.unlock();
        sfx.start();
        music.start();
        setScreen('transition');
        EventBus.emit(Events.UiStart);
    }, []);

    const restart = useCallback(() =>
    {
        music.setDucked(false);
        sfx.unlock();
        setScreen('transition');
        EventBus.emit(Events.UiRestart);
    }, []);

    const toMenu = useCallback(() =>
    {
        music.setDucked(false);
        setScreen('transition');
        EventBus.emit(Events.UiMenu);
    }, []);

    const toggleMute = useCallback(() =>
    {
        // If audio has not started yet (the browser waits for a gesture) and it was not muted,
        // the first click starts it instead of muting it
        const wasRunning = audioReady();
        sfx.unlock();
        music.start();
        if (wasRunning || isMuted()) setMuted(!isMuted());
        setMutedState(isMuted());
    }, []);

    const flash = useCallback(() => EventBus.emit(Events.UiFlash), []);
    const pause = useCallback(() => EventBus.emit(Events.UiPause), []);
    const resume = useCallback(() => EventBus.emit(Events.UiResume), []);

    useAudioUnlock();
    useAutoPause(screen === 'game', portrait, pause);

    // The key handler reads the screen from a ref synced before paint: re-subscribing on every screen
    // change left a gap where a panel was visible but its keys were not handled yet
    const screenRef = useRef(screen);
    useLayoutEffect(() =>
    {
        screenRef.current = screen;
    }, [ screen ]);

    useEffect(() =>
    {
        const onKey = (e: KeyboardEvent) =>
        {
            if (e.repeat) return;

            const current = screenRef.current;
            const confirm = e.code === 'Space' || e.code === 'Enter';
            const togglePause = e.code === 'Escape' || e.code === 'KeyP';

            if (e.code === 'KeyM') toggleMute();
            else if (current === 'game' && togglePause) pause();
            else if (current === 'paused' && togglePause) resume();
            else if (current === 'menu' && confirm) start();
            else if (current === 'end' && confirm) restart();
            else if (current === 'end' && e.code === 'Escape') toMenu();
        };
        window.addEventListener('keydown', onKey);

        return () => window.removeEventListener('keydown', onKey);
    }, [ start, restart, toMenu, pause, resume, toggleMute ]);

    return (
        <div id="app">
            <div className="stage">
                <PhaserGame onSceneReady={onSceneReady} />
                {screen === 'menu' && <MenuScreen muted={muted} touch={touch} onStart={start} onToggleMute={toggleMute} />}
                {(screen === 'game' || screen === 'paused' || screen === 'end') && hud && (
                    <Hud hud={hud} muted={muted} touch={touch} onPause={pause} onToggleMute={toggleMute} onFlash={flash} />
                )}
                {screen === 'game' && hint && <Toast hint={hint} />}
                {screen === 'paused' && (
                    <PausePanel muted={muted} touch={touch} onResume={resume} onRestart={restart} onMenu={toMenu} onToggleMute={toggleMute} />
                )}
                {screen === 'end' && result && <EndPanel result={result} touch={touch} onRestart={restart} onMenu={toMenu} />}
            </div>
            {portrait && <RotateNotice />}
        </div>
    );
}

export default App;
