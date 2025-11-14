// Unified Voice Assistant page with KAVI integration and financial context
import React, { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import { GoogleGenAI } from '@google/genai';
import { useVoiceStore, ConversationMode } from '../store/voiceStore';
import { getSystemInstruction } from '../utils/systemPrompts';
import { buildFinancialContext, formatFinancialContext } from '../utils/financialContext';
import { connectToGemini } from '../services/geminiService';
import { createBlob, decode, decodeAudioData } from '../services/audioUtils';
import { streamTextToSpeech, playElevenLabsAudio, getElevenLabsVoices } from '../services/elevenLabsService';
import base44 from '../api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription } from '../components/ui/alert';
import { 
  Mic, MicOff, Volume2, VolumeX, Sparkles, MessageSquare, Settings, 
  Send, TrendingUp, X, Loader2 
} from 'lucide-react';
import VoiceWaveform from '../components/voice/VoiceWaveform';
import ConversationHistory from '../components/voice/ConversationHistory';
import QuickCommands from '../components/voice/QuickCommands';
import { useAuth } from '../contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';

export default function VoiceAssistant() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const {
    currentMode,
    isRecording,
    isSpeaking,
    isConnected,
    isAmbientMode,
    apiError,
    userName,
    onboardingComplete,
    conversationHistories,
    elevenLabsApiKey,
    elevenLabsVoices,
    currentVoiceId,
    useElevenLabs,
    ttsProvider,
    elevenLabsVoiceSettings,
    setElevenLabsVoiceSettings,
    loadDemoConversations,
    outputAudioContext,
    _liveUserInput,
    _liveModelOutput,
    initialize,
    initializeAudio,
    setUserName,
    setMode,
    setIsConnected,
    setIsRecording,
    setIsSpeaking,
    toggleAmbientMode,
    setApiError,
    setElevenLabsApiKey,
    setElevenLabsVoices,
    updateLiveTranscription,
    finalizeTurn,
    resetLiveTranscriptions,
  } = useVoiceStore();

  const sessionPromiseRef = useRef(null);
  const audioContextRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const nextStartTimeRef = useRef(0);
  const playbackTokenRef = useRef(null);
  const audioSourceNodes = useRef(new Set()).current;
  const analyserRef = useRef(null);
  const animationFrameIdRef = useRef(null);

  const [audioData, setAudioData] = useState(new Uint8Array(0));
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [financialContext, setFinancialContext] = useState(null);
  const [tempApiKey, setTempApiKey] = useState(elevenLabsApiKey || '');
  const [geminiApiKey, setGeminiApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  const [tempTtsProvider, setTempTtsProvider] = useState(ttsProvider || 'auto');
  const [tempElevenStability, setTempElevenStability] = useState((elevenLabsVoiceSettings && elevenLabsVoiceSettings.stability) || 0.5);
  const [tempElevenSimilarity, setTempElevenSimilarity] = useState((elevenLabsVoiceSettings && elevenLabsVoiceSettings.similarity_boost) || 0.75);
  const [lastPlaybackDuration, setLastPlaybackDuration] = useState(null);

  // Sync userName with currently logged-in user from AuthContext
  useEffect(() => {
    if (auth.user) {
      const name = auth.user.full_name || auth.user.first_name || auth.user.username || 'my friend';
      setUserName(name);
      console.log('🔄 KAVI: Synced user name from auth:', name);
    }
  }, [auth.user, setUserName]);

  // Refresh financial context when user changes
  useEffect(() => {
    if (auth.user) {
      loadFinancialContext();
      console.log('🔄 KAVI: Refreshed financial context for user:', auth.user.id);
    }
  }, [auth.user?.id]);

  // Auto-refresh KAVI when transactions/invoices change
  // This subscribes to React Query cache and detects when data is invalidated
  useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      // Listen for successful query updates (after mutations)
      if (event?.type === 'updated') {
        const queryKey = event.query.queryKey;
        
        // Check if it's a transaction or invoice query
        const isRelevant = queryKey && Array.isArray(queryKey) && (
          queryKey.includes('transactions') ||
          queryKey.includes('invoices') ||
          queryKey.includes('user-dashboard') ||
          queryKey.includes('dashboard')
        );
        
        if (isRelevant) {
          console.log('📊 KAVI: Detected data update, refreshing context...', queryKey);
          // Debounce: only refresh if last refresh was > 2 seconds ago
          const now = Date.now();
          if (!window._kaviLastRefresh || now - window._kaviLastRefresh > 2000) {
            window._kaviLastRefresh = now;
            loadFinancialContext();
          }
        }
      }
    });
    
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [queryClient]);

  // Initialize on mount - Auto-complete onboarding
  useEffect(() => {
    initialize();
    
    // Auto-complete onboarding if not done
    if (!onboardingComplete) {
      // Initialize audio immediately
      initializeAudio();
    }
  }, [initialize, initializeAudio, onboardingComplete]);

  // Load Eleven Labs voices when API key is set
  useEffect(() => {
    if (elevenLabsApiKey && elevenLabsVoices.length === 0) {
      loadElevenLabsVoices();
    }
  }, [elevenLabsApiKey]);

  // Initialize audio context on user interaction
  useEffect(() => {
    const initAudio = () => {
      initializeAudio();
      window.removeEventListener('click', initAudio);
      window.removeEventListener('keydown', initAudio);
    };
    if (!outputAudioContext && onboardingComplete) {
      window.addEventListener('click', initAudio);
      window.addEventListener('keydown', initAudio);
    }
    return () => {
      window.removeEventListener('click', initAudio);
      window.removeEventListener('keydown', initAudio);
    };
  }, [initializeAudio, outputAudioContext, onboardingComplete]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Do not close the shared outputAudioContext here - it may be reused by the app.
      // Only stop active conversation resources.
      try {
        stopConversation();
      } catch (e) {
        console.error('Error during stopConversation on unmount:', e);
      }
    };
  }, []);

  // Auto-start ambient mode
  useEffect(() => {
    if (isAmbientMode && onboardingComplete && outputAudioContext) {
      startConversation();
      return () => {
        stopConversation();
      };
    }
  }, [isAmbientMode, onboardingComplete, outputAudioContext]);

  const loadFinancialContext = async () => {
    try {
      // Use enhanced buildFinancialContext which prioritizes React Query cache
      // This avoids DB calls by using data already loaded in the frontend
      const context = await buildFinancialContext();
      
      // Inject role and active business context from auth
      const businesses = auth.getBusinesses();
      const adminBiz = businesses.find(b => b.role === 'business_admin');
      const activeBiz = adminBiz || businesses[0] || null;
      const role = activeBiz ? activeBiz.role : null;
      
      const scoped = {
        ...context,
        business: activeBiz ? { business_name: activeBiz.name, id: activeBiz.id } : (context?.business || null),
        user: auth.user || context?.user || null,
        role,
      };
      
      setFinancialContext(scoped);
      
      // Log data source for debugging
      if (context?.dataSource === 'cache') {
        console.log(' KAVI context loaded from cache (no DB calls!)');
      } else {
        console.log(' KAVI context loaded from API (cache miss)');
      }
    } catch (error) {
      console.error(' Error loading financial context:', error);
    }
  };

  const loadElevenLabsVoices = async () => {
    if (!elevenLabsApiKey) {
      // Silently skip if no API key provided
      return;
    }
    try {
      const voices = await getElevenLabsVoices(elevenLabsApiKey);
      setElevenLabsVoices(voices);
    } catch (error) {
      // Only log to console, don't set API error since ElevenLabs is optional
      console.warn('ElevenLabs not configured (this is optional):', error.message);
    }
  };

  const stopOngoingSpeech = useCallback(() => {
    window.speechSynthesis.cancel();
    audioSourceNodes.forEach(source => {
      try { source.stop(); } catch (e) { /* ignore */ }
    });
    audioSourceNodes.clear();
    nextStartTimeRef.current = 0;
  }, [audioSourceNodes]);

  const stopConversation = useCallback(() => {
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
    
    setAudioData(new Uint8Array(0));
    
    sessionPromiseRef.current?.then((session) => session.close());
    
    audioContextRef.current?.close().catch(console.error);
    mediaStreamRef.current?.getTracks().forEach(track => track.stop());

    stopOngoingSpeech();

    audioContextRef.current = null;
    sessionPromiseRef.current = null;
    
    setIsRecording(false);
    setIsConnected(false);
    setIsSpeaking(false);
    resetLiveTranscriptions();
  }, [setIsRecording, setIsConnected, setIsSpeaking, resetLiveTranscriptions, stopOngoingSpeech]);

  const systemInstruction = useMemo(() => {
    const contextText = financialContext ? formatFinancialContext(financialContext) : '';
    return getSystemInstruction(currentMode, userName, isAmbientMode, contextText);
  }, [currentMode, userName, isAmbientMode, financialContext]);

  const startConversation = useCallback(async () => {
    if (useVoiceStore.getState().isRecording) return;

    // Use cached financial context - no need to refresh every time
    // Context is loaded on mount and can be manually refreshed if needed
    console.log(' Using cached financial context for faster response');

    // Ensure there's a usable output AudioContext (create if closed)
    let { outputAudioContext } = useVoiceStore.getState();
    if (!outputAudioContext) {
      setApiError('Click anywhere to initialize audio.');
      return;
    }
    // If closed, recreate it via initializeAudio and re-fetch
    if (outputAudioContext.state === 'closed') {
      try {
        initializeAudio();
        outputAudioContext = useVoiceStore.getState().outputAudioContext;
      } catch (e) {
        console.warn('Failed to recreate output audio context:', e);
      }
    }
    if (outputAudioContext && outputAudioContext.state === 'suspended') {
      await outputAudioContext.resume();
    }

    const apiKey = geminiApiKey || import.meta.env.VITE_GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) {
      setApiError('Gemini API key not found. Please set it in settings.');
      return;
    }
    
    resetLiveTranscriptions();
    setIsRecording(true);
    setIsLoading(true);
    nextStartTimeRef.current = 0;

    try {
      const ai = new GoogleGenAI({ apiKey });

      const sessionPromise = connectToGemini(ai, systemInstruction, {
        onopen: () => {
          setIsConnected(true);
          setApiError(null);
          setIsLoading(false);
        },
        onmessage: async (message) => {
          const userInput = message.serverContent?.inputTranscription?.text;
          const modelOutput = message.serverContent?.outputTranscription?.text;
          const isTurnComplete = !!message.serverContent?.turnComplete;
          updateLiveTranscription(userInput, modelOutput);
          
          const audioDataB64 = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
          const provider = ttsProvider || useVoiceStore.getState().ttsProvider || 'auto';

          // Helper: play ElevenLabs TTS if available
          const playEleven = async () => {
            if (!useElevenLabs || !elevenLabsApiKey || !currentVoiceId || !modelOutput) return;
            try {
              // Stop any ongoing speech before starting new one
              await stopOngoingSpeech();
              
              setIsSpeaking(true);
              const playbackToken = {};
              playbackTokenRef.current = playbackToken;

              // Use stored/selected voice settings
              const voiceSettings = (elevenLabsVoiceSettings) || { stability: tempElevenStability, similarity_boost: tempElevenSimilarity };
              const stream = await streamTextToSpeech(elevenLabsApiKey, currentVoiceId, modelOutput, voiceSettings);
              
              // Only proceed if this is still the active playback
              if (playbackTokenRef.current !== playbackToken) {
                return;
              }

              const elDuration = await playElevenLabsAudio(stream, outputAudioContext, (source) => {
                try {
                  if (source) {
                    audioSourceNodes.add(source);
                    try {
                      if (typeof source.onended !== 'undefined') {
                        const prev = source.onended;
                        source.onended = () => {
                          if (playbackTokenRef.current === playbackToken) {
                            audioSourceNodes.delete(source);
                            setIsSpeaking(false);
                            playbackTokenRef.current = null;
                          }
                          try { if (prev) prev(); } catch (e) {}
                        };
                      }
                    } catch (e) {}
                  }
                } catch (e) {
                  console.warn('Failed to register ElevenLabs source:', e);
                }
              });

              if (playbackTokenRef.current === playbackToken) {
                try { if (typeof elDuration === 'number') setLastPlaybackDuration(elDuration); } catch (e) {}
                setIsSpeaking(false);
                playbackTokenRef.current = null;
              }
            } catch (error) {
              console.error('Eleven Labs error:', error);
              setIsSpeaking(false);
              playbackTokenRef.current = null;
            }
          };

          // Behavior by provider preference
          if (provider === 'elevenlabs') {
            // Only speak via ElevenLabs when the turn is complete to avoid restarting on partial outputs
            if (isTurnComplete) {
              try { stopOngoingSpeech(); } catch (e) {}
              await playEleven();
            }
          } else if (provider === 'gemini') {
            // Only play Gemini inline audio if present; do not fallback to ElevenLabs
            if (audioDataB64) {
              setIsSpeaking(true);
              const audioBytes = decode(audioDataB64);
              const audioContext = useVoiceStore.getState().outputAudioContext;
              if (audioContext && audioBytes.length > 0) {
                try {
                  if (audioContext.state === 'suspended') {
                    await audioContext.resume();
                  }
                } catch (resumeErr) { console.warn('Failed to resume output audio context:', resumeErr); }

                try {
                  const audioBuffer = await decodeAudioData(audioBytes, audioContext, 24000, 1);
                  if (!audioBuffer || audioBuffer.duration === 0) throw new Error('Gemini audio buffer empty');
                  const now = audioContext.currentTime;
                  // Use the next scheduled start time to avoid gaps in playback
                  const startTime = Math.max(now, nextStartTimeRef.current);
                  const source = audioContext.createBufferSource();
                  source.buffer = audioBuffer;
                  source.connect(audioContext.destination);
                  source.onended = () => { try { audioSourceNodes.delete(source); } catch (e) {} if (audioSourceNodes.size === 0) setIsSpeaking(false); };
                  audioSourceNodes.add(source);
                  try { setLastPlaybackDuration(audioBuffer.duration); } catch (e) {}
                  source.start(startTime);
                  nextStartTimeRef.current = startTime + audioBuffer.duration;
                } catch (e) {
                  console.error('Error playing Gemini audio (provider=gemini):', e);
                  setIsSpeaking(false);
                }
              }
            }
          } else {
            // auto: prefer Gemini inline audio, fallback to ElevenLabs when no Gemini audio or Gemini playback fails
            if (audioDataB64) {
              setIsSpeaking(true);
              const audioBytes = decode(audioDataB64);
              const audioContext = useVoiceStore.getState().outputAudioContext;
              if (audioContext && audioBytes.length > 0) {
                try {
                  if (audioContext.state === 'suspended') {
                    await audioContext.resume();
                  }
                } catch (resumeErr) { console.warn('Failed to resume output audio context:', resumeErr); }

                try {
                  const audioBuffer = await decodeAudioData(audioBytes, audioContext, 24000, 1);
                  if (!audioBuffer || audioBuffer.duration === 0) throw new Error('Gemini audio buffer empty');
                  const now = audioContext.currentTime;
                  // Use the next scheduled start time to avoid gaps in playback
                  const startTime = Math.max(now, nextStartTimeRef.current);
                  const source = audioContext.createBufferSource();
                  source.buffer = audioBuffer;
                  source.connect(audioContext.destination);
                  source.onended = () => { try { audioSourceNodes.delete(source); } catch (e) {} if (audioSourceNodes.size === 0) setIsSpeaking(false); };
                  audioSourceNodes.add(source);
                  try { setLastPlaybackDuration(audioBuffer.duration); } catch (e) {}
                  source.start(startTime);
                  nextStartTimeRef.current = startTime + audioBuffer.duration;
                } catch (e) {
                  console.error('Error playing Gemini audio:', e);
                  try { audioSourceNodes.forEach((s) => { try { if (s && typeof s.stop === 'function') s.stop(); } catch (ee) {} }); audioSourceNodes.clear(); } catch (cleanupErr) { console.warn('Error cleaning up audio sources after playback failure:', cleanupErr); }
                  // fallback to ElevenLabs only when turn is complete
                  if (isTurnComplete && useElevenLabs && elevenLabsApiKey && currentVoiceId && modelOutput) {
                    console.warn('Falling back to ElevenLabs TTS due to Gemini playback failure');
                    try { stopOngoingSpeech(); } catch (e) {}
                    await playEleven();
                  }
                  setIsSpeaking(false);
                }
              }
            } else {
              // No Gemini audio; try ElevenLabs only when turn is complete
              if (isTurnComplete && useElevenLabs && elevenLabsApiKey && currentVoiceId && modelOutput) {
                try { stopOngoingSpeech(); } catch (e) {}
                await playEleven();
              }
            }
          }

          if (message.serverContent?.interrupted) {
            stopOngoingSpeech();
          }

          if (message.serverContent?.turnComplete) {
            const groundingChunks = message.serverContent?.groundingMetadata?.groundingChunks;
            let sources;
            if (groundingChunks) {
              sources = groundingChunks.map(chunk => ({
                uri: chunk.web?.uri || '',
                title: chunk.web?.title || 'Source'
              })).filter(source => source.uri);
            }
            
            // Save conversation
            const { _turnUserInput, _liveModelOutput } = useVoiceStore.getState();
            if (_turnUserInput || _liveModelOutput) {
              await base44.entities.VoiceConversation.create({
                user_input: _turnUserInput || '',
                ai_response: _liveModelOutput || '',
                intent: 'general_help',
                action_taken: '',
                conversation_date: new Date().toISOString()
              });
            }
            
            finalizeTurn(sources);
            resetLiveTranscriptions();
            await loadFinancialContext(); // Refresh financial context
          }
        },
        onerror: (e) => {
          console.error('Session error:', e);
          setApiError('Connection error. Check API key and network.');
          setIsLoading(false);
          stopConversation();
        },
        onclose: () => {
          stopConversation();
        },
      });

      sessionPromiseRef.current = sessionPromise;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
      
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      const scriptProcessor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
      
      scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
        const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
        const pcmBlob = createBlob(inputData);
        sessionPromiseRef.current?.then((session) => {
          session.sendRealtimeInput({ media: pcmBlob });
        });
      };
      
      source.connect(analyserRef.current);
      analyserRef.current.connect(scriptProcessor);
      scriptProcessor.connect(audioContextRef.current.destination);
      
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      const visualize = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        setAudioData(new Uint8Array(dataArray));
        animationFrameIdRef.current = requestAnimationFrame(visualize);
      };
      visualize();

    } catch (error) {
      console.error('Microphone access error:', error);
      let errorMessage = 'Microphone access is required.';
      if (error.name === 'NotFoundError') {
        errorMessage = 'No microphone found. Please connect a microphone and try again.';
      } else if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage = 'Microphone permission denied. Please allow microphone access in your browser settings.';
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorMessage = 'Microphone is being used by another application. Please close other apps and try again.';
      }
      setApiError(errorMessage);
      setIsRecording(false);
      setIsLoading(false);
    }
  }, [
    systemInstruction, stopConversation, setApiError, 
    resetLiveTranscriptions, setIsRecording, setIsConnected, 
    updateLiveTranscription, finalizeTurn, setIsSpeaking, audioSourceNodes, stopOngoingSpeech,
    geminiApiKey, elevenLabsApiKey, currentVoiceId, useElevenLabs, outputAudioContext, ttsProvider
  ]);

  const handleMicClick = async () => {
    // This click is a user gesture — ensure audio context is created/resumed here to allow playback
    initializeAudio();
    // Try to resume the shared output audio context (user gesture should allow it)
    try {
      const ctx = useVoiceStore.getState().outputAudioContext;
      if (ctx && (ctx.state === 'suspended' || ctx.state === 'running')) {
        try {
          await ctx.resume();
        } catch (e) {
          // ignore resume failures, we'll still attempt playback which may use HTMLAudio fallback
          console.warn('AudioContext resume on user gesture failed:', e);
        }
      }
    } catch (e) {
      console.warn('Error while trying to resume audio context on click:', e);
    }

    if (isAmbientMode) return;
    if (isSpeaking || isRecording) {
      stopConversation();
    } else {
      startConversation();
    }
  };

  const enableAudio = async () => {
    // Ensure audio context is created and resumed (user gesture)
    initializeAudio();
    try {
      let ctx = useVoiceStore.getState().outputAudioContext;
      if (!ctx) {
        // try creating again
        initializeAudio();
        ctx = useVoiceStore.getState().outputAudioContext;
      }
      if (!ctx) {
        setApiError('Browser audio not supported or blocked.');
        return false;
      }
      if (ctx.state === 'suspended') {
        try {
          await ctx.resume();
        } catch (e) {
          console.warn('Failed to resume audio context:', e);
        }
      }
      if (ctx.state === 'running') {
        setApiError(null);
        return true;
      }
    } catch (e) {
      console.warn('enableAudio error:', e);
      setApiError('Failed to enable audio. Check browser permissions.');
    }
    return false;
  };

  const playTestTone = async () => {
    try {
      const ok = await enableAudio();
      const ctx = useVoiceStore.getState().outputAudioContext;
      if (!ok || !ctx) {
        setApiError('Unable to play test tone: audio not available.');
        return;
      }
      // Create a short, quiet sine tone so we can hear output
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 660;
      gain.gain.value = 0.03; // low volume
      osc.connect(gain);
      gain.connect(ctx.destination);
      try { if (ctx.state === 'suspended') await ctx.resume(); } catch (e) {}
      osc.start();
      setIsSpeaking(true);
      setTimeout(() => {
        try { osc.stop(); } catch (e) {}
        setIsSpeaking(false);
      }, 450);
    } catch (e) {
      console.error('playTestTone failed:', e);
      setApiError('Test tone failed: ' + String(e));
      setIsSpeaking(false);
    }
  };

  const handleTextSubmit = async (e) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    
    // Simulate voice input for text
    updateLiveTranscription(textInput, null);
    setIsRecording(true);
    setIsLoading(true);
    
    try {
      // Process text as if it was voice input
      // For now, we'll need to send it directly to Gemini
      // This is a simplified version - you'd want to properly integrate text input
      await startConversation();
      // Note: Full text integration would require modifying Gemini service
    } catch (error) {
      console.error('Error processing text:', error);
      setApiError('Error processing text input.');
    }
    
    setTextInput('');
  };

  const handleQuickCommand = (command) => {
    setTextInput(command);
    // Auto-start conversation if not already started
    if (!isRecording) {
      setTimeout(() => {
        handleTextSubmit({ preventDefault: () => {} });
      }, 100);
    }
  };

  const handleSaveSettings = () => {
    setElevenLabsApiKey(tempApiKey);
    if (tempApiKey) {
      loadElevenLabsVoices();
    }
    if (geminiApiKey) {
      localStorage.setItem('gemini_api_key', geminiApiKey);
    }
    // Persist TTS provider preference
    useVoiceStore.getState().setTtsProvider(tempTtsProvider);
    // Persist ElevenLabs voice settings
    try {
      const settings = { stability: tempElevenStability, similarity_boost: tempElevenSimilarity };
      setElevenLabsVoiceSettings(settings);
    } catch (e) { console.warn('Failed to save ElevenLabs voice settings', e); }
    setIsSettingsOpen(false);
  };

  const conversationHistory = conversationHistories[currentMode] || [];

  if (!onboardingComplete) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center p-4">
        <div className="inline-block p-5 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full mb-6 shadow-2xl">
          <Sparkles className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to KAVI</h1>
        <p className="text-lg text-gray-600 mb-8">Your AI Financial Voice Assistant</p>
        <div className="w-full max-w-sm space-y-4">
          <Input
            type="text"
            placeholder="Enter your name"
            value={userName || ''}
            onChange={(e) => {
              const name = e.target.value;
              if (name.trim()) {
                setUserName(name.trim());
              }
            }}
            className="text-center"
            autoFocus
          />
          <Button
            onClick={() => userName && setUserName(userName)}
            disabled={!userName?.trim()}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600"
          >
            Let's Begin
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6 bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-purple-600" />
            KAVI - AI Voice Assistant
          </h1>
          <p className="text-gray-600 mt-1">Sema na AI yako - Get instant financial insights</p>
        </div>
        <Button
          variant="outline"
          onClick={() => setIsSettingsOpen(!isSettingsOpen)}
        >
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </Button>
      </div>

      {/* User Context Banner */}
      {auth.user && financialContext && (
        <div className="space-y-3">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-4 shadow-lg">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-bold text-lg">
                  {(auth.user.full_name || auth.user.username || 'U')[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-sm">Talking to</p>
                  <p className="text-lg font-bold">{auth.user.full_name || auth.user.username}</p>
                </div>
              </div>
              {financialContext.business && (
                <div className="text-right">
                  <p className="text-sm opacity-90">Business</p>
                  <p className="font-semibold">{financialContext.business.business_name}</p>
                </div>
              )}
              <Button
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/20"
                onClick={loadFinancialContext}
              >
                🔄 Refresh Data
              </Button>
            </div>
          </div>
          
          {/* No Data Warning */}
          {financialContext && 
           (!financialContext.transactions || financialContext.transactions.length === 0) && 
           (!financialContext.invoices || financialContext.invoices.length === 0) && (
            <Alert className="bg-amber-50 border-amber-200">
              <AlertDescription className="text-amber-800">
                <div className="flex items-start gap-2">
                  <span className="text-lg">⚠️</span>
                  <div>
                    <p className="font-semibold mb-1">No financial data found</p>
                    <p className="text-sm">
                      KAVI needs data to provide insights. Please:
                    </p>
                    <ol className="text-sm mt-2 ml-4 list-decimal space-y-1">
                      <li>Ensure you're assigned to a business (contact admin)</li>
                      <li>Create some transactions in the "Transactions" page</li>
                      <li>Create some invoices in the "Invoices" page</li>
                      <li>Click "🔄 Refresh Data" above</li>
                    </ol>
                    <p className="text-sm mt-2 italic">
                      See <strong>KAVI_NO_DATA_FIX.md</strong> for detailed troubleshooting.
                    </p>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Error Alert */}
      {apiError && (
        <Alert className="bg-red-50 border-red-200">
          <AlertDescription className="text-red-800">{apiError}</AlertDescription>
        </Alert>
      )}

      {/* Settings Panel */}
      {isSettingsOpen && (
        <Card className="border-none shadow-lg bg-white">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Settings</span>
              <Button variant="ghost" size="sm" onClick={() => setIsSettingsOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Gemini API Key</Label>
              <Input
                type="password"
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                placeholder="Enter Gemini API key"
              />
              <p className="text-xs text-gray-500">
                Required for voice conversation. Get it from{' '}
                <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  Google AI Studio
                </a>
              </p>
            </div>

            <div className="space-y-2">
              <Label>ElevenLabs API Key (Optional)</Label>
              <Input
                type="password"
                value={tempApiKey}
                onChange={(e) => setTempApiKey(e.target.value)}
                placeholder="Enter ElevenLabs API key"
              />
              <p className="text-xs text-gray-500">
                Optional: For better voice quality. Get it from{' '}
                <a href="https://elevenlabs.io" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  ElevenLabs
                </a>
              </p>
            </div>

            <div className="space-y-2">
              <Button variant="outline" onClick={() => {
                // seed demo data for a demo user
                const demoConvs = Object.values(ConversationMode).reduce((acc, mode) => {
                  acc[mode] = [
                    { id: `user-demo-${mode}`, role: 'user', text: 'Hi KAVI, show me my cash flow forecast.' },
                    { id: `model-demo-${mode}`, role: 'model', text: 'Sure — your 30-day forecast shows a modest surplus. Expect higher inflows next week.' }
                  ];
                  return acc;
                }, {});
                try {
                  useVoiceStore.getState().loadDemoConversations(demoConvs);
                  setUserName('Demo User');
                  setFinancialContext({
                    last7Days: { net: 12500 },
                    last30Days: { net: 54000 },
                    invoices: { overdue: 2 }
                  });
                  setIsSettingsOpen(false);
                } catch (e) {
                  console.warn('Failed to load demo data', e);
                }
              }}>
                Load Demo Data
              </Button>
            </div>

            <div className="space-y-2">
              <Label>TTS Provider</Label>
              <select
                value={tempTtsProvider}
                onChange={(e) => setTempTtsProvider(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="auto">Auto (Gemini preferred, ElevenLabs fallback)</option>
                <option value="gemini">Gemini only</option>
                <option value="elevenlabs">ElevenLabs only</option>
              </select>
              <p className="text-xs text-gray-500">Choose which TTS source should speak. 'Auto' uses Gemini first then ElevenLabs as fallback.</p>
            </div>

              <div className="space-y-2">
                <Label>ElevenLabs Voice Style</Label>
                <div className="space-y-1">
                  <label className="text-xs text-gray-600">Stability: {tempElevenStability.toFixed(2)}</label>
                  <input type="range" min="0" max="1" step="0.01" value={tempElevenStability} onChange={(e) => setTempElevenStability(Number(e.target.value))} className="w-full" />
                  <label className="text-xs text-gray-600">Similarity boost: {tempElevenSimilarity.toFixed(2)}</label>
                  <input type="range" min="0" max="1" step="0.01" value={tempElevenSimilarity} onChange={(e) => setTempElevenSimilarity(Number(e.target.value))} className="w-full" />
                  <p className="text-xs text-gray-500">Tune ElevenLabs voice to better match Gemini style (experiment with values).</p>
                </div>
              </div>

            {elevenLabsVoices.length > 0 && (
              <div className="space-y-2">
                <Label>Voice</Label>
                <select
                  value={currentVoiceId || ''}
                  onChange={(e) => useVoiceStore.getState().setVoiceId(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  {elevenLabsVoices.map((voice) => (
                    <option key={voice.voice_id} value={voice.voice_id}>
                      {voice.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Audio Test</Label>
              <div className="flex gap-2">
                <Button variant="outline" onClick={async () => { const ok = await enableAudio(); if (!ok) { setApiError('Unable to enable audio. Click anywhere in the app and try again.'); } }}>
                  Enable Audio
                </Button>
                <Button onClick={playTestTone} className="bg-gradient-to-r from-purple-600 to-indigo-600">
                  Play Test Tone
                </Button>
              </div>
              <p className="text-xs text-gray-500">Use these to ensure your browser allows audio playback. Click Enable Audio first if needed.</p>
            </div>

            <div className="flex items-center justify-between">
              <Label>Ambient Mode</Label>
              <button
                onClick={toggleAmbientMode}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                  isAmbientMode ? 'bg-purple-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ${
                    isAmbientMode ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <Button onClick={handleSaveSettings} className="w-full bg-gradient-to-r from-purple-600 to-indigo-600">
              Save Settings
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Conversation Area */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-lg bg-gradient-to-br from-purple-100 to-indigo-100">
            <CardContent className="p-8">
              <div className="flex flex-col items-center justify-center space-y-6">
                {isRecording && <VoiceWaveform isActive={isRecording} audioData={audioData} />}
                
                {!isRecording && !isLoading && (
                  <div className="text-center">
                    <div className="w-32 h-32 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-2xl animate-pulse">
                      <Mic className="w-16 h-16 text-white" />
                    </div>
                    <p className="text-xl font-semibold text-gray-900">Ready to listen</p>
                    <p className="text-gray-600 mt-2">Tap the button below and ask anything about your finances</p>
                  </div>
                )}

                {isLoading && (
                  <div className="text-center">
                    <div className="w-32 h-32 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-2xl">
                      <Loader2 className="w-16 h-16 text-white animate-spin" />
                    </div>
                    <p className="text-xl font-semibold text-gray-900">Connecting...</p>
                    <p className="text-gray-600 mt-2">Setting up voice conversation</p>
                  </div>
                )}

                {(_liveUserInput || _liveModelOutput) && (
                  <div className="w-full space-y-3">
                    {_liveUserInput && (
                      <Alert className="bg-blue-50 border-blue-200">
                        <MessageSquare className="w-4 h-4 text-blue-600" />
                        <AlertDescription className="text-blue-800">
                          <strong>You said:</strong> {_liveUserInput}
                        </AlertDescription>
                      </Alert>
                    )}
                    {_liveModelOutput && (
                      <Alert className="bg-purple-50 border-purple-200">
                        <Sparkles className="w-4 h-4 text-purple-600" />
                        <AlertDescription className="text-purple-800">
                          <strong>KAVI:</strong> {_liveModelOutput}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}

                <div className="flex gap-4">
                  {!isRecording ? (
                    <Button
                      onClick={handleMicClick}
                      size="lg"
                      disabled={isLoading}
                      className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 px-8"
                    >
                      <Mic className="w-5 h-5 mr-2" />
                      Start Listening
                    </Button>
                  ) : (
                    <Button
                      onClick={handleMicClick}
                      size="lg"
                      variant="destructive"
                      className="px-8"
                    >
                      <MicOff className="w-5 h-5 mr-2" />
                      Stop
                    </Button>
                  )}

                  {isSpeaking && (
                    <Button
                      onClick={stopOngoingSpeech}
                      size="lg"
                      variant="outline"
                    >
                      <VolumeX className="w-5 h-5 mr-2" />
                      Stop Speaking
                    </Button>
                  )}
                </div>

                <div className="w-full">
                  <form onSubmit={handleTextSubmit} className="flex gap-2">
                    <Input
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder="Or type your question here..."
                      className="flex-1"
                    />
                    <Button type="submit" disabled={isLoading || !textInput.trim()}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>
                </div>
              </div>
            </CardContent>
          </Card>

          <ConversationHistory conversations={conversationHistory.map(msg => ({
            id: msg.id,
            user_input: msg.role === 'user' ? msg.text : '',
            ai_response: msg.role === 'model' ? msg.text : '',
            intent: 'general_help',
            conversation_date: new Date().toISOString(),
            action_taken: ''
          }))} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <QuickCommands onCommand={handleQuickCommand} />
          
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Conversation Mode</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {Object.values(ConversationMode).map((mode) => (
                <Button
                  key={mode}
                  variant={currentMode === mode ? 'default' : 'outline'}
                  className="w-full justify-start"
                  onClick={() => setMode(mode)}
                >
                  {mode}
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Audio Debug</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">TTS Provider:</span>
                <span className="font-semibold">{ttsProvider || useVoiceStore.getState().ttsProvider || 'auto'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">AudioContext:</span>
                <span className="font-semibold">{(outputAudioContext && outputAudioContext.state) || 'none'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Active Sources:</span>
                <span className="font-semibold">{audioSourceNodes ? audioSourceNodes.size : 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Playback (s):</span>
                <span className="font-semibold">{lastPlaybackDuration ? lastPlaybackDuration.toFixed(2) : '-'}</span>
              </div>
                <div className="flex gap-2 mt-3">
                  <Button variant="outline" size="sm" onClick={enableAudio}>Enable Audio</Button>
                  <Button variant="ghost" size="sm" onClick={playTestTone}>Play Test Tone</Button>
                </div>
            </CardContent>
          </Card>

          {financialContext && (
            <Card className="border-none shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Financial Status
                  </CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={loadFinancialContext}
                    className="h-8 w-8 p-0"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="p-3 bg-gray-50 rounded-lg space-y-2">
                  <div className="text-xs text-gray-500 font-medium">Business: {financialContext.business?.business_name || financialContext.business?.legal_name || financialContext.business?.name}</div>
                  <div className="text-xs text-gray-500">User: {financialContext.user?.full_name || financialContext.user?.first_name}</div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">7 Day Income:</span>
                  <span className="font-semibold text-green-600">
                    KES {(financialContext.last7Days?.income || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">7 Day Expenses:</span>
                  <span className="font-semibold text-red-600">
                    KES {(financialContext.last7Days?.expenses || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">7 Day Net:</span>
                  <span className="font-semibold text-blue-600">
                    KES {(financialContext.last7Days?.net || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">30 Day Net:</span>
                  <span className="font-semibold text-blue-600">
                    KES {(financialContext.last30Days?.net || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Overdue Invoices:</span>
                  <span className="font-semibold text-red-600">
                    {financialContext.invoices?.overdue || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Transactions:</span>
                  <span className="font-semibold">
                    {financialContext.transactions?.total || 0}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
