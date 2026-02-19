
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { chatWithAgriBot } from '../services/geminiService';
import { ChatMessage } from '../types';

// PCM Audio Encoding/Decoding Utilities
function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function encodeBase64(bytes: Uint8Array) {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const Chatbot: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Hello! I am your AgriFlow assistant. You can type, use voice, or show me your crops via camera!', timestamp: Date.now() }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const audioContextsRef = useRef<{ input: AudioContext; output: AudioContext } | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const frameIntervalRef = useRef<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  useEffect(() => {
    return () => {
      stopLiveSession();
    };
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const stopLiveSession = () => {
    if (sessionPromiseRef.current) {
      sessionPromiseRef.current.then((session) => {
        try { session.close(); } catch (e) { }
      });
      sessionPromiseRef.current = null;
    }

    if (frameIntervalRef.current) {
      window.clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }

    if (audioContextsRef.current) {
      try { audioContextsRef.current.input.close(); } catch (e) { }
      try { audioContextsRef.current.output.close(); } catch (e) { }
      audioContextsRef.current = null;
    }

    sourcesRef.current.forEach(s => { try { s.stop(); } catch (e) { } });
    sourcesRef.current.clear();
    nextStartTimeRef.current = 0;

    setIsLive(false);
    setIsCameraActive(false);
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  const startLiveSession = async (useCamera: boolean = false) => {
    try {
      setLoading(true);
      // @ts-ignore
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY || '';

      if (!apiKey) {
        console.error("Gemini API Key is missing for Live Mode! Check .env.local file.");
        alert("API Key is missing. Please check configuration.");
        setLoading(false);
        return;
      } else {
        console.log("Gemini API Key loaded for Live Mode (length: " + apiKey.length + ")");
      }

      const ai = new GoogleGenAI({ apiKey });

      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextsRef.current = { input: inputCtx, output: outputCtx };

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: useCamera ? { facingMode: 'user' } : false
      });

      if (videoRef.current && useCamera) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-latest',
        callbacks: {
          onopen: () => {
            const micSource = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
              const pcmBlob = { data: encodeBase64(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
              sessionPromise.then((s) => s.sendRealtimeInput({ media: pcmBlob }));
            };
            micSource.connect(scriptProcessor);
            // Create a gain node with 0 gain to prevent feedback (hearing yourself)
            const muteNode = inputCtx.createGain();
            muteNode.gain.value = 0;
            scriptProcessor.connect(muteNode);
            muteNode.connect(inputCtx.destination);

            if (useCamera) {
              frameIntervalRef.current = window.setInterval(() => {
                if (!videoRef.current || !canvasRef.current) return;
                const ctx = canvasRef.current.getContext('2d');
                if (ctx && videoRef.current.videoWidth > 0) {
                  canvasRef.current.width = videoRef.current.videoWidth;
                  canvasRef.current.height = videoRef.current.videoHeight;
                  ctx.drawImage(videoRef.current, 0, 0);
                  const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.5);
                  const base64 = dataUrl.split(',')[1];
                  sessionPromise.then(s => s.sendRealtimeInput({ media: { data: base64, mimeType: 'image/jpeg' } }));
                }
              }, 1000);
            }
          },
          onmessage: async (message: LiveServerMessage) => {
            const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData) {
              const buffer = await decodeAudioData(decodeBase64(audioData), outputCtx, 24000, 1);
              const sourceNode = outputCtx.createBufferSource();
              sourceNode.buffer = buffer;
              sourceNode.connect(outputCtx.destination);
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
              sourceNode.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(sourceNode);
              sourceNode.onended = () => sourcesRef.current.delete(sourceNode);
            }
            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => { try { s.stop(); } catch (e) { } });
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onclose: () => stopLiveSession(),
          onerror: (e) => stopLiveSession()
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: 'You are an agricultural assistant. You can see through the camera and hear the user. Help with farming tasks, soil health, and techniques. Be brief and practical.'
        }
      });

      sessionPromiseRef.current = sessionPromise;
      setIsLive(true);
    } catch (err) {
      console.error(err);
      alert("Microphone and camera permissions are required for the assistant.");
      stopLiveSession();
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input || loading || isLive) return;

    // Add user message to UI immediately
    const userMsg: ChatMessage = { role: 'user', text: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);

    // Clear input and set loading state
    const userInput = input; // Capture input for the API call
    setInput('');
    setLoading(true);

    try {
      // Create history from current messages (state hasn't updated yet in this closure, which is what we want)
      // We map the existing conversation to the format expect by the service
      const history = messages.map(msg => ({
        role: msg.role === 'model' ? 'model' : 'user',
        parts: [{ text: msg.text }]
      }));

      const response = await chatWithAgriBot(history, userInput);

      setMessages(prev => [...prev, {
        role: 'model',
        text: response || "Something went wrong. Please try again.",
        timestamp: Date.now()
      }]);
    } catch (err) {
      console.error("Chat Error:", err);
      setMessages(prev => [...prev, {
        role: 'model',
        text: "Service is currently unavailable. Please check your connection or API key.",
        timestamp: Date.now()
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-stone-50 overflow-hidden">
      <div className="bg-white border-b border-stone-100 p-3 shadow-sm shrink-0 z-20">
        <div className="flex items-center justify-center relative">
          <h2 className="text-xs font-black text-stone-800 uppercase tracking-[0.2em]">AgriBot Assistant</h2>
          {isLive && (
            <div className="absolute right-0 flex items-center gap-1.5 bg-emerald-50 px-2 py-1 rounded-full">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-tighter">Live</span>
            </div>
          )}
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
        <div className="max-w-xl mx-auto space-y-4 pb-2">
          {isCameraActive && (
            <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-500 shadow-xl bg-black aspect-video flex items-center justify-center animate-in zoom-in-95 duration-300">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              <canvas ref={canvasRef} className="hidden" />
              <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/60 text-white text-[10px] px-3 py-1.5 rounded-full backdrop-blur-md border border-white/20">
                <i className="fa-solid fa-eye text-emerald-400 animate-pulse"></i>
                <span className="font-bold uppercase tracking-widest">AgriVision AI Active</span>
              </div>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
              <div className={`max-w-[85%] p-3.5 rounded-2xl text-[13px] shadow-sm ${msg.role === 'user' ? 'bg-emerald-600 text-white rounded-br-none' : 'bg-white text-stone-800 border border-stone-100 rounded-bl-none'
                }`}>
                <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                <span className={`text-[8px] mt-2 block opacity-50 font-medium ${msg.role === 'user' ? 'text-white' : 'text-stone-400'}`}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white px-3 py-2.5 rounded-2xl border border-stone-100 flex gap-1.5 items-center shadow-sm">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce delay-75"></div>
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce delay-150"></div>
                <span className="text-[10px] text-stone-400 ml-1 font-bold uppercase tracking-tighter">Thinking...</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Integrated Input Footer with Media Buttons on the Right */}
      <div className="px-4 py-3 bg-white border-t border-stone-100 shrink-0">
        <div className="flex gap-3 max-w-xl mx-auto items-end">
          {/* Unified Input Container */}
          <div className="flex-1 flex items-end gap-2 bg-stone-50 rounded-[1.5rem] px-4 py-2 border border-stone-200 shadow-inner focus-within:ring-2 focus-within:ring-emerald-500/10 focus-within:border-emerald-500/30 transition-all">

            {/* Growing Textarea on the Left */}
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={isLive ? "Speak now..." : "Type message..."}
              className="flex-1 bg-transparent border-none text-[13px] outline-none resize-none py-2 text-stone-800 placeholder:text-stone-300 font-medium max-h-32"
              disabled={isLive}
            />

            {/* Integrated Media Actions on the Right - Compact & Integrated */}
            <div className="flex items-center gap-1 mb-1 bg-white/50 p-1 rounded-full border border-stone-100/50">
              <button
                onClick={() => isLive ? stopLiveSession() : startLiveSession(false)}
                className={`w-7 h-7 flex items-center justify-center rounded-full transition-all ${isLive && !isCameraActive ? 'bg-red-500 text-white shadow-sm' : 'text-stone-400 hover:text-emerald-600 hover:bg-white'}`}
                title="Voice"
              >
                <i className={`fa-solid ${isLive && !isCameraActive ? 'fa-microphone-slash' : 'fa-microphone'} text-[10px]`}></i>
              </button>
              <button
                onClick={() => isLive && isCameraActive ? stopLiveSession() : startLiveSession(true)}
                className={`w-7 h-7 flex items-center justify-center rounded-full transition-all ${isLive && isCameraActive ? 'bg-emerald-500 text-white shadow-sm' : 'text-stone-400 hover:text-emerald-600 hover:bg-white'}`}
                title="Camera"
              >
                <i className="fa-solid fa-camera text-[10px]"></i>
              </button>
            </div>
          </div>

          {/* Separate Send Button outside the field */}
          <button
            onClick={handleSend}
            disabled={loading || !input.trim() || isLive}
            className="bg-emerald-700 text-white w-12 h-12 flex items-center justify-center rounded-[1.2rem] shadow-lg shadow-emerald-700/10 hover:bg-emerald-800 disabled:opacity-20 transition-all active:scale-90 shrink-0"
          >
            <i className="fa-solid fa-paper-plane text-sm"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
