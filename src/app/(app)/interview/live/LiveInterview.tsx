"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Mic, Video, VideoOff, MicOff, Loader2, PhoneOff, Radio, AlertTriangle, ArrowLeft, Volume2 } from "lucide-react";
import { buildLiveConfig, INTERVIEWER_VOICE } from "@/lib/interview/liveConfig";
import { cn } from "@/lib/utils";

type Status = "idle" | "connecting" | "live" | "ended" | "error";
type Line = { who: "ai" | "you"; text: string };

// ───────────────────────── audio helpers ─────────────────────────
/** Float32 (any sample rate) → 16-bit PCM Int16 at 16 kHz (Gemini input format). */
function downsampleToPCM16(input: Float32Array, inRate: number, outRate = 16000): Int16Array {
    if (inRate === outRate) {
        const out = new Int16Array(input.length);
        for (let i = 0; i < input.length; i++) {
            const s = Math.max(-1, Math.min(1, input[i]));
            out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }
        return out;
    }
    const ratio = inRate / outRate;
    const newLen = Math.round(input.length / ratio);
    const out = new Int16Array(newLen);
    for (let i = 0; i < newLen; i++) {
        const s = Math.max(-1, Math.min(1, input[Math.round(i * ratio)] || 0));
        out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return out;
}

function bytesToBase64(buf: ArrayBufferLike): string {
    const bytes = new Uint8Array(buf);
    let binary = "";
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
        binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)));
    }
    return btoa(binary);
}

function base64ToBytes(b64: string): Uint8Array {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
}

export default function LiveInterview() {
    const [status, setStatus] = useState<Status>("idle");
    const [error, setError] = useState<string | null>(null);
    const [lines, setLines] = useState<Line[]>([]);
    const [aiSpeaking, setAiSpeaking] = useState(false);
    const [elapsed, setElapsed] = useState(0);
    const [camOn, setCamOn] = useState(true);
    const [micOn, setMicOn] = useState(true);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const transcriptEndRef = useRef<HTMLDivElement>(null);

    const sessionRef = useRef<any>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const inCtxRef = useRef<AudioContext | null>(null);
    const outCtxRef = useRef<AudioContext | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const frameTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const tickTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const nextStartRef = useRef(0);
    const playingRef = useRef<AudioBufferSourceNode[]>([]);
    const partialRef = useRef<{ you: string; ai: string }>({ you: "", ai: "" });

    // Auto-scroll captions
    useEffect(() => {
        transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [lines]);

    const stopPlayback = useCallback(() => {
        playingRef.current.forEach((s) => {
            try { s.stop(); } catch { /* already stopped */ }
        });
        playingRef.current = [];
        nextStartRef.current = 0;
        setAiSpeaking(false);
    }, []);

    const enqueueAudio = useCallback((b64: string) => {
        const ctx = outCtxRef.current;
        if (!ctx) return;
        const bytes = base64ToBytes(b64);
        if (bytes.byteLength < 2) return;
        const int16 = new Int16Array(bytes.buffer, 0, Math.floor(bytes.byteLength / 2));
        const float = new Float32Array(int16.length);
        for (let i = 0; i < int16.length; i++) float[i] = int16[i] / 32768;

        const buffer = ctx.createBuffer(1, float.length, 24000);
        buffer.getChannelData(0).set(float);
        const src = ctx.createBufferSource();
        src.buffer = buffer;
        src.connect(ctx.destination);

        const now = ctx.currentTime;
        const start = Math.max(nextStartRef.current, now);
        src.start(start);
        nextStartRef.current = start + buffer.duration;
        setAiSpeaking(true);
        playingRef.current.push(src);
        src.onended = () => {
            playingRef.current = playingRef.current.filter((s) => s !== src);
            if (playingRef.current.length === 0) setAiSpeaking(false);
        };
    }, []);

    const handleMessage = useCallback((msg: any) => {
        const sc = msg?.serverContent;

        // Barge-in: model was interrupted by the candidate → drop queued audio.
        if (sc?.interrupted) stopPlayback();

        // Output audio — prefer the SDK's concatenated `data`, else walk parts.
        if (msg?.data) {
            enqueueAudio(msg.data);
        } else {
            const parts = sc?.modelTurn?.parts;
            if (Array.isArray(parts)) {
                for (const p of parts) if (p?.inlineData?.data) enqueueAudio(p.inlineData.data);
            }
        }

        // Streaming transcripts (deltas).
        const youDelta = sc?.inputTranscription?.text;
        const aiDelta = sc?.outputTranscription?.text;
        if (youDelta) partialRef.current.you += youDelta;
        if (aiDelta) partialRef.current.ai += aiDelta;

        // Flush partials into the transcript when a turn completes.
        if (sc?.turnComplete) {
            const { you, ai } = partialRef.current;
            setLines((prev) => {
                const next = [...prev];
                if (you.trim()) next.push({ who: "you", text: you.trim() });
                if (ai.trim()) next.push({ who: "ai", text: ai.trim() });
                return next;
            });
            partialRef.current = { you: "", ai: "" };
        }
    }, [enqueueAudio, stopPlayback]);

    const cleanup = useCallback(() => {
        try { frameTimerRef.current && clearInterval(frameTimerRef.current); } catch { /* noop */ }
        try { tickTimerRef.current && clearInterval(tickTimerRef.current); } catch { /* noop */ }
        try { processorRef.current?.disconnect(); } catch { /* noop */ }
        try { sessionRef.current?.close?.(); } catch { /* noop */ }
        try { inCtxRef.current?.close(); } catch { /* noop */ }
        try { outCtxRef.current?.close(); } catch { /* noop */ }
        try { streamRef.current?.getTracks().forEach((t) => t.stop()); } catch { /* noop */ }
        stopPlayback();
        sessionRef.current = null;
        streamRef.current = null;
        inCtxRef.current = null;
        outCtxRef.current = null;
        processorRef.current = null;
    }, [stopPlayback]);

    useEffect(() => cleanup, [cleanup]);

    const endSession = useCallback(() => {
        cleanup();
        setStatus("ended");
    }, [cleanup]);

    const start = useCallback(async () => {
        setError(null);
        setStatus("connecting");
        setLines([]);
        try {
            // 1) Camera + mic
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480 },
                audio: { echoCancellation: true, noiseSuppression: true },
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play().catch(() => { /* autoplay quirk */ });
            }

            // 2) Ephemeral token (real key stays server-side)
            const res = await fetch("/api/interview/live-token", { method: "POST" });
            if (!res.ok) {
                throw new Error(res.status === 429 ? "You're starting sessions too quickly. Wait a moment." : "Could not start the live interview.");
            }
            const { token, model } = await res.json();

            // 3) Connect to Gemini Live with the ephemeral token
            const { GoogleGenAI, Modality } = await import("@google/genai");
            const ai = new GoogleGenAI({ apiKey: token, httpOptions: { apiVersion: "v1alpha" } });
            const config: any = { ...buildLiveConfig(true), responseModalities: [Modality.AUDIO] };

            // Output playback context (Gemini speaks at 24 kHz)
            const OutCtx: typeof AudioContext = (window.AudioContext || (window as any).webkitAudioContext);
            outCtxRef.current = new OutCtx({ sampleRate: 24000 });
            await outCtxRef.current.resume().catch(() => { /* noop */ });

            const session = await ai.live.connect({
                model,
                config,
                callbacks: {
                    onopen: () => {
                        setStatus("live");
                        beginCapture(stream);
                        // Kick the interviewer off so it greets the candidate first.
                        try {
                            session.sendClientContent({
                                turns: [{ role: "user", parts: [{ text: "(The candidate just joined with their camera on. Greet them warmly but professionally and begin the interview.)" }] }],
                                turnComplete: true,
                            });
                        } catch { /* noop */ }
                    },
                    onmessage: handleMessage,
                    onerror: (e: any) => {
                        console.error("Live error:", e);
                        setError("The live connection dropped. Please try again.");
                        setStatus("error");
                        cleanup();
                    },
                    onclose: () => {
                        if (status === "live") setStatus("ended");
                    },
                },
            });
            sessionRef.current = session;

            // elapsed timer
            tickTimerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
        } catch (e: any) {
            console.error(e);
            const msg = e?.name === "NotAllowedError"
                ? "Camera and microphone access is required for the live interview."
                : (e?.message || "Could not start the live interview.");
            setError(msg);
            setStatus("error");
            cleanup();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [handleMessage, cleanup, status]);

    // Start streaming mic (downsampled PCM16) + 1 fps video frames to the session.
    const beginCapture = (stream: MediaStream) => {
        const InCtx: typeof AudioContext = (window.AudioContext || (window as any).webkitAudioContext);
        const ctx = new InCtx();
        inCtxRef.current = ctx;
        const source = ctx.createMediaStreamSource(stream);
        const processor = ctx.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        processor.onaudioprocess = (ev) => {
            if (!sessionRef.current || !micOn) return;
            const input = ev.inputBuffer.getChannelData(0);
            const pcm = downsampleToPCM16(input, ctx.sampleRate, 16000);
            try {
                sessionRef.current.sendRealtimeInput({
                    audio: { data: bytesToBase64(pcm.buffer), mimeType: "audio/pcm;rate=16000" },
                });
            } catch { /* session closing */ }
        };

        // Route through a muted gain so the processor fires without echoing the mic.
        const mute = ctx.createGain();
        mute.gain.value = 0;
        source.connect(processor);
        processor.connect(mute);
        mute.connect(ctx.destination);

        // Vision: one frame per second keeps bandwidth low (Gemini caps at ~1 fps).
        frameTimerRef.current = setInterval(() => {
            const v = videoRef.current, c = canvasRef.current;
            if (!v || !c || !sessionRef.current || !camOn || v.videoWidth === 0) return;
            c.width = 320; c.height = 240;
            const g = c.getContext("2d");
            if (!g) return;
            g.drawImage(v, 0, 0, c.width, c.height);
            const b64 = c.toDataURL("image/jpeg", 0.6).split(",")[1];
            if (b64) {
                try {
                    sessionRef.current.sendRealtimeInput({ video: { data: b64, mimeType: "image/jpeg" } });
                } catch { /* noop */ }
            }
        }, 1000);
    };

    const toggleMic = () => {
        const tracks = streamRef.current?.getAudioTracks() || [];
        const next = !micOn;
        tracks.forEach((t) => (t.enabled = next));
        setMicOn(next);
    };
    const toggleCam = () => {
        const tracks = streamRef.current?.getVideoTracks() || [];
        const next = !camOn;
        tracks.forEach((t) => (t.enabled = next));
        setCamOn(next);
    };

    const mmss = `${String(Math.floor(elapsed / 60)).padStart(2, "0")}:${String(elapsed % 60).padStart(2, "0")}`;

    return (
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border-default pb-4">
                <div className="flex items-center gap-3">
                    <Link href="/interview" className="text-text-tertiary hover:text-text-heading transition-colors"><ArrowLeft className="w-5 h-5" /></Link>
                    <div>
                        <h1 className="text-xl font-heading font-black text-text-heading tracking-tight flex items-center gap-2">
                            Live Video Interview
                            <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-sc-purple-100 text-sc-purple-700">Beta</span>
                        </h1>
                        <p className="text-xs text-text-secondary mt-0.5">Face-to-face with Core, your AI interviewer — voice &amp; vision, in real time.</p>
                    </div>
                </div>
                {status === "live" && (
                    <div className="flex items-center gap-2 text-xs font-bold font-mono">
                        <span className="flex items-center gap-1.5 text-sc-red-600"><Radio className="w-3.5 h-3.5 animate-pulse" /> LIVE</span>
                        <span className="text-text-tertiary">{mmss}</span>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
                {/* Video / stage */}
                <div className="lg:col-span-3 space-y-4">
                    <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-sc-gray-900 border border-border-default shadow-sc-card">
                        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                        <video ref={videoRef} muted playsInline className={cn("w-full h-full object-cover", !camOn && "opacity-0")} />
                        {!camOn && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-sc-gray-400 gap-2">
                                <VideoOff className="w-8 h-8" /> <span className="text-xs font-mono">Camera off</span>
                            </div>
                        )}
                        {/* AI presence pill */}
                        <div className="absolute top-3 left-3 flex items-center gap-2 rounded-full bg-black/55 backdrop-blur px-3 py-1.5">
                            <span className={cn("w-2 h-2 rounded-full", aiSpeaking ? "bg-verified-gold animate-pulse" : "bg-sc-gray-400")} />
                            <span className="text-[11px] font-bold text-white tracking-wide">Core {aiSpeaking ? "speaking…" : "listening"}</span>
                            <Volume2 className={cn("w-3.5 h-3.5", aiSpeaking ? "text-verified-gold" : "text-sc-gray-400")} />
                        </div>
                        <canvas ref={canvasRef} className="hidden" />
                    </div>

                    {/* Controls */}
                    <div className="flex items-center justify-center gap-3">
                        {status === "idle" || status === "ended" || status === "error" ? (
                            <button onClick={start}
                                className="inline-flex items-center gap-2 rounded-xl bg-sc-purple-600 hover:bg-sc-purple-700 text-white font-bold text-sm px-6 py-3 transition-colors shadow-sc-card">
                                <Video className="w-4 h-4" /> {status === "ended" || status === "error" ? "Start again" : "Start live interview"}
                            </button>
                        ) : status === "connecting" ? (
                            <div className="inline-flex items-center gap-2 text-sm text-text-secondary font-mono"><Loader2 className="w-4 h-4 animate-spin" /> Connecting to Core…</div>
                        ) : (
                            <>
                                <button onClick={toggleMic} title={micOn ? "Mute" : "Unmute"}
                                    className={cn("inline-flex items-center justify-center w-12 h-12 rounded-full border transition-colors", micOn ? "bg-bg-card border-border-default text-text-heading hover:bg-sc-gray-50" : "bg-sc-red-100 border-sc-red-200 text-sc-red-700")}>
                                    {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                                </button>
                                <button onClick={toggleCam} title={camOn ? "Turn camera off" : "Turn camera on"}
                                    className={cn("inline-flex items-center justify-center w-12 h-12 rounded-full border transition-colors", camOn ? "bg-bg-card border-border-default text-text-heading hover:bg-sc-gray-50" : "bg-sc-red-100 border-sc-red-200 text-sc-red-700")}>
                                    {camOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                                </button>
                                <button onClick={endSession} title="End interview"
                                    className="inline-flex items-center justify-center gap-2 rounded-full bg-sc-red-600 hover:bg-sc-red-700 text-white font-bold text-sm px-5 h-12 transition-colors">
                                    <PhoneOff className="w-4 h-4" /> End
                                </button>
                            </>
                        )}
                    </div>

                    {error && (
                        <div className="flex items-start gap-2 rounded-xl bg-sc-red-50 border border-sc-red-200 text-sc-red-700 text-sm px-4 py-3">
                            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" /> <span>{error}</span>
                        </div>
                    )}
                </div>

                {/* Transcript */}
                <div className="lg:col-span-2 flex flex-col rounded-2xl border border-border-default bg-bg-card shadow-sc-card overflow-hidden min-h-[360px] max-h-[70vh]">
                    <div className="px-4 py-3 border-b border-border-default bg-bg-secondary-panel">
                        <h2 className="text-xs font-bold uppercase tracking-wider text-text-tertiary">Live transcript</h2>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {lines.length === 0 && status !== "live" && (
                            <p className="text-sm text-text-secondary">
                                You&apos;ll meet <strong className="text-text-heading">Core</strong>, a senior AI interviewer with a calm, professional manner. It speaks with a {INTERVIEWER_VOICE === "Charon" ? "firm, measured" : "natural"} voice, watches your camera for engagement, and adapts to how you sound. Have your headphones on for the best experience.
                            </p>
                        )}
                        {lines.length === 0 && status === "live" && (
                            <p className="text-sm text-text-secondary font-mono animate-pulse">Core is preparing your first question…</p>
                        )}
                        {lines.map((l, i) => (
                            <div key={i} className={cn("text-sm leading-relaxed", l.who === "ai" ? "" : "text-right")}>
                                <span className={cn("text-[10px] font-bold uppercase tracking-wider", l.who === "ai" ? "text-sc-purple-600" : "text-text-tertiary")}>
                                    {l.who === "ai" ? "Core" : "You"}
                                </span>
                                <p className={cn("mt-0.5 inline-block rounded-xl px-3 py-2", l.who === "ai" ? "bg-sc-purple-50 text-text-body" : "bg-sc-gray-100 text-text-body")}>{l.text}</p>
                            </div>
                        ))}
                        <div ref={transcriptEndRef} />
                    </div>
                </div>
            </div>

            {/* Consent / privacy note */}
            <p className="text-[11px] text-text-tertiary leading-relaxed max-w-3xl">
                By starting, you consent to your camera and microphone being streamed to the AI interviewer for the duration of the session. The camera is used only to gauge presence and engagement — never to judge appearance. This is a Beta feature.
            </p>
        </div>
    );
}
