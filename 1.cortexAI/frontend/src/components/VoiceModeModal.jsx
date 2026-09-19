import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Volume2, VolumeX, X, Sparkles } from 'lucide-react';

function VoiceModeModal({ isOpen, onClose, onSendMessage, isAiResponding, latestAiMessage }) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);

  // Initialize Speech Recognition
  useEffect(() => {
    if (!isOpen) {
      if (synthRef.current) synthRef.current.cancel();
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      setIsSpeaking(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onresult = (event) => {
      let current = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        current += event.results[i][0].transcript;
      }
      setTranscript(current);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    startListening();

    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
      if (synthRef.current) synthRef.current.cancel();
    };
  }, [isOpen]);

  // Speak AI response when a new message arrives
  useEffect(() => {
    if (!isOpen || !latestAiMessage || isMuted) return;

    // Clean markdown before speaking
    const cleanText = latestAiMessage
      .replace(/```[\s\S]*?```/g, 'Code block generated.')
      .replace(/[#*`_~[\]()]/g, '')
      .replace(/!\[.*?\]\(.*?\)/g, 'Image attached.')
      .trim();

    if (!cleanText) return;

    if (synthRef.current) {
      synthRef.current.cancel();
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;

      // Prefer natural English voices
      const voices = synthRef.current.getVoices();
      const naturalVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha')));
      if (naturalVoice) utterance.voice = naturalVoice;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        // Automatically listen again after speaking
        setTimeout(startListening, 500);
      };
      utterance.onerror = () => setIsSpeaking(false);

      synthRef.current.speak(utterance);
    }
  }, [latestAiMessage, isOpen, isMuted]);

  const startListening = () => {
    if (synthRef.current) synthRef.current.cancel();
    setIsSpeaking(false);
    setTranscript('');
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        // Recognition might already be active
      }
    }
  };

  const stopListeningAndSend = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    setIsListening(false);
    if (transcript.trim()) {
      onSendMessage(transcript.trim());
      setTranscript('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xl transition-all duration-300">
      <div className="relative flex flex-col items-center justify-between w-full max-w-lg h-[80vh] p-8 text-white">
        {/* Top bar */}
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/10 text-xs font-medium text-indigo-300">
            <Sparkles size={14} className="text-indigo-400 animate-spin" />
            <span>CortexAI Voice Mode</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsMuted(!isMuted);
                if (!isMuted && synthRef.current) synthRef.current.cancel();
              }}
              className="p-2 rounded-full bg-white/[0.08] hover:bg-white/[0.15] text-slate-300 hover:text-white transition cursor-pointer"
              title={isMuted ? "Unmute" : "Mute"}
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
                ? 'w-60 h-60 bg-cyan-500/30 animate-pulse'
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

        {/* Transcript and Status */}
        <div className="w-full flex flex-col items-center gap-4 text-center max-w-md">
          <p className="text-xs uppercase tracking-widest font-semibold text-indigo-400">
            {isAiResponding
              ? 'CortexAI is thinking...'
              : isSpeaking
              ? 'CortexAI is speaking'
              : isListening
              ? 'Listening to you...'
              : 'Tap microphone to speak'}
          </p>

          <p className="text-base text-slate-200 min-h-[48px] font-medium leading-relaxed line-clamp-2">
            {transcript || (isListening ? 'Speak now...' : 'Say something to CortexAI...')}
          </p>

          {/* Controls */}
          <div className="flex items-center gap-4 mt-2">
            {isListening ? (
              <button
                onClick={stopListeningAndSend}
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-red-500 to-rose-600 text-white font-medium text-sm shadow-lg hover:opacity-90 transition cursor-pointer"
              >
                <MicOff size={18} />
                <span>Send Message</span>
              </button>
            ) : (
              <button
                onClick={startListening}
                disabled={isAiResponding}
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-medium text-sm shadow-lg hover:opacity-90 transition disabled:opacity-50 cursor-pointer"
              >
                <Mic size={18} />
                <span>Start Speaking</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default VoiceModeModal;
