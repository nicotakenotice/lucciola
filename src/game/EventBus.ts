import { Events as PhaserEvents } from 'phaser';
import type { EventMap } from './events';

type EventName = keyof EventMap;
type Handler<K extends EventName> = (payload: EventMap[K]) => void;
type Payload<K extends EventName> = EventMap[K] extends void ? [] : [ EventMap[K] ];
export type Handlers = { [K in EventName]?: Handler<K> };

const emitter = new PhaserEvents.EventEmitter();

// Typed facade over Phaser's emitter, used between React components and Phaser scenes:
// every event name has exactly one payload type (see EventMap)
export const EventBus = {
    on<K extends EventName> (event: K, handler: Handler<K>)
    {
        emitter.on(event, handler);
    },

    once<K extends EventName> (event: K, handler: Handler<K>)
    {
        emitter.once(event, handler);
    },

    off<K extends EventName> (event: K, handler: Handler<K>)
    {
        emitter.off(event, handler);
    },

    emit<K extends EventName> (event: K, ...payload: Payload<K>)
    {
        emitter.emit(event, ...payload);
    },

    // Registers several handlers and returns the function that removes them all
    subscribe (handlers: Handlers): () => void
    {
        const entries = Object.entries(handlers) as [ EventName, (payload: unknown) => void ][];
        entries.forEach(([ event, handler ]) => emitter.on(event, handler));

        return () => entries.forEach(([ event, handler ]) => emitter.off(event, handler));
    }
};
