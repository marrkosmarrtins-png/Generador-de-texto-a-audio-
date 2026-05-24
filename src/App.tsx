import React, { useState, useEffect, useRef } from "react";
import { 
  Key, 
  Save, 
  ExternalLink, 
  Volume2, 
  Play, 
  Pause, 
  Download, 
  Loader2, 
  Mic2, 
  Sparkles, 
  Trash2, 
  HelpCircle, 
  X, 
  Check, 
  VolumeX, 
  RefreshCw, 
  Music,
  Maximize2
} from "lucide-react";
import { GEMINI_VOICES, VOICE_DETAILS, PRESET_PHRASES } from "./types";
import { pcmBase64ToWavBlob } from "./utils";

export default function App() {
  // --- Estados de Clave API ---
  const [apiKey, setApiKey] = useState<string>("");
  const [tempApiKey, setTempApiKey] = useState<string>("");
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState<boolean>(false);
  const [keySavedMessage, setKeySavedMessage] = useState<boolean>(false);

  // --- Estados de Síntesis de Audio ---
  const [text, setText] = useState<string>(
    "¡Hola! Bienvenido al generador de texto a voz realista. Selecciona mi voz preferida de la lista, presiona el botón Generar y escucha la magia."
  );
  const [selectedVoice, setSelectedVoice] = useState<string>("Kore");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationStep, setGenerationStep] = useState<string>("");

  // --- Estados del Reproductor de Audio ---
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // --- Mensajes de Feedback ---
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // --- Referencia Elemento Audio ---
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Inicialización de Estados
  useEffect(() => {
    // Intentar leer la Clave API del almacenamiento local
    const savedKey = localStorage.getItem("gemini_tts_api_key");
    if (savedKey) {
      setApiKey(savedKey);
      setTempApiKey(savedKey);
    }
  }, []);

  // Sincronizar duración y tiempo actual del audio nativo
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [audioUrl]);

  // Manejar cambios de volumen
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Guardar clave API en localStorage permanentemente
  const saveApiKey = () => {
    const trimmedKey = tempApiKey.trim();
    localStorage.setItem("gemini_tts_api_key", trimmedKey);
    setApiKey(trimmedKey);
    setKeySavedMessage(true);
    setTimeout(() => setKeySavedMessage(false), 3000);
    setIsApiKeyModalOpen(false);
    
    if (trimmedKey) {
      setSuccess("¡Clave de API guardada permanentemente con éxito!");
      setError(null);
    } else {
      setSuccess("Clave de API eliminada.");
    }
  };

  // Función para abrir el enlace oficial de obtención de clave
  const openApiKeyLink = () => {
    window.open("https://aistudio.google.com/app/apikey", "_blank", "noopener,noreferrer");
  };

  // Llamada al backend para sintetizar el texto
  const handleGenerateSpeech = async () => {
    if (!text.trim()) {
      setError("Por favor escribe o selecciona un texto para generar el audio.");
      return;
    }

    setError(null);
    setIsGenerating(true);
    
    // Simulación de pasos animados para entretener al usuario
    const steps = [
      "Iniciando comunicación con el servidor...",
      "Configurando entorno de voz de Gemini...",
      `Sintetizando ondas neuronales para la voz: '${selectedVoice}'...`,
      "Generando flujo binario PCM de 24,000 Hz...",
      "Empaquetando en un archivo contenedor de baja latencia WAV...",
      "¡Cargando reproductor interactivo!"
    ];

    let stepIdx = 0;
    setGenerationStep(steps[0]);
    const stepInterval = setInterval(() => {
      if (stepIdx < steps.length - 1) {
        stepIdx++;
        setGenerationStep(steps[stepIdx]);
      }
    }, 700);

    try {
      // Detener cualquier audio previo
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }

      const response = await fetch("/api/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: text.trim(),
          voice: selectedVoice,
          apiKeyOverride: apiKey || undefined, // pasar clave personalizada si existe, sino el server fallback
        }),
      });

      const data = await response.json();
      clearInterval(stepInterval);

      if (!response.ok) {
        throw new Error(data.error || "Ocurrió un error inesperado al procesar tu solicitud.");
      }

      if (!data.audio) {
        throw new Error("No se devolvieron datos de audio legítimos del motor de renderizado.");
      }

      // Convertir el base64 de vuelta a un Blob WAV
      const wavBlob = pcmBase64ToWavBlob(data.audio, 24000);
      const url = URL.createObjectURL(wavBlob);
      
      setAudioUrl(url);
      setSuccess(`¡Audio generado exitosamente usando la voz de '${selectedVoice}'!`);
      
      // Auto-reproducir inmediatamente
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.play()
            .then(() => setIsPlaying(true))
            .catch((e) => console.log("Auto-play bloqueado por políticas del navegador:", e));
        }
      }, 150);

    } catch (err: any) {
      clearInterval(stepInterval);
      console.error(err);
      setError(err.message || "Error al conectar con el servidor.");
    } finally {
      setIsGenerating(false);
      setGenerationStep("");
    }
  };

  // Administrador de Reproducción
  const togglePlayPause = () => {
    if (!audioRef.current || !audioUrl) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.error("Error al reproducir:", err);
          setError("No se pudo iniciar la reproducción. Intenta de nuevo.");
        });
    }
  };

  // Avanzar / Retroceder el reproductor mediante la barra de progreso
  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  // Función para Descargar el Audio .wav
  const downloadAudioFile = () => {
    if (!audioUrl) return;
    
    const cleanTextSlug = text
      .toLowerCase()
      .slice(0, 15)
      .replace(/[^a-z0-9]/g, "-") || "audio";
      
    const filename = `gemini-tts-${selectedVoice}-${cleanTextSlug}.wav`;
    
    const link = document.createElement("a");
    link.href = audioUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Formateador de segundos de audio a MM:SS
  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  // Limpiar texto de entrada
  const clearTextInput = () => {
    setText("");
    setError(null);
  };

  return (
    <div id="app_root" className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* HEADER DE LA APLICACIÓN */}
      <header id="app_header" className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Logo y Nombre */}
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2.5 rounded-xl text-white shadow-lg shadow-indigo-500/10 flex items-center justify-center border border-indigo-400/20">
              <Mic2 className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Gemini <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 font-extrabold">Vox Studio</span>
              </h1>
              <p className="text-xs text-slate-400">Generación Inteligente de Texto a Voz Realista</p>
            </div>
          </div>

          {/* Menú Superior y Clave API */}
          <div className="flex items-center gap-2.5">
            {/* Indicador de Clave API actual */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-xs">
              <span className={`w-2.5 h-2.5 rounded-full ${apiKey ? 'bg-emerald-500 shadow-emerald-500/25 animate-ping' : 'bg-amber-500 shadow-amber-500/25'}`}></span>
              <span className={apiKey ? 'text-emerald-400 font-medium' : 'text-amber-400'}>
                {apiKey ? 'API Key: Personalizada' : 'API Key: Servidor / No configurada'}
              </span>
            </div>

            {/* Botones del Diálogo de API Key */}
            <button
              id="btn_api_key_settings"
              onClick={() => setIsApiKeyModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 hover:text-white transition rounded-xl border border-slate-700 shadow-sm"
            >
              <Key className="w-4 h-4 text-indigo-400" />
              <span>Configurar Clave API</span>
            </button>
          </div>

        </div>
      </header>

      {/* BODY DE LA APLICACIÓN */}
      <main id="app_main" className="flex-grow max-w-6xl w-full mx-auto px-4 py-6 md:py-10 flex flex-col gap-8">
        
        {/* Notificaciones y Estados */}
        {(error || success) && (
          <div className="mt-2 transition-all">
            {error && (
              <div id="alert_error" className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-start gap-3 text-sm text-rose-300 shadow-md">
                <span className="bg-rose-500/20 p-1 rounded-lg text-rose-400 mt-0.5">⚠️</span>
                <div className="flex-1">
                  <span className="font-bold">Error:</span> {error}
                </div>
                <button onClick={() => setError(null)} className="text-rose-400 hover:text-white transition font-medium">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            
            {success && (
              <div id="alert_success" className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-start gap-3 text-sm text-emerald-300 shadow-md">
                <span className="bg-emerald-500/20 p-1 rounded-lg text-emerald-400 mt-0.5">✅</span>
                <div className="flex-1">
                  {success}
                </div>
                <button onClick={() => setSuccess(null)} className="text-emerald-400 hover:text-white transition font-medium">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* COLUMNA IZQUIERDA Y CENTRAL: TEXTO & CONTROL (2/3 de ancho) */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            {/* MÓDULO 1: ENTRADA DE TEXTO */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-indigo-400 text-lg">📝</span>
                  <h2 className="text-lg font-bold text-white">Texto de Entrada</h2>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 bg-slate-800 px-2.5 py-1 rounded-lg">
                    {text.length} caracteres
                  </span>
                  <button
                    onClick={clearTextInput}
                    className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-red-400 transition rounded-lg"
                    title="Limpiar texto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Text Area */}
              <div className="relative group">
                <textarea
                  id="textarea_input"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Escribe o pega el texto que deseas que Gemini lea en voz alta..."
                  className="w-full h-48 bg-slate-950 border border-slate-800 focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/10 rounded-2xl p-4 text-slate-100 placeholder:text-slate-600 resize-none outline-none transition duration-200 text-base"
                  maxLength={1000}
                />
                <div className="absolute bottom-3 right-3 text-[10px] text-slate-600 font-mono">
                  Límite sugerido: 1000 caract.
                </div>
              </div>

              {/* Presets / Frases rápidas */}
              <div className="pt-2">
                <label className="text-xs text-slate-400 font-medium block mb-2">¿Sin ideas? Prueba una frase rápida para evaluar tonos:</label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_PHRASES.map((phrase, idx) => (
                    <button
                      key={idx}
                      onClick={() => setText(phrase.text)}
                      className="text-xs px-3 py-1.5 rounded-xl bg-slate-800/40 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/30 transition shadow-sm text-left truncate max-w-xs"
                      title={phrase.text}
                    >
                      <span className="text-indigo-400 font-semibold mr-1">{phrase.category}:</span>
                      {phrase.text}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* MÓDULO 2: SELECTOR DE VOZ (SPINNER) & GENERAR */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6">
              
              {/* Voz Seleccionada (El Spinner 🤖💬) */}
              <div className="flex-1 flex flex-col gap-2">
                <label htmlFor="voice_select" className="text-sm font-semibold text-slate-300 flex items-center gap-1.5">
                  🤖<span>Voz de Gemini (Lunar & Stellar)</span>
                </label>
                <div className="relative">
                  <select
                    id="voice_select"
                    value={selectedVoice}
                    onChange={(e) => setSelectedVoice(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-2xl py-3 px-4 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 cursor-pointer text-base appearance-none shadow-inner"
                  >
                    {GEMINI_VOICES.map((v) => {
                      const detail = VOICE_DETAILS[v] || { desc: "Voz por defecto", type: "Clásica" };
                      return (
                        <option key={v} value={v}>
                          {v} • {detail.desc} ({detail.type})
                        </option>
                      );
                    })}
                  </select>
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
                    💬
                  </div>
                </div>
              </div>

              {/* Botón de Generación principal */}
              <div className="flex items-end pt-5 md:pt-0">
                <button
                  id="btn_generate_speech"
                  onClick={handleGenerateSpeech}
                  disabled={isGenerating}
                  className={`w-full md:w-auto min-w-[180px] h-[52px] flex items-center justify-center gap-2.5 px-6 font-bold rounded-2xl text-white shadow-xl transition-all duration-300 ${
                    isGenerating 
                      ? "bg-indigo-900/40 border border-indigo-700/30 cursor-not-allowed text-indigo-300" 
                      : "bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 border border-indigo-400/20 active:scale-95 shadow-indigo-600/10 hover:shadow-indigo-500/20"
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
                      <span>Generando...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 text-indigo-200 animate-pulse" />
                      <span>Generar Audio</span>
                    </>
                  )}
                </button>
              </div>

            </div>

            {/* Muestra de carga interactiva / Estado animado */}
            {isGenerating && (
              <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-5 text-center flex flex-col items-center justify-center gap-3 animate-pulse">
                <div className="flex gap-1.5 justify-center items-center py-1">
                  <span className="w-3.5 h-3.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: "0ms" }}></span>
                  <span className="w-3.5 h-3.5 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: "150ms" }}></span>
                  <span className="w-3.5 h-3.5 rounded-full bg-cyan-500 animate-bounce" style={{ animationDelay: "300ms" }}></span>
                </div>
                <p className="text-sm font-semibold text-indigo-300 font-mono">{generationStep}</p>
                <p className="text-xs text-slate-500">Esto suele tomar entre 2 y 5 segundos dependiendo de la longitud del texto.</p>
              </div>
            )}

          </div>

          {/* COLUMNA DERECHA: REPRODUCTOR INTELIGENTE & NOTAS (1/3 de ancho) */}
          <div className="flex flex-col gap-6">
            
            {/* AUDIO EN VIVO REPRODUCTOR CARD */}
            <div className={`bg-slate-900/50 border rounded-3xl p-6 shadow-xl transition-all duration-300 ${audioUrl ? 'border-indigo-500/40 bg-indigo-950/10 shadow-indigo-500/5' : 'border-slate-800'}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Music className="w-5 h-5 text-indigo-400" />
                  <h2 className="text-base font-bold text-white">Reproductor de Audio</h2>
                </div>
                {audioUrl && (
                  <span className="bg-indigo-500/10 text-indigo-300 text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-full border border-indigo-400/20">
                    Listo
                  </span>
                )}
              </div>

              {audioUrl ? (
                <div className="flex flex-col gap-5">
                  
                  {/* Visualización Simulada de waveform */}
                  <div className="h-16 bg-slate-950 rounded-2xl flex items-center justify-center gap-[4px] px-6 border border-slate-800 overflow-hidden relative">
                    <div className="absolute top-2 left-3 text-[10px] text-slate-500 font-mono">
                      Voz: {selectedVoice}
                    </div>
                    {/* Barras animadas falsas con volumen de audio real */}
                    {Array.from({ length: 18 }).map((_, i) => {
                      // Amplitudes aleatorias variando por tiempo para simular baile de música
                      const baseHeight = [20, 45, 15, 60, 30, 40, 25, 55, 10, 30, 45, 15, 70, 25, 40, 60, 20, 35][i];
                      return (
                        <span
                          key={i}
                          className={`w-[4px] rounded-full transition-all duration-300 ${isPlaying ? 'bg-indigo-400 animate-pulse' : 'bg-slate-700'}`}
                          style={{ 
                            height: isPlaying ? `${Math.max(10, Math.sin(currentTime * (i + 1)) * (baseHeight / 2) + (baseHeight / 2))}%` : `${baseHeight}%`,
                            animationDuration: `${500 + (i % 3) * 200}ms`
                          }}
                        ></span>
                      );
                    })}
                  </div>

                  {/* Informador de audio generado */}
                  <div className="text-xs text-slate-400 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 flex flex-col gap-1">
                    <p className="truncate"><span className="font-semibold text-slate-300">Mensaje:</span> "{text}"</p>
                    <p><span className="font-semibold text-slate-300">Calidad:</span> 16 bits • 24.0 kHz Mono WAV</p>
                  </div>

                  {/* Línea de tiempo deslizadora */}
                  <div className="flex flex-col gap-1">
                    <input
                      type="range"
                      min="0"
                      max={duration || 100}
                      value={currentTime}
                      onChange={handleProgressChange}
                      className="w-full h-1 bg-slate-800 hover:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 transition duration-150"
                    />
                    <div className="flex justify-between text-[11px] text-slate-400 font-mono mt-1">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>

                  {/* Botones de acción del audio: REPRODUCIR & DESCARGAR */}
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    
                    {/* Botón Reproducir */}
                    <button
                      id="btn_play_audio"
                      onClick={togglePlayPause}
                      className={`flex-1 flex items-center justify-center gap-2 h-11 rounded-xl text-sm font-bold transition-all ${
                        isPlaying 
                          ? "bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 shadow" 
                          : "bg-indigo-600 hover:bg-indigo-500 text-white"
                      }`}
                    >
                      {isPlaying ? (
                        <>
                          <Pause className="w-4 h-4" />
                          <span>Pausar</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 fill-current" />
                          <span>Reproducir</span>
                        </>
                      )}
                    </button>

                    {/* Botón Descargar */}
                    <button
                      id="btn_download_audio"
                      onClick={downloadAudioFile}
                      className="flex-1 flex items-center justify-center gap-2 h-11 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-bold border border-slate-700 transition"
                      title="Descargar este audio permanentemente"
                    >
                      <Download className="w-4 h-4 text-emerald-400" />
                      <span>Descargar</span>
                    </button>

                  </div>

                  {/* Control de audio nativo escondido para el bridge */}
                  <audio 
                    ref={audioRef} 
                    src={audioUrl} 
                    className="hidden" 
                    controls 
                  />

                  {/* Botones de control de Volumen */}
                  <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                    <button 
                      onClick={() => setIsMuted(!isMuted)} 
                      className="text-slate-400 hover:text-white transition p-1"
                    >
                      {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-indigo-400" />}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={volume}
                      onChange={(e) => {
                        setVolume(parseFloat(e.target.value));
                        setIsMuted(false);
                      }}
                      className="w-24 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-400 cursor-ew-resize"
                    />
                    <button
                      onClick={() => {
                        setAudioUrl(null);
                        setIsPlaying(false);
                      }}
                      className="text-xs text-slate-500 hover:text-red-400 transition ml-2 flex items-center gap-1"
                      title="Eliminar audio generado"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>
              ) : (
                <div className="py-10 text-center flex flex-col items-center justify-center gap-4 text-slate-500 border-2 border-dashed border-slate-800/80 rounded-2xl bg-slate-950/20">
                  <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-full text-slate-400">
                    <Music className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-300">No hay audio generado</p>
                    <p className="text-xs text-slate-500 max-w-xs mt-1 px-4">Escribe un texto a la izquierda, selecciona la voz y pulsa "Generar Audio" para reproducir.</p>
                  </div>
                </div>
              )}
            </div>

            {/* CARD INFORMATIVA DE AYUDA / CRÉDITOS */}
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-5 shadow flex flex-col gap-3">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-indigo-400" />
                <span>¿Cómo funciona?</span>
              </h3>
              <ul className="text-xs text-slate-400 space-y-2.5 list-disc pl-4">
                <li>
                  <span className="font-semibold text-slate-300">Sin límites</span>: Configura tu propia API Key de Google AI Studio para disfrutar de llamadas directas y veloces sin cuellos de botella compartidos.
                </li>
                <li>
                  <span className="font-semibold text-slate-300">Voces de Géminis</span>: Se utilizan modelos <code className="text-indigo-300 bg-indigo-500/10 px-1 py-0.5 rounded font-mono">gemini-3.1-flash-tts-preview</code> oficiales optimizados para alta calidad vocal.
                </li>
                <li>
                  <span className="font-semibold text-slate-300">Descargas seguras</span>: El audio descargado es un flujo WAV nativo empaquetado directamente en navegador web con codificación robusta.
                </li>
              </ul>
            </div>

          </div>

        </div>

      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-800/80 bg-slate-900/40 py-6 text-center text-xs text-slate-500 mt-auto">
        <p>Gemini Vox Studio © {new Date().getFullYear()} • Desarrollado con el SDK Oficial de Google GenAI</p>
        <p className="mt-1">Compatible con la generación autónoma de audio empaquetado y persistencia local</p>
      </footer>


      {/* MODAL / DIÁLOGO DE CONFIGURACIÓN DE API KEY */}
      {isApiKeyModalOpen && (
        <div id="api_key_modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col gap-4 relative animate-scale-up">
            
            {/* Botón Cerrar */}
            <button 
              onClick={() => setIsApiKeyModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Título */}
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800">
              <Key className="w-5 h-5 text-indigo-400" />
              <h3 className="text-lg font-bold text-white">Configurar Clave API</h3>
            </div>

            {/* Instrucción */}
            <p className="text-xs text-slate-400 leading-relaxed">
              Para generar audio de forma autónoma con las voces de Gemini, ingresa tu clave API personal de Google.
              Se guarda de forma segura únicamente en tu navegador web (<span className="font-mono text-indigo-300">localStorage</span>).
            </p>

            {/* Input de Clave API */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="input_api_key_field" className="text-xs font-bold text-slate-300">Tu Gemini API Key:</label>
              <input
                id="input_api_key_field"
                type="password"
                value={tempApiKey}
                onChange={(e) => setTempApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-2xl py-2.5 px-4 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 placeholder:text-slate-700 font-mono text-sm"
              />
            </div>

            {/* Botones de Acción del Modal */}
            <div className="flex flex-col gap-2 pt-2">
              <div className="flex gap-2">
                {/* Botón Guardar permanentemente */}
                <button
                  id="btn_save_key"
                  onClick={saveApiKey}
                  className="flex-1 flex items-center justify-center gap-1.5 h-11 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-sm transition"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar permanentemente</span>
                </button>
                
                {/* Botón Obtener Clave */}
                <button
                  id="btn_get_key"
                  onClick={openApiKeyLink}
                  className="flex-none flex items-center justify-center gap-1.5 h-11 px-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-sm border border-slate-700 transition"
                  title="Abrir enlace oficial para crear clave"
                >
                  <ExternalLink className="w-4 h-4 text-indigo-300" />
                  <span>Obtener Clave</span>
                </button>
              </div>

              {keySavedMessage && (
                <p className="text-xs text-emerald-400 text-center font-medium animate-pulse mt-1">
                  ✓ Configuración actualizada en almacenamiento local
                </p>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
