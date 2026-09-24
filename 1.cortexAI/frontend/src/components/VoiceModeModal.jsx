import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Volume2, VolumeX, X, Sparkles, Send, RotateCcw } from 'lucide-react';

function VoiceModeModal({ isOpen, onClose, onSendMessage, isAiResponding, latestAiMessage }) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isWaitingForAnswer, setIsWaitingForAnswer] = useState(false);
  
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);
  const initialAiMessageRef = useRef('');

  // 1. Lifecycle when Modal Opens / Closes
  useEffect(() => {
    if (!isOpen) {
      if (synthRef.current) synthRef.current.cancel();
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (_) {}
      }
      setIsListening(false);
      setIsSpeaking(false);
      setIsWaitingForAnswer(false);
      return;
    }

    // Modal JUST opened: Stop any active speech immediately (never speak old message!)
    if (synthRef.current) synthRef.current.cancel();
    setIsSpeaking(false);
    setTranscript('');
    setIsWaitingForAnswer(false);
    initialAiMessageRef.current = latestAiMessage || '';

    // Initialize Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please use Chrome, Edge, or a WebSpeech-compatible browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onresult = (event) => {
      let current = '';
      for (let i = 0; i < event.results.length; i++) {
        current += event.results[i][0].transcript + ' ';
      }
      setTranscript(current.trim());
    };

    recognition.onerror = (event) => {
      console.warn("Speech recognition error:", event.error);
      if (event.error === 'not-allowed') {
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    startListening();

    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (_) {}
      }
      if (synthRef.current) synthRef.current.cancel();
    };
  }, [isOpen]);

  // 2. Speak AI Answer ONLY when a newly requested query finishes responding
  useEffect(() => {
    if (!isOpen || isMuted) return;

    // Only speak if we were waiting for an answer to our voice query AND the message is NEW
    if (isWaitingForAnswer && !isAiResponding && latestAiMessage && latestAiMessage !== initialAiMessageRef.current) {
      setIsWaitingForAnswer(false);
      initialAiMessageRef.current = latestAiMessage;

      // Clean markdown before speaking
      const cleanText = latestAiMessage
        .replace(/```[\s\S]*?```/g, 'Code block generated.')
        .replace(/[#*`_~[\]()]/g, '')
        .replace(/!\[.*?\]\(.*?\)/g, '')
        .replace(/📥 \[Download.*?\]\(.*?\)/gi, '')
        .trim();

      if (!cleanText) return;

      if (synthRef.current) {
        synthRef.current.cancel();
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.rate = 1.05;
        utterance.pitch = 1.0;

        const voices = synthRef.current.getVoices();
        const naturalVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha')));
        if (naturalVoice) utterance.voice = naturalVoice;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => {
          setIsSpeaking(false);
          // Resume listening after speaking the answer
          setTimeout(startListening, 600);
        };
        utterance.onerror = () => setIsSpeaking(false);

        synthRef.current.speak(utterance);
      }
    }
  }, [isOpen, isAiResponding, latestAiMessage, isWaitingForAnswer, isMuted]);

  const startListening = () => {
    if (synthRef.current) synthRef.current.cancel();
    setIsSpeaking(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        // Recognition might already be running
        setIsListening(true);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (_) {}
    }
    setIsListening(false);
  };

  const handleSend = () => {
    const textToSend = transcript.trim();
    if (!textToSend || isAiResponding) return;

    stopListening();
    if (synthRef.current) synthRef.current.cancel();
    setIsSpeaking(false);
    setIsWaitingForAnswer(true);

    if (onSendMessage) {
      onSendMessage(textToSend);
    }
    setTranscript('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xl transition-all duration-300">
      <div className="relative flex flex-col items-center justify-between w-full max-w-lg h-[82vh] p-7 text-white">
        {/* Top bar */}
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.06] border border-white/10 text-xs font-medium text-indigo-300">
            <Sparkles size={14} className="text-indigo-400 animate-spin" />
            <span>CortexAI Voice Assistant</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsMuted(!isMuted);
                if (!isMuted && synthRef.current) synthRef.current.cancel();
              }}
              className="p-2 rounded-full bg-white/[0.08] hover:bg-white/[0.15] text-slate-300 hover:text-white transition cursor-pointer"
              title={isMuted ? "Unmute Voice" : "Mute Voice"}
            >
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/[0.08] hover:bg-white/[0.15] text-slate-300 hover:text-white transition cursor-pointer"
              title="Close Voice Mode"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Animated Voice Orb */}
        <div className="relative flex items-center justify-center my-auto">
          {/* Glowing Outer Rings */}
          <div
            className={`absolute rounded-full filter blur-2xl transition-all duration-700 ${
              isSpeaking
                ? 'w-72 h-72 bg-indigo-500/40 animate-pulse'
                : isListening
                ? 'w-64 h-64 bg-violet-600/30 animate-ping'
                : isAiResponding
                ? 'w-60 h-60 bg-cyan-500/40 animate-pulse'
                : 'w-48 h-48 bg-indigo-600/20'
            }`}
          />

          {/* Central Orb */}
          <div
            className={`relative flex items-center justify-center w-40 h-40 rounded-full bg-gradient-to-tr from-indigo-600 via-violet-600 to-cyan-400 shadow-[0_0_50px_rgba(99,102,241,0.5)] transition-transform duration-300 ${
              isSpeaking ? 'scale-110' : isListening ? 'scale-105 animate-pulse' : 'scale-100'
            }`}
          >
            <div className="flex items-center justify-center w-36 h-36 rounded-full bg-[#0d0f14]/40 backdrop-blur-sm">
              <div className="flex gap-1.5 items-center">
                <span className={`w-1.5 rounded-full bg-white transition-all duration-200 ${isSpeaking || isListening ? 'h-8 animate-bounce' : 'h-3'}`} />
                <span className={`w-1.5 rounded-full bg-white transition-all duration-200 ${isSpeaking || isListening ? 'h-12 animate-pulse' : 'h-5'}`} />
                <span className={`w-1.5 rounded-full bg-white transition-all duration-200 ${isSpeaking || isListening ? 'h-6 animate-bounce' : 'h-2'}`} />
                <span className={`w-1.5 rounded-full bg-white transition-all duration-200 ${isSpeaking || isListening ? 'h-10 animate-pulse' : 'h-4'}`} />
              </div>
            </div>
          </div>
        </div>

        {/* Transcript and Controls */}
        <div className="w-full flex flex-col items-center gap-3.5 text-center max-w-md">
          <p className="text-xs uppercase tracking-widest font-semibold text-indigo-400">
            {isAiResponding
              ? 'Searching & thinking...'
              : isSpeaking
              ? 'CortexAI is answering...'
              : isListening
              ? 'Listening to you... Speak now'
              : 'Tap microphone or type to ask'}
          </p>

          {/* Live Transcript / Input Box */}
          <div className="w-full relative bg-white/[0.04] border border-white/10 rounded-2xl p-3 text-left focus-within:border-indigo-500/50 transition">
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isListening ? "Listening... your question will appear here" : "Type or speak your question..."}
              rows={2}
              className="w-full bg-transparent border-none outline-none text-sm text-slate-100 placeholder-slate-500 resize-none font-medium leading-relaxed pr-8"
            />
            {transcript && (
              <button
                type="button"
                onClick={() => setTranscript('')}
                className="absolute top-2.5 right-2.5 text-slate-500 hover:text-slate-300 transition"
                title="Clear text"
              >
                <RotateCcw size={13} />
              </button>
            )}
          </div>

          {/* Control Buttons */}
          <div className="flex items-center gap-3 mt-1 w-full justify-center">
            {/* Mic Toggle Button */}
            <button
              type="button"
              onClick={isListening ? stopListening : startListening}
              disabled={isAiResponding}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-xs shadow-md transition cursor-pointer disabled:opacity-50 ${
                isListening
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30'
                  : 'bg-white/[0.08] text-slate-200 border border-white/10 hover:bg-white/[0.12]'
              }`}
            >
              {isListening ? (
                <>
                  <MicOff size={15} className="text-rose-400" />
                  <span>Pause Mic</span>
                </>
              ) : (
                <>
                  <Mic size={15} className="text-indigo-400" />
                  <span>Start Mic</span>
                </>
              )}
            </button>

            {/* Prominent Send Query Button */}
            <button
              type="button"
              onClick={handleSend}
              disabled={!transcript.trim() || isAiResponding}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-xs shadow-lg transition select-none cursor-pointer ${
                transcript.trim() && !isAiResponding
                  ? 'bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white shadow-indigo-500/25 active:scale-95'
                  : 'bg-white/[0.05] text-slate-600 border border-white/[0.05] cursor-not-allowed'
              }`}
            >
              <Send size={14} />
              <span>{isAiResponding ? "Sending..." : "Send Question"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VoiceModeModal;
