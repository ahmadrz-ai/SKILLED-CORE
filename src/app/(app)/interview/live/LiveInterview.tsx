"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
    Mic, Video, VideoOff, Loader2, PhoneOff, Radio, AlertTriangle, ArrowLeft,
    Volume2, Send, SkipForward, Award, CheckCircle2, XCircle, Coins,
} from "lucide-react";
import { INTERVIEWER_VOICE } from "@/lib/interview/liveConfig";
import { getInterviewerReply, type LiveTurn } from "@/app/actions/liveInterview";
import { createInterviewSession, finalizeInterview } from "@/app/actions/interview";
import { cn } from "@/lib/utils";

type Phase = "setup" | "connecting" | "live" | "grading" | "done" | "error";
type Line = { who: "ai" | "you"; text: string };

const CLASSIFICATION = { category: "General", requiresCodingSandbox: false, coreCompetencies: [], toolsToAskAbout: [] };

export default function LiveInterview() {
    const [phase, setPhase] = useState<Phase>("setup");
    const [role, setRole] = useState("");
    const [difficulty, setDifficulty] = useState(3);
    const [error, setError] = useState<string | null>(null);

    const [lines, setLines] = useState<Line[]>([]);
    const [aiSpeaking, setAiSpeaking] = useState(false);
    const [listening, setListening] = useState(false);
    const [thinking, setThinking] = useState(false);
    const [answerDraft, setAnswerDraft] = useState("");
    const [elapsed, setElapsed] = useState(0);
    const [camOn, setCamOn] = useState(true);
    const [sttSupported, setSttSupported] = useState(true);

    const [generalConfirm, setGeneralConfirm] = useState<{ remaining: number } | null>(null);
    const [result, setResult] = useState<null | { passed: boolean; score: number; badge: { name: string; score: number } | null; feedback: string }>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const transcriptEndRef = useRef<HTMLDivElement>(null);

    const streamRef = useRef<MediaStream | null>(null);
    const recRef = useRef<any>(null);
    const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
    const interviewIdRef = useRef<string | null>(null);
    const linesRef = useRef<Line[]>([]);
    const phaseRef = useRef<Phase>("setup");
    const speakingRef = useRef(false);
    const manualStopRef = useRef(false);
    const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => { phaseRef.current = phase; }, [phase]);
    useEffect(() => { transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [lines, thinking]);

    // Pick the firmest available English voice for the slow/professional tone.
    useEffect(() => {
        const synth = typeof window !== "undefined" ? window.speechSynthesis : null;
        if (!synth) return;
        const pick = () => {
            const vs = synth.getVoices();
            if (!vs.length) return;
            const en = vs.filter((v) => v.lang?.toLowerCase().startsWith("en"));
            const male = en.find((v) => /male|david|guy|daniel|google uk english male|mark|fred|rishi|aaron|arthur/i.test(v.name));
            voiceRef.current = male || en[0] || vs[0];
        };
        pick();
        synth.onvoiceschanged = pick;
        return () => { try { synth.onvoiceschanged = null; } catch { /* noop */ } };
    }, []);

    // Detect Web Speech API support.
    useEffect(() => {
        if (typeof window !== "undefined" && !((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)) {
            setSttSupported(false);
        }
    }, []);

    const pushLine = useCallback((who: "ai" | "you", text: string) => {
        setLines((prev) => {
            const next = [...prev, { who, text }];
            linesRef.current = next;
            return next;
        });
    }, []);

    const captureFrame = useCallback((): string | undefined => {
        const v = videoRef.current, c = canvasRef.current;
        if (!v || !c || v.videoWidth === 0 || !camOn) return undefined;
        c.width = 320; c.height = 240;
        const g = c.getContext("2d");
        if (!g) return undefined;
        g.drawImage(v, 0, 0, c.width, c.height);
        return c.toDataURL("image/jpeg", 0.5).split(",")[1];
    }, [camOn]);

    // ─────────────── speaking (browser TTS, slow + firm) ───────────────
    const speakThenListen = useCallback((text: string) => {
        const synth = window.speechSynthesis;
        try { synth.cancel(); } catch { /* noop */ }
        const u = new SpeechSynthesisUtterance(text);
        if (voiceRef.current) u.voice = voiceRef.current;
        u.rate = 0.92;  // slow, deliberate
        u.pitch = 0.9;  // slightly lower → firmer
        u.volume = 1;
        speakingRef.current = true;
        setAiSpeaking(true);
        const done = () => {
            speakingRef.current = false;
            setAiSpeaking(false);
            if (phaseRef.current === "live") startListening();
        };
        u.onend = done;
        u.onerror = done;
        synth.speak(u);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ─────────────── listening (Web Speech STT) ───────────────
    const startListening = useCallback(() => {
        if (phaseRef.current !== "live" || speakingRef.current) return;
        const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SR) { setSttSupported(false); return; }
        try { recRef.current?.stop?.(); } catch { /* noop */ }

        const rec = new SR();
        rec.lang = "en-US";
        rec.continuous = false;
        rec.interimResults = true;
        recRef.current = rec;
        manualStopRef.current = false;
        let finalText = "";

        rec.onresult = (e: any) => {
            let interim = "";
            for (let i = e.resultIndex; i < e.results.length; i++) {
                const r = e.results[i];
                if (r.isFinal) finalText += r[0].transcript;
                else interim += r[0].transcript;
            }
            setAnswerDraft((finalText + " " + interim).trim());
        };
        rec.onerror = () => { /* no-speech / aborted — handled in onend */ };
        rec.onend = () => {
            setListening(false);
            const t = finalText.trim();
            if (t) { submitAnswer(t); return; }
            // Keep the mic open if the candidate just paused.
            if (!manualStopRef.current && phaseRef.current === "live" && !speakingRef.current) {
                startListening();
            }
        };

        setListening(true);
        try { rec.start(); } catch { /* already started */ }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const stopListening = useCallback(() => {
        manualStopRef.current = true;
        try { recRef.current?.stop?.(); } catch { /* noop */ }
        setListening(false);
    }, []);

    // ─────────────── one interviewer turn ───────────────
    const askInterviewer = useCallback(async () => {
        setThinking(true);
        const history: LiveTurn[] = linesRef.current.map((l) => ({ role: l.who === "ai" ? "model" : "user", text: l.text }));
        const frame = captureFrame();
        const res = await getInterviewerReply(history, role, frame);
        setThinking(false);
        if ("error" in res) {
            toast.error(res.error);
            if (phaseRef.current === "live") startListening();
            return;
        }
        pushLine("ai", res.text);
        speakThenListen(res.text);
    }, [role, captureFrame, pushLine, speakThenListen, startListening]);

    const submitAnswer = useCallback((text: string) => {
        const t = text.trim();
        if (!t) return;
        stopListening();
        setAnswerDraft("");
        pushLine("you", t);
        askInterviewer();
    }, [stopListening, pushLine, askInterviewer]);

    // ─────────────── lifecycle ───────────────
    const cleanupMedia = useCallback(() => {
        try { tickRef.current && clearInterval(tickRef.current); } catch { /* noop */ }
        try { recRef.current?.stop?.(); } catch { /* noop */ }
        try { window.speechSynthesis?.cancel(); } catch { /* noop */ }
        try { streamRef.current?.getTracks().forEach((t) => t.stop()); } catch { /* noop */ }
        streamRef.current = null;
        speakingRef.current = false;
    }, []);

    useEffect(() => () => cleanupMedia(), [cleanupMedia]);

    const beginSession = useCallback(async (confirmGeneral: boolean) => {
        setError(null);
        setPhase("connecting");
        try {
            // 1) Camera + mic first, so the permission prompt fires on the click.
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480 },
                audio: true,
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play().catch(() => { /* autoplay quirk */ });
            }

            // 2) Credit gate (reuses the text-interview economy).
            const sess: any = await createInterviewSession(role.trim(), difficulty, CLASSIFICATION, confirmGeneral);
            if (sess?.needsGeneralConfirm) {
                cleanupMedia();
                setGeneralConfirm({ remaining: sess.generalRemaining || 0 });
                setPhase("setup");
                return;
            }
            if (sess?.error || !sess?.id) {
                cleanupMedia();
                setError(sess?.error || "Could not start the interview.");
                setPhase("error");
                return;
            }
            interviewIdRef.current = sess.id;
            if (sess.usedGeneral) toast.info("Used 1 General credit for this interview.");

            // 3) Go live → Core opens the conversation.
            setLines([]); linesRef.current = [];
            setPhase("live");
            phaseRef.current = "live";
            tickRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
            askInterviewer();
        } catch (e: any) {
            cleanupMedia();
            const msg = e?.name === "NotAllowedError"
                ? "Camera and microphone access is required. Please allow access and try again."
                : (e?.message || "Could not start the live interview.");
            setError(msg);
            setPhase("error");
        }
    }, [role, difficulty, cleanupMedia, askInterviewer]);

    const endAndGrade = useCallback(async () => {
        setPhase("grading");
        phaseRef.current = "grading";
        cleanupMedia();
        const id = interviewIdRef.current;
        const transcript = linesRef.current.map((l) => ({ role: l.who === "ai" ? "assistant" : "user", content: l.text }));
        if (!id) { setPhase("done"); return; }
        try {
            const res: any = await finalizeInterview(id, transcript, elapsed, false);
            if (res?.error) { toast.error(res.error); setPhase("done"); return; }
            setResult({
                passed: !!res.passed,
                score: res?.data?.score ?? 0,
                badge: res?.badge ?? null,
                feedback: res?.data?.feedback ?? "",
            });
            setPhase("done");
        } catch {
            toast.error("Grading failed — your transcript is safe.");
            setPhase("done");
        }
    }, [cleanupMedia, elapsed]);

    const onStartClick = () => {
        if (!role.trim()) { toast.error("Tell Core which role or skill to assess."); return; }
        beginSession(false);
    };

    const toggleCam = () => {
        const tracks = streamRef.current?.getVideoTracks() || [];
        const next = !camOn;
        tracks.forEach((t) => (t.enabled = next));
        setCamOn(next);
    };
    const skipSpeaking = () => {
        try { window.speechSynthesis?.cancel(); } catch { /* noop */ }
        speakingRef.current = false;
        setAiSpeaking(false);
        startListening();
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
                {phase === "live" && (
                    <div className="flex items-center gap-2 text-xs font-bold font-mono">
                        <span className="flex items-center gap-1.5 text-sc-red-600"><Radio className="w-3.5 h-3.5 animate-pulse" /> LIVE</span>
                        <span className="text-text-tertiary">{mmss}</span>
                    </div>
                )}
            </div>

            {/* SETUP */}
            {phase === "setup" && (
                <div className="max-w-lg mx-auto rounded-2xl border border-border-default bg-bg-card shadow-sc-card p-6 space-y-5">
                    <div className="space-y-1">
                        <h2 className="text-base font-bold text-text-heading">Set up your interview</h2>
                        <p className="text-sm text-text-secondary">Core will assess you for the role or skill below and, if you pass, issue a verified badge for it.</p>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-text-tertiary">Role or skill</label>
                        <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. React Frontend Developer, Prompt Engineering"
                            className="w-full rounded-xl border border-border-default bg-bg-secondary-panel px-4 py-2.5 text-sm text-text-heading outline-none focus:border-sc-purple-400" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-text-tertiary">Difficulty</label>
                        <select value={difficulty} onChange={(e) => setDifficulty(Number(e.target.value))}
                            className="w-full rounded-xl border border-border-default bg-bg-secondary-panel px-4 py-2.5 text-sm text-text-heading outline-none focus:border-sc-purple-400">
                            <option value={1}>1 — Intro</option>
                            <option value={2}>2 — Junior</option>
                            <option value={3}>3 — Mid</option>
                            <option value={4}>4 — Senior</option>
                            <option value={5}>5 — Expert</option>
                        </select>
                    </div>
                    {!sttSupported && (
                        <p className="text-[11px] text-sc-amber-700 bg-sc-amber-100 rounded-lg px-3 py-2">
                            Your browser doesn&apos;t support live speech input — you can still answer by typing. For voice, use Chrome.
                        </p>
                    )}
                    <button onClick={onStartClick}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-sc-purple-600 hover:bg-sc-purple-700 text-white font-bold text-sm px-6 py-3 transition-colors shadow-sc-card">
                        <Video className="w-4 h-4" /> Start live interview
                    </button>
                    <p className="flex items-center gap-1 text-[11px] text-text-tertiary"><Coins className="w-3 h-3" /> Uses 1 AI Interview credit (or 1 General if those run out).</p>
                </div>
            )}

            {/* LIVE / CONNECTING / GRADING / DONE */}
            {phase !== "setup" && (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
                    {/* Stage */}
                    <div className="lg:col-span-3 space-y-4">
                        <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-sc-gray-900 border border-border-default shadow-sc-card">
                            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                            <video ref={videoRef} muted playsInline className={cn("w-full h-full object-cover", !camOn && "opacity-0")} />
                            {!camOn && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-sc-gray-400 gap-2">
                                    <VideoOff className="w-8 h-8" /> <span className="text-xs font-mono">Camera off</span>
                                </div>
                            )}
                            <div className="absolute top-3 left-3 flex items-center gap-2 rounded-full bg-black/55 backdrop-blur px-3 py-1.5">
                                <span className={cn("w-2 h-2 rounded-full", aiSpeaking ? "bg-verified-gold animate-pulse" : thinking ? "bg-sc-amber-400 animate-pulse" : listening ? "bg-sc-green-400 animate-pulse" : "bg-sc-gray-400")} />
                                <span className="text-[11px] font-bold text-white tracking-wide">
                                    Core {aiSpeaking ? "speaking…" : thinking ? "thinking…" : listening ? "listening…" : "ready"}
                                </span>
                                <Volume2 className={cn("w-3.5 h-3.5", aiSpeaking ? "text-verified-gold" : "text-sc-gray-400")} />
                            </div>
                            <canvas ref={canvasRef} className="hidden" />
                        </div>

                        {phase === "connecting" && (
                            <div className="flex items-center justify-center gap-2 text-sm text-text-secondary font-mono"><Loader2 className="w-4 h-4 animate-spin" /> Starting your session…</div>
                        )}

                        {phase === "live" && (
                            <div className="space-y-3">
                                {/* Answer box (STT fills it; you can also type) */}
                                <div className="flex items-end gap-2">
                                    <textarea
                                        value={answerDraft}
                                        onChange={(e) => setAnswerDraft(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitAnswer(answerDraft); } }}
                                        rows={2}
                                        placeholder={listening ? "Listening… speak your answer (or type)" : "Type your answer, or click the mic"}
                                        className="flex-1 resize-none rounded-xl border border-border-default bg-bg-card px-3 py-2 text-sm text-text-heading outline-none focus:border-sc-purple-400"
                                    />
                                    <button onClick={() => submitAnswer(answerDraft)} disabled={!answerDraft.trim()}
                                        className="inline-flex items-center gap-1.5 rounded-xl bg-sc-purple-600 hover:bg-sc-purple-700 disabled:opacity-50 text-white font-bold text-sm px-4 py-2.5 h-[42px]">
                                        <Send className="w-4 h-4" /> Send
                                    </button>
                                </div>
                                <div className="flex items-center justify-center gap-3">
                                    {!listening && !aiSpeaking && (
                                        <button onClick={startListening} disabled={!sttSupported}
                                            className="inline-flex items-center justify-center w-12 h-12 rounded-full border bg-bg-card border-border-default text-text-heading hover:bg-sc-gray-50 disabled:opacity-50" title="Listen">
                                            <Mic className="w-5 h-5" />
                                        </button>
                                    )}
                                    {aiSpeaking && (
                                        <button onClick={skipSpeaking} className="inline-flex items-center gap-1.5 rounded-full border border-border-default bg-bg-card px-4 h-12 text-sm font-semibold text-text-heading hover:bg-sc-gray-50" title="Skip to my answer">
                                            <SkipForward className="w-4 h-4" /> Skip
                                        </button>
                                    )}
                                    <button onClick={toggleCam} className={cn("inline-flex items-center justify-center w-12 h-12 rounded-full border transition-colors", camOn ? "bg-bg-card border-border-default text-text-heading hover:bg-sc-gray-50" : "bg-sc-red-100 border-sc-red-200 text-sc-red-700")} title={camOn ? "Camera off" : "Camera on"}>
                                        {camOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                                    </button>
                                    <button onClick={endAndGrade} className="inline-flex items-center justify-center gap-2 rounded-full bg-sc-red-600 hover:bg-sc-red-700 text-white font-bold text-sm px-5 h-12 transition-colors">
                                        <PhoneOff className="w-4 h-4" /> End &amp; grade
                                    </button>
                                </div>
                            </div>
                        )}

                        {phase === "grading" && (
                            <div className="flex items-center justify-center gap-2 text-sm text-text-secondary font-mono"><Loader2 className="w-4 h-4 animate-spin" /> Core is grading your interview…</div>
                        )}

                        {/* RESULT */}
                        {phase === "done" && (
                            <div className={cn("rounded-2xl border p-5 space-y-3", result?.passed ? "bg-verified-gold-tint border-verified-gold-border" : "bg-bg-card border-border-default")}>
                                <div className="flex items-center gap-2">
                                    {result?.passed ? <CheckCircle2 className="w-6 h-6 text-verified-gold" /> : <XCircle className="w-6 h-6 text-text-tertiary" />}
                                    <h2 className="text-lg font-bold text-text-heading">{result?.passed ? "Passed" : "Not passed yet"} — {result?.score ?? 0}/100</h2>
                                </div>
                                {result?.badge && (
                                    <div className="flex items-center gap-2 text-sm font-bold text-verified-gold">
                                        <Award className="w-4 h-4" /> Verified badge issued: {result.badge.name} ({result.badge.score}/100)
                                    </div>
                                )}
                                {result?.feedback && <p className="text-sm text-text-secondary leading-relaxed">{result.feedback}</p>}
                                <div className="flex gap-3 pt-1">
                                    <button onClick={() => { setResult(null); setLines([]); linesRef.current = []; setElapsed(0); interviewIdRef.current = null; setPhase("setup"); }}
                                        className="rounded-xl bg-sc-purple-600 hover:bg-sc-purple-700 text-white font-semibold text-sm px-4 py-2">New interview</button>
                                    <Link href="/profile/me" className="rounded-xl border border-border-default bg-bg-card text-text-heading font-semibold text-sm px-4 py-2">View profile</Link>
                                </div>
                            </div>
                        )}

                        {error && phase === "error" && (
                            <div className="space-y-3">
                                <div className="flex items-start gap-2 rounded-xl bg-sc-red-50 border border-sc-red-200 text-sc-red-700 text-sm px-4 py-3">
                                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" /> <span>{error}</span>
                                </div>
                                <button onClick={() => setPhase("setup")} className="rounded-xl bg-sc-purple-600 hover:bg-sc-purple-700 text-white font-semibold text-sm px-4 py-2">Back to setup</button>
                            </div>
                        )}
                    </div>

                    {/* Transcript */}
                    <div className="lg:col-span-2 flex flex-col rounded-2xl border border-border-default bg-bg-card shadow-sc-card overflow-hidden min-h-[360px] max-h-[70vh]">
                        <div className="px-4 py-3 border-b border-border-default bg-bg-secondary-panel">
                            <h2 className="text-xs font-bold uppercase tracking-wider text-text-tertiary">Live transcript</h2>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {lines.length === 0 && (
                                <p className="text-sm text-text-secondary font-mono animate-pulse">Core is preparing your first question…</p>
                            )}
                            {lines.map((l, i) => (
                                <div key={i} className={cn("text-sm leading-relaxed", l.who === "ai" ? "" : "text-right")}>
                                    <span className={cn("text-[10px] font-bold uppercase tracking-wider", l.who === "ai" ? "text-sc-purple-600" : "text-text-tertiary")}>{l.who === "ai" ? "Core" : "You"}</span>
                                    <p className={cn("mt-0.5 inline-block rounded-xl px-3 py-2", l.who === "ai" ? "bg-sc-purple-50 text-text-body" : "bg-sc-gray-100 text-text-body")}>{l.text}</p>
                                </div>
                            ))}
                            {thinking && <p className="text-xs text-text-tertiary font-mono animate-pulse">Core is thinking…</p>}
                            <div ref={transcriptEndRef} />
                        </div>
                    </div>
                </div>
            )}

            {/* "Use a General credit?" confirm */}
            {generalConfirm && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-bg-overlay backdrop-blur-md p-4">
                    <div className="bg-bg-modal border border-border-modal p-6 rounded-2xl shadow-sc-modal max-w-md w-full space-y-4 text-center">
                        <div className="w-12 h-12 rounded-full bg-sc-purple-50 border border-sc-purple-200 flex items-center justify-center mx-auto"><Coins className="w-6 h-6 text-text-brand" /></div>
                        <div className="space-y-1">
                            <h3 className="text-lg font-bold text-text-heading">Out of AI Interview credits</h3>
                            <p className="text-sm text-text-secondary leading-relaxed">This interview will use <strong className="text-text-heading">1 General credit</strong> instead. You have <strong className="text-text-heading">{generalConfirm.remaining}</strong> left.</p>
                        </div>
                        <div className="flex gap-3 pt-1">
                            <button onClick={() => setGeneralConfirm(null)} className="flex-1 h-10 rounded-xl border border-border-default bg-bg-card text-text-body font-semibold text-sm hover:bg-bg-sidebar-hover">Cancel</button>
                            <button onClick={() => { setGeneralConfirm(null); beginSession(true); }} className="flex-1 h-10 rounded-xl bg-sc-purple-600 hover:bg-sc-purple-700 text-white font-semibold text-sm">Use 1 General credit</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Privacy note */}
            <p className="text-[11px] text-text-tertiary leading-relaxed max-w-3xl">
                By starting, you consent to your camera and microphone being used for the session. The camera is used only to gauge presence and engagement — never to judge appearance. Speech is processed in your browser. Core speaks with a {INTERVIEWER_VOICE === "Charon" ? "firm, measured" : "natural"} voice; headphones recommended. This is a Beta feature.
            </p>
        </div>
    );
}
