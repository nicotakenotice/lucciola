// Sound effects synthesized with WebAudio: no audio files to load.

import { readStorage, STORAGE_KEYS, writeStorage } from './storage';

const MASTER_VOLUME = 0.35;

let ctx: AudioContext | null = null;
let master: GainNode;
let noiseBuffer: AudioBuffer;
let muted = readStorage(STORAGE_KEYS.muted) === '1';

function ensure (): AudioContext | null
{
    if (!ctx)
    {
        const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AC) return null;

        ctx = new AC();
        master = ctx.createGain();
        master.gain.value = muted ? 0 : MASTER_VOLUME;
        master.connect(ctx.destination);

        noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }

    if (ctx.state === 'suspended') void ctx.resume();

    return ctx;
}

interface ToneOptions
{
    type?: OscillatorType;
    vol?: number;
    slide?: number;
    delay?: number;
    attack?: number;
}

function tone (freq: number, dur: number, { type = 'sine', vol = 0.2, slide = 0, delay = 0, attack = 0.005 }: ToneOptions = {})
{
    const c = ensure();
    if (!c) return;

    const t = c.currentTime + delay;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq * slide), t + dur);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(vol, t + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain).connect(master);
    osc.start(t);
    osc.stop(t + dur + 0.05);
}

interface NoiseOptions
{
    vol?: number;
    freq?: number;
    sweep?: number;
    q?: number;
    delay?: number;
}

function noise (dur: number, { vol = 0.2, freq = 1200, sweep = 0, q = 1, delay = 0 }: NoiseOptions = {})
{
    const c = ensure();
    if (!c) return;

    const t = c.currentTime + delay;
    const src = c.createBufferSource();
    src.buffer = noiseBuffer;
    const filter = c.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = q;
    filter.frequency.setValueAtTime(freq, t);
    if (sweep) filter.frequency.exponentialRampToValueAtTime(sweep, t + dur);
    const gain = c.createGain();
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter).connect(gain).connect(master);
    src.start(t);
    src.stop(t + dur + 0.05);
}

export function isMuted ()
{
    return muted;
}

export function setMuted (value: boolean)
{
    muted = value;
    writeStorage(STORAGE_KEYS.muted, value ? '1' : '0');
    if (ctx) master.gain.setTargetAtTime(value ? 0 : MASTER_VOLUME, ctx.currentTime, 0.05);
}

const semi = (base: number, n: number) => base * 2 ** (n / 12);
const PENTA = [ 0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24 ];

export const sfx = {
    unlock: ensure,

    start ()
    {
        [ 0, 7, 12, 19 ].forEach((n, i) => tone(semi(392, n), 0.6, { type: 'triangle', vol: 0.12, delay: i * 0.09 }));
    },

    // Pickups in quick succession climb a pentatonic scale
    pickup (step = 0)
    {
        const n = PENTA[Math.min(step, PENTA.length - 1)];
        tone(semi(784, n), 0.28, { vol: 0.14 });
        tone(semi(1568, n), 0.12, { type: 'triangle', vol: 0.04 });
    },

    join ()
    {
        [ 0, 4, 7, 12, 16 ].forEach((n, i) => tone(semi(523, n), 0.4, { type: 'triangle', vol: 0.12, delay: i * 0.06 }));
    },

    flash ()
    {
        noise(0.7, { vol: 0.22, freq: 4000, sweep: 300, q: 0.7 });
        tone(180, 0.6, { vol: 0.18, slide: 4 });
    },

    fizzle ()
    {
        tone(220, 0.15, { type: 'square', vol: 0.05, slide: 0.6 });
    },

    kill ()
    {
        noise(0.35, { vol: 0.1, freq: 900, sweep: 200 });
        tone(140, 0.35, { type: 'sawtooth', vol: 0.04, slide: 0.4 });
    },

    hurt ()
    {
        tone(110, 0.45, { type: 'square', vol: 0.1, slide: 0.45 });
        noise(0.35, { vol: 0.25, freq: 350 });
    },

    lose ()
    {
        [ 12, 7, 3 ].forEach((n, i) => tone(semi(523, n), 0.3, { type: 'triangle', vol: 0.1, delay: i * 0.08 }));
    },

    gulp ()
    {
        tone(300, 0.2, { vol: 0.08, slide: 0.3 });
    },

    heartbeat ()
    {
        tone(62, 0.16, { vol: 0.35 });
        tone(55, 0.18, { vol: 0.25, delay: 0.2 });
    },

    chirp ()
    {
        const f = 3800 + Math.random() * 900;
        const n = 3 + Math.floor(Math.random() * 3);
        for (let i = 0; i < n; i++) tone(f, 0.04, { type: 'triangle', vol: 0.012, delay: i * 0.07 });
    },

    gameOver ()
    {
        [ 7, 3, 0, -5 ].forEach((n, i) => tone(semi(330, n), 0.9, { type: 'triangle', vol: 0.12, delay: i * 0.28 }));
    },

    dew ()
    {
        [ 0, 7, 12, 16, 19, 24, 28 ].forEach((n, i) => tone(semi(659, n), 0.7, { vol: 0.08, delay: i * 0.045 }));
        noise(0.9, { vol: 0.05, freq: 7000, sweep: 12000, q: 2 });
    },

    splendorEnd ()
    {
        [ 12, 7, 0 ].forEach((n, i) => tone(semi(659, n), 0.35, { vol: 0.06, delay: i * 0.07 }));
    },

    wave ()
    {
        tone(48, 1.8, { type: 'sawtooth', vol: 0.14, slide: 0.7, attack: 0.4 });
        tone(51, 1.8, { type: 'sawtooth', vol: 0.1, slide: 0.7, attack: 0.4 });
        noise(1.6, { vol: 0.12, freq: 180, sweep: 90 });
    },

    colossus ()
    {
        tone(38, 2.2, { type: 'sawtooth', vol: 0.16, slide: 1.3, attack: 0.6 });
        tone(57, 2.2, { type: 'triangle', vol: 0.1, slide: 0.8, attack: 0.6 });
    },

    resist ()
    {
        tone(70, 0.5, { type: 'square', vol: 0.08, slide: 0.6 });
        noise(0.4, { vol: 0.12, freq: 500, sweep: 150 });
    },

    moth ()
    {
        for (let i = 0; i < 6; i++) noise(0.05, { vol: 0.05, freq: 1400, q: 3, delay: i * 0.045 });
    },

    dawn ()
    {
        [ 0, 4, 7, 11, 14, 19, 24 ].forEach((n, i) => tone(semi(392, n), 1.2, { vol: 0.12, delay: i * 0.13 }));
    }
};

// ---------------------------------------------------------------- music

// Generative ambient music: a breathing drone, a D minor pad and pentatonic bells
// with echo. Tension (0..1) opens the filter and adds a low heartbeat.
const D_MINOR_PENTA = [ 0, 3, 5, 7, 10, 12, 15, 17, 19, 22 ];
const MUSIC_LEVEL = 0.8;
const MUSIC_DUCKED = 0.3;
const DRONE_CUTOFF = 480;

export function audioReady ()
{
    return !!ctx && ctx.state === 'running';
}

class Music
{
    private started = false;
    private bus: GainNode;
    private droneFilter: BiquadFilterNode;
    private pulseGain: GainNode;
    private delayIn: GainNode;
    private tension = 0;
    private ducked = false;

    start ()
    {
        const c = ensure();
        if (!c || this.started) return;
        this.started = true;

        this.bus = c.createGain();
        this.bus.gain.value = 0;
        this.bus.gain.setTargetAtTime(MUSIC_LEVEL, c.currentTime, 1.2);
        this.bus.connect(master);

        // Echo: a delay with filtered feedback gives the bells some depth
        const delay = c.createDelay(1.5);
        delay.delayTime.value = 0.46;
        const feedback = c.createGain();
        feedback.gain.value = 0.42;
        const damp = c.createBiquadFilter();
        damp.type = 'lowpass';
        damp.frequency.value = 2200;
        this.delayIn = c.createGain();
        this.delayIn.connect(delay);
        delay.connect(damp).connect(feedback).connect(delay);
        damp.connect(this.bus);

        // Drone: low D and A, slightly detuned, through a slowly swaying low-pass filter
        this.droneFilter = c.createBiquadFilter();
        this.droneFilter.type = 'lowpass';
        this.droneFilter.frequency.value = DRONE_CUTOFF;
        this.droneFilter.Q.value = 2;
        const droneGain = c.createGain();
        droneGain.gain.value = 0.11;
        this.droneFilter.connect(droneGain).connect(this.bus);

        [ 73.42, 73.9, 110 ].forEach((f, i) =>
        {
            const osc = c.createOscillator();
            osc.type = i === 1 ? 'triangle' : 'sawtooth';
            osc.frequency.value = f;
            const g = c.createGain();
            g.gain.value = 0.5;
            osc.connect(g).connect(this.droneFilter);
            osc.start();
        });

        const lfo = c.createOscillator();
        lfo.frequency.value = 0.07;
        const lfoDepth = c.createGain();
        lfoDepth.gain.value = 160;
        lfo.connect(lfoDepth).connect(this.droneFilter.frequency);
        lfo.start();

        // Mid-register pad (D-F-A): the part that is audible even on small speakers.
        // Each voice swells and recedes with its own slow breath.
        const padFilter = c.createBiquadFilter();
        padFilter.type = 'lowpass';
        padFilter.frequency.value = 1600;
        padFilter.connect(this.bus);

        [ 293.66, 349.23, 440, 587.33 ].forEach((f, i) =>
        {
            const osc = c.createOscillator();
            osc.type = 'triangle';
            osc.frequency.value = f;
            osc.detune.value = (i - 1.5) * 4;
            const voice = c.createGain();
            voice.gain.value = 0.03;
            const breath = c.createOscillator();
            breath.frequency.value = 0.05 + i * 0.023;
            const breathDepth = c.createGain();
            breathDepth.gain.value = 0.025;
            breath.connect(breathDepth).connect(voice.gain);
            osc.connect(voice).connect(padFilter);
            osc.start();
            breath.start();
        });

        // Low heartbeat, audible only when tension rises
        const pulse = c.createOscillator();
        pulse.type = 'sawtooth';
        pulse.frequency.value = 55;
        const pulseFilter = c.createBiquadFilter();
        pulseFilter.type = 'lowpass';
        pulseFilter.frequency.value = 380;
        const pulseLfo = c.createOscillator();
        pulseLfo.type = 'square';
        pulseLfo.frequency.value = 1.6;
        const pulseLfoDepth = c.createGain();
        pulseLfoDepth.gain.value = 0.5;
        this.pulseGain = c.createGain();
        this.pulseGain.gain.value = 0;
        const pulseAmp = c.createGain();
        pulseAmp.gain.value = 0.5;
        pulseLfo.connect(pulseLfoDepth).connect(pulseAmp.gain);
        pulse.connect(pulseFilter).connect(pulseAmp).connect(this.pulseGain).connect(this.bus);
        pulse.start();
        pulseLfo.start();

        // The first bell plays right away, so it is clear the music has started
        window.setTimeout(() => this.bell(), 500);
        this.scheduleBell();
    }

    setTension (value: number)
    {
        if (!ctx || !this.started) return;
        const t = Math.max(0, Math.min(1, value));
        if (Math.abs(t - this.tension) < 0.02) return;
        this.tension = t;
        this.droneFilter.frequency.setTargetAtTime(DRONE_CUTOFF + t * 800, ctx.currentTime, 0.6);
        this.pulseGain.gain.setTargetAtTime(t * 0.25, ctx.currentTime, 0.4);
    }

    setDucked (value: boolean)
    {
        if (!ctx || !this.started || value === this.ducked) return;
        this.ducked = value;
        this.bus.gain.setTargetAtTime(value ? MUSIC_DUCKED : MUSIC_LEVEL, ctx.currentTime, 0.3);
    }

    private scheduleBell ()
    {
        // With high tension the notes get sparser and the heartbeat takes over
        const wait = 1600 + Math.random() * 2800 + this.tension * 3000;
        window.setTimeout(() =>
        {
            this.bell();
            this.scheduleBell();
        }, wait);
    }

    private bell ()
    {
        const c = ctx;
        if (!c || c.state !== 'running') return;

        const notes = 1 + Math.floor(Math.random() * 3);
        for (let i = 0; i < notes; i++)
        {
            const n = D_MINOR_PENTA[Math.floor(Math.random() * D_MINOR_PENTA.length)];
            const t = c.currentTime + i * (0.25 + Math.random() * 0.35);
            const osc = c.createOscillator();
            osc.frequency.value = semi(587.33, n - 12);
            const g = c.createGain();
            g.gain.setValueAtTime(0.0001, t);
            g.gain.exponentialRampToValueAtTime(0.13, t + 0.01);
            g.gain.exponentialRampToValueAtTime(0.0001, t + 2.6);
            osc.connect(g);
            g.connect(this.bus);
            g.connect(this.delayIn);
            osc.start(t);
            osc.stop(t + 2.7);
        }
    }
}

export const music = new Music();
