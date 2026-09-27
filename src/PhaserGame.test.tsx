import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { EventBus } from './game/EventBus';
import { Events } from './game/events';
import { PhaserGame } from './PhaserGame';

// Phaser needs a real canvas at import time; the bus only needs an emitter
vi.mock('phaser', async () => ({ Events: { EventEmitter: (await import('node:events')).EventEmitter } }));

const destroy = vi.fn();
const menu = { scene: { key: 'Menu' } } as Phaser.Scene;

// A scene that is ready while the game is still being created is the worst case for the listener
vi.mock('./game/main', () => ({
    default: () =>
    {
        EventBus.emit(Events.SceneReady, menu);

        return { destroy };
    }
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe('<PhaserGame>', () =>
{
    let root: ReturnType<typeof createRoot> | undefined;

    afterEach(() =>
    {
        act(() => root?.unmount());
    });

    it('reports a scene that becomes ready while the game boots', () =>
    {
        const onSceneReady = vi.fn();
        root = createRoot(document.createElement('div'));
        act(() => root!.render(<PhaserGame onSceneReady={onSceneReady} />));

        expect(onSceneReady).toHaveBeenCalledWith(menu);
    });

    it('stops listening and destroys the game on unmount', () =>
    {
        const onSceneReady = vi.fn();
        root = createRoot(document.createElement('div'));
        act(() => root!.render(<PhaserGame onSceneReady={onSceneReady} />));
        act(() => root!.unmount());
        root = undefined;

        EventBus.emit(Events.SceneReady, menu);
        expect(onSceneReady).toHaveBeenCalledTimes(1);
        expect(destroy).toHaveBeenCalledWith(true);
    });
});
