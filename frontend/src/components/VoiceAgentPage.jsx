import React, { useState, useEffect, useRef, useCallback } from "react";
import { Mic, Square, Loader, AlertCircle } from "lucide-react";
import { processText } from "../api";
import ReactMarkdown from 'react-markdown';

// --- 1. UTILITY: Script Loader (for Three.js) ---
const loadScript = (src) => {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

// --- 2. HOOK: useSpeechToText (Native Web Speech API) ---
const useSpeechToText = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [permissionError, setPermissionError] = useState(false);
  const [speechRecognitionAvailable, setSpeechRecognitionAvailable] =
    useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    console.log("🎤 [DEBUG] Initializing Speech Recognition...");
    // Browser Support Check
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      console.log("✅ [DEBUG] Speech Recognition API is available");
      setSpeechRecognitionAvailable(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true; // Keep listening while holding
      recognition.lang = "en-US";
      recognition.interimResults = true; // Real-time results

      recognition.onstart = () => {
        console.log(
          "🎙️ [DEBUG] Speech recognition STARTED - Listening activated"
        );
        setIsListening(true);
        setPermissionError(false);
      };

      recognition.onresult = (event) => {
        let currentTranscript = "";
        // Reconstruct full transcript from the results array
        for (let i = 0; i < event.results.length; ++i) {
          currentTranscript += event.results[i][0].transcript;
        }
        console.log("📝 [DEBUG] Transcript updated:", currentTranscript);
        setTranscript(currentTranscript);
      };

      recognition.onerror = (event) => {
        console.error("❌ [DEBUG] Speech recognition ERROR:", event.error);
        if (event.error === "not-allowed") {
          console.error("🚫 [DEBUG] Microphone permission DENIED");
          setPermissionError(true);
          setIsListening(false);
        }
        if (event.error === "aborted" || event.error === "no-speech") {
          console.warn("⚠️ [DEBUG] Speech recognition stopped:", event.error);
          setIsListening(false);
        }
      };

      recognition.onend = () => {
        console.log("🛑 [DEBUG] Speech recognition ENDED");
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      console.error(
        "❌ [DEBUG] Browser does NOT support Speech Recognition API"
      );
      setSpeechRecognitionAvailable(false);
    }

    return () => {
      if (recognitionRef.current) recognitionRef.current.abort();
    };
  }, []);

  const startListening = useCallback(() => {
    console.log("▶️ [DEBUG] startListening() called");
    if (recognitionRef.current && !isListening) {
      console.log("🎤 [DEBUG] Clearing transcript and starting recognition...");
      setTranscript("");
      try {
        recognitionRef.current.start();
        console.log("✅ [DEBUG] Recognition.start() called successfully");
      } catch (e) {
        console.warn(
          "⚠️ [DEBUG] Mic start request ignored (already active/starting):",
          e.message
        );
      }
    } else {
      console.warn(
        "⚠️ [DEBUG] Cannot start listening - recognition not available or already listening"
      );
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    console.log("⏹️ [DEBUG] stopListening() called");
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      console.log("✅ [DEBUG] Recognition.stop() called successfully");
    }
  }, []);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    setTranscript,
    permissionError,
    speechRecognitionAvailable,
  };
};

// --- 3. HOOK: useTextToSpeech ---
const useTextToSpeech = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState([]);

  useEffect(() => {
    const synth = window.speechSynthesis;
    const updateVoices = () => setVoices(synth.getVoices());

    updateVoices();
    if (synth.onvoiceschanged !== undefined) {
      synth.onvoiceschanged = updateVoices;
    }
  }, []);

  const speak = (text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    // Prefer Google US English, fall back to first available
    const preferredVoice =
      voices.find((v) => v.name.includes("Google US English")) || voices[0];
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  return { speak, stopSpeaking, isSpeaking };
};

// --- 4. COMPONENT: FluidBlob (3D Visualizer) ---
const FluidBlob = ({ state = "rest" }) => {
  const mountRef = useRef(null);
  const [isReady, setIsReady] = useState(false);

  // Refs to store Three.js objects
  const sceneRef = useRef(null);
  const materialRef = useRef(null);
  const blobRef = useRef(null);

  // Target values for smooth transitions
  const targets = useRef({
    speed: 0.2,
    density: 1.5,
    strength: 0.2,
    frequency: 1.0,
    amplitude: 1.0,
  });

  useEffect(() => {
    let renderer, scene, camera, mesh, animationId;

    const init = async () => {
      await loadScript(
        "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"
      );

      // 1. Scene Setup
      scene = new window.THREE.Scene();
      scene.background = null;
      sceneRef.current = scene;

      // 2. Camera
      camera = new window.THREE.PerspectiveCamera(
        45,
        window.innerWidth / window.innerHeight,
        0.1,
        100
      );
      camera.position.z = 4.5;

      // 3. Renderer
      renderer = new window.THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
      });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.toneMapping = window.THREE.ACESFilmicToneMapping;
      renderer.outputEncoding = window.THREE.sRGBEncoding;

      if (mountRef.current) {
        mountRef.current.innerHTML = "";
        mountRef.current.appendChild(renderer.domElement);
      }

      // 4. Lighting
      const ambientLight = new window.THREE.AmbientLight(0xffffff, 0.8);
      scene.add(ambientLight);

      const dirLight = new window.THREE.DirectionalLight(0xffffff, 1.2);
      dirLight.position.set(5, 10, 7);
      scene.add(dirLight);

      const pointLight = new window.THREE.PointLight(0x3b82f6, 1.0);
      pointLight.position.set(-5, -5, 5);
      scene.add(pointLight);

      // 5. Geometry
      const geometry = new window.THREE.SphereGeometry(1, 128, 128);

      // Custom Shader Material
      const material = new window.THREE.MeshPhysicalMaterial({
        color: 0x2563eb,
        metalness: 0.2,
        roughness: 0.1,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05,
        transmission: 0,
        flatShading: false,
      });

      // Uniforms
      material.userData.uniforms = {
        uTime: { value: 0 },
        uSpeed: { value: 0.2 },
        uNoiseDensity: { value: 1.5 },
        uNoiseStrength: { value: 0.2 },
        uFrequency: { value: 1.0 },
        uAmplitude: { value: 1.0 },
      };

      material.onBeforeCompile = (shader) => {
        shader.uniforms.uTime = material.userData.uniforms.uTime;
        shader.uniforms.uSpeed = material.userData.uniforms.uSpeed;
        shader.uniforms.uNoiseDensity =
          material.userData.uniforms.uNoiseDensity;
        shader.uniforms.uNoiseStrength =
          material.userData.uniforms.uNoiseStrength;
        shader.uniforms.uFrequency = material.userData.uniforms.uFrequency;
        shader.uniforms.uAmplitude = material.userData.uniforms.uAmplitude;

        shader.vertexShader = `
          uniform float uTime;
          uniform float uSpeed;
          uniform float uNoiseDensity;
          uniform float uNoiseStrength;
          uniform float uFrequency;
          uniform float uAmplitude;
          
          vec4 permute(vec4 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
          vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

          float snoise(vec3 v){ 
            const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
            const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
            vec3 i  = floor(v + dot(v, C.yyy) );
            vec3 x0 = v - i + dot(i, C.xxx) ;
            vec3 g = step(x0.yzx, x0.xyz);
            vec3 l = 1.0 - g;
            vec3 i1 = min( g.xyz, l.zxy );
            vec3 i2 = max( g.xyz, l.zxy );
            vec3 x1 = x0 - i1 + 1.0 * C.xxx;
            vec3 x2 = x0 - i2 + 2.0 * C.xxx;
            vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
            i = mod(i, 289.0 ); 
            vec4 p = permute( permute( permute( 
                      i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
                    + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
                    + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
            float n_ = 1.0/7.0; 
            vec3  ns = n_ * D.wyz - D.xzx;
            vec4 j = p - 49.0 * floor(p * ns.z * ns.z); 
            vec4 x_ = floor(j * ns.z);
            vec4 y_ = floor(j - 7.0 * x_ );  
            vec4 x = x_ *ns.x + ns.yyyy;
            vec4 y = y_ *ns.x + ns.yyyy;
            vec4 h = 1.0 - abs(x) - abs(y);
            vec4 b0 = vec4( x.xy, y.xy );
            vec4 b1 = vec4( x.zw, y.zw );
            vec4 s0 = floor(b0)*2.0 + 1.0;
            vec4 s1 = floor(b1)*2.0 + 1.0;
            vec4 sh = -step(h, vec4(0.0));
            vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
            vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
            vec3 p0 = vec3(a0.xy,h.x);
            vec3 p1 = vec3(a0.zw,h.y);
            vec3 p2 = vec3(a1.xy,h.z);
            vec3 p3 = vec3(a1.zw,h.w);
            vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
            p0 *= norm.x;
            p1 *= norm.y;
            p2 *= norm.z;
            p3 *= norm.w;
            vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
            m = m * m;
            return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                          dot(p2,x2), dot(p3,x3) ) );
          }

          ${shader.vertexShader}
        `;

        shader.vertexShader = shader.vertexShader.replace(
          "#include <begin_vertex>",
          `
            #include <begin_vertex>
            float t = uTime * uSpeed;
            float noise = snoise(position * uNoiseDensity + t);
            float distortion = noise * uNoiseStrength * uAmplitude;
            transformed += normal * distortion;
          `
        );
      };

      mesh = new window.THREE.Mesh(geometry, material);
      scene.add(mesh);
      blobRef.current = mesh;
      materialRef.current = material;

      setIsReady(true);

      const animate = () => {
        animationId = requestAnimationFrame(animate);

        if (blobRef.current && materialRef.current.userData.uniforms) {
          const uniforms = materialRef.current.userData.uniforms;
          const target = targets.current;

          uniforms.uTime.value += 0.01;

          const lerpFactor = 0.05;

          uniforms.uSpeed.value +=
            (target.speed - uniforms.uSpeed.value) * lerpFactor;
          uniforms.uNoiseDensity.value +=
            (target.density - uniforms.uNoiseDensity.value) * lerpFactor;
          uniforms.uNoiseStrength.value +=
            (target.strength - uniforms.uNoiseStrength.value) * lerpFactor;
          uniforms.uFrequency.value +=
            (target.frequency - uniforms.uFrequency.value) * lerpFactor;
          uniforms.uAmplitude.value +=
            (target.amplitude - uniforms.uAmplitude.value) * lerpFactor;

          const rotSpeed = state === "speaking" ? 0.005 : 0.002;
          blobRef.current.rotation.y += rotSpeed;
          blobRef.current.rotation.z += 0.001;
        }
        renderer.render(scene, camera);
      };

      animate();
    };

    init();

    const handleResize = () => {
      if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (mountRef.current && renderer) {
        mountRef.current.innerHTML = "";
      }
      if (renderer) renderer.dispose();
      cancelAnimationFrame(animationId);
    };
  }, []);

  // Watch for prop changes to update targets
  useEffect(() => {
    switch (state) {
      case "rest":
        targets.current = {
          speed: 0.2,
          density: 1.2,
          strength: 0.2,
          frequency: 1.0,
          amplitude: 1.0,
        };
        break;
      case "listening":
        targets.current = {
          speed: 2.0,
          density: 3.0,
          strength: 0.15,
          frequency: 5.0,
          amplitude: 0.5,
        };
        break;
      case "speaking":
        targets.current = {
          speed: 0.4,
          density: 2.0,
          strength: 0.5,
          frequency: 2.0,
          amplitude: 1.2,
        };
        break;
      default:
        break;
    }
  }, [state]);

  return (
    <div className="w-full h-full relative">
      <div
        ref={mountRef}
        className="absolute inset-0 z-0 flex items-center justify-center"
      />
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-pulse text-blue-300 font-semibold text-sm">
            Initializing Core...
          </div>
        </div>
      )}
    </div>
  );
};

// --- 5. MAIN COMPONENT: VoiceAgentPage ---
const VoiceAgentPage = () => {
  // --- Hooks ---
  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    setTranscript,
    permissionError,
    speechRecognitionAvailable,
  } = useSpeechToText();
  const { speak, isSpeaking } = useTextToSpeech();

  // --- Local State ---
  const [blobState, setBlobState] = useState("rest");
  const [messages, setMessages] = useState([
    {
      role: "agent",
      text: "Hello, I'm Baymax. Press Spacebar or hold the mic to talk.",
    },
  ]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Debug states
  const [buttonState, setButtonState] = useState("idle"); // idle, pressed, recording, saved, not_working
  const [debugInfo, setDebugInfo] = useState("");

  // Accumulated text for when the mic restarts during a long hold
  const [accumulatedText, setAccumulatedText] = useState("");
  // Track physical space key state
  const spaceHeldRef = useRef(false);

  // --- Effect: Sync Blob State ---
  useEffect(() => {
    if (isListening || (spaceHeldRef.current && !isProcessing)) {
      setBlobState("listening");
    } else if (isSpeaking) {
      setBlobState("speaking");
    } else if (isProcessing) {
      setBlobState("listening");
    } else {
      setBlobState("rest");
    }
  }, [isListening, isSpeaking, isProcessing]);

  // --- Effect: Watchdog for Mic Dropout ---
  // If the mic stops listening BUT the user is still holding Space,
  // we save the text and restart the mic immediately.
  useEffect(() => {
    if (!isListening && spaceHeldRef.current && !permissionError) {
      if (transcript.trim().length > 0) {
        console.log(
          "🔄 [DEBUG] Mic dropped out, saving transcript and restarting:",
          transcript
        );
        setAccumulatedText((prev) => prev + " " + transcript);
      }
      startListening(); // Restart automatically
    }
  }, [isListening, transcript, startListening, permissionError]);

  // Update button state based on current status
  useEffect(() => {
    if (!speechRecognitionAvailable) {
      setButtonState("not_working");
      setDebugInfo("Speech Recognition not available");
    } else if (permissionError) {
      setButtonState("not_working");
      setDebugInfo("Microphone permission denied");
    } else if (isProcessing) {
      setButtonState("saved");
      setDebugInfo("Processing...");
    } else if (isListening) {
      setButtonState("recording");
      setDebugInfo("Recording...");
    } else if (spaceHeldRef.current) {
      setButtonState("pressed");
      setDebugInfo("Pressed");
    } else {
      setButtonState("idle");
      setDebugInfo("");
    }
  }, [speechRecognitionAvailable, permissionError, isProcessing, isListening]);

  // --- Effect: Auto-Send (Only when Space/Button is RELEASED) ---
  useEffect(() => {
    // Determine the full text (Past segments + Current segment)
    const currentFullText = (accumulatedText + " " + transcript).trim();

    // Trigger condition: Mic Stopped AND Space/Button Released AND We have text AND not already processing
    if (
      !isListening &&
      !spaceHeldRef.current &&
      currentFullText.length > 0 &&
      !isProcessing
    ) {
      console.log("📤 [DEBUG] Ready to send text to backend:", currentFullText);
      setButtonState("saved");
      setDebugInfo("Text recorded, sending...");

      // Small delay to ensure transcript is finalized
      const timeoutId = setTimeout(() => {
        console.log("🚀 [DEBUG] Sending to backend now:", currentFullText);
        handleSendToBackend(currentFullText);
        setAccumulatedText(""); // Reset accumulator
        setTranscript(""); // Clear transcript
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [isListening, transcript, accumulatedText, isProcessing]);

  // --- Effect: Keyboard Control (Spacebar) ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === "Space" && !e.repeat) {
        e.preventDefault();
        console.log("⌨️ [DEBUG] Spacebar PRESSED");
        spaceHeldRef.current = true;
        setButtonState("pressed");
        setDebugInfo("Pressed");
        setAccumulatedText(""); // New session, clear accumulator
        startListening();
      } else if (e.code === "Space") {
        e.preventDefault(); // Prevent scroll on repeat
      }
    };

    const handleKeyUp = (e) => {
      if (e.code === "Space") {
        e.preventDefault();
        console.log("⌨️ [DEBUG] Spacebar RELEASED");
        spaceHeldRef.current = false;
        stopListening();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [startListening, stopListening]);

  // --- Backend Logic ---
  const handleSendToBackend = async (text) => {
    console.log("📡 [DEBUG] ========== SENDING TO BACKEND ==========");
    console.log("📤 [DEBUG] Text to send:", text);
    console.log("📤 [DEBUG] URL: http://localhost:8000/baymax/voice-agent/");

    setIsProcessing(true);
    setButtonState("saved");
    setDebugInfo("Sending to backend...");

    setMessages((prev) => [...prev, { role: "user", text: text }]);

    try {
      const startTime = Date.now();
      console.log("⏱️ [DEBUG] Request start time:", new Date().toISOString());

      // Use the authenticated API client
      const data = await processText(text, messages, {});

      const requestTime = Date.now() - startTime;
      console.log(`⏱️ [DEBUG] Request completed in ${requestTime}ms`);

      if (data.error) {
        console.error("❌ [DEBUG] Error in response:", data.error);
        throw new Error(data.error);
      }

      const replyText = data.response_text;
      console.log("💬 [DEBUG] Reply text:", replyText);

      setMessages((prev) => [...prev, { role: "agent", text: replyText }]);
      console.log("🔊 [DEBUG] Speaking reply text");
      speak(replyText);

      setButtonState("saved");
      setDebugInfo("Response received!");
    } catch (error) {
      console.error("❌ [DEBUG] ========== BACKEND ERROR ==========");
      console.error("❌ [DEBUG] Error type:", error.constructor.name);
      console.error("❌ [DEBUG] Error message:", error.message);
      console.error("❌ [DEBUG] Error stack:", error.stack);

      const errorMsg =
        "I am having trouble connecting to my healthcare servers. Please check if the backend is running.";
      setMessages((prev) => [...prev, { role: "agent", text: errorMsg }]);
      speak(errorMsg);

      setButtonState("not_working");
      setDebugInfo("Connection error - Check console");
    } finally {
      setIsProcessing(false);
      setTranscript("");
      setAccumulatedText(""); // Clear accumulated text after sending
      console.log("🏁 [DEBUG] ========== REQUEST COMPLETE ==========");
    }
  };

  // Helper to get display text
  const liveText = (accumulatedText + " " + transcript).trim();

  return (
    <div className="w-full h-full bg-[#0f1014] flex flex-col md:flex-row font-sans text-slate-200 overflow-hidden relative">
      {/* 1. Header - Fixed at top */}
      <div className="absolute top-0 left-0 right-0 z-30 mt-8 flex flex-col items-center">
        
        {isProcessing && (
          <div className="flex items-center gap-2 mt-2 text-teal-600 text-sm font-medium animate-pulse">
            <Loader size={14} className="animate-spin" />
            <span>Processing vitals...</span>
          </div>
        )}
        {permissionError && (
          <div className="flex items-center gap-2 mt-2 text-red-500 text-sm font-medium bg-red-50 px-3 py-1 rounded-full">
            <AlertCircle size={14} />
            <span>Microphone permission denied</span>
          </div>
        )}
      </div>

      {/* 2. Background Layer (Desktop: Left Side, Mobile: Full Screen) */}
      <div className="absolute inset-0 md:static md:w-1/2 md:inset-auto z-0 flex items-center justify-center overflow-hidden">
        <div className="w-full h-full flex items-center justify-center scale-150 md:scale-100 opacity-60 md:opacity-100 transition-all duration-700">
          <FluidBlob state={blobState} />
        </div>
      </div>

      {/* 3. Foreground Layer (Desktop: Right Side, Mobile: Overlay) */}
      <div className="absolute inset-0 md:static md:w-1/2 md:inset-auto z-10 flex flex-col justify-end md:justify-center px-4 md:px-12 py-8 md:py-0 pointer-events-none">
        
        {/* Chat Messages Container */}
        <div className="w-full max-w-lg mx-auto flex flex-col gap-4 mb-24 md:mb-12 overflow-y-auto max-h-[60vh] md:max-h-[70vh] scrollbar-hide pointer-events-auto p-4 md:p-0">
          {messages.slice(-3).map((msg, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-2xl backdrop-blur-xl shadow-lg border animate-in fade-in slide-in-from-bottom-4
                ${
                  msg.role === "user"
                    ? "bg-teal-600/30 text-teal-50 border-teal-500/30 self-end rounded-tr-none"
                    : "bg-black/40 text-slate-100 border-white/10 self-start rounded-tl-none"
                }`}
            >
              {msg.role === "agent" ? (
                <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-gray-800 prose-pre:rounded-lg">
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{msg.text}</p>
              )}
            </div>
          ))}

          {/* Live Transcript Overlay - Always show while speaking or listening */}
          {isListening && liveText && (
            <div className="bg-slate-900/95 text-teal-300 p-4 rounded-xl self-center text-center w-full border-2 border-teal-400/50 shadow-lg">
              <div className="flex items-center justify-center gap-2 mb-1">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-semibold text-teal-400 uppercase tracking-wide">
                  Listening...
                </span>
              </div>
              <p className="text-base font-medium mt-1">"{liveText}"</p>
            </div>
          )}

          {/* Show transcript even when not listening but we have text (before sending) */}
          {!isListening && liveText && !isProcessing && (
            <div className="bg-blue-900/90 text-blue-100 p-4 rounded-xl self-center text-center w-full border-2 border-blue-400/50">
              <p className="text-base font-medium">"{liveText}"</p>
              <p className="text-xs text-blue-300 mt-1">Ready to send...</p>
            </div>
          )}
        </div>

        {/* 4. Controls Footer - Fixed Bottom Center */}
        <div className="absolute bottom-8 left-0 right-0 flex flex-col items-center gap-4 pointer-events-auto">
          {/* BUTTON: Hold-to-Speak */}
          <button
            onMouseDown={() => {
              console.log("🖱️ [DEBUG] Mouse DOWN - Button pressed");
              spaceHeldRef.current = true;
              setButtonState("pressed");
              setDebugInfo("Pressed");
              setAccumulatedText("");
              startListening();
            }}
            onMouseUp={() => {
              console.log("🖱️ [DEBUG] Mouse UP - Button released");
              spaceHeldRef.current = false;
              stopListening();
            }}
            onMouseLeave={() => {
              if (isListening) {
                console.log("🖱️ [DEBUG] Mouse LEFT - Button released");
                spaceHeldRef.current = false;
                stopListening();
              }
            }}
            onTouchStart={(e) => {
              e.preventDefault(); // Prevent ghost clicks
              console.log("👆 [DEBUG] Touch START - Button pressed");
              spaceHeldRef.current = true;
              setButtonState("pressed");
              setDebugInfo("Pressed");
              setAccumulatedText("");
              startListening();
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              console.log("👆 [DEBUG] Touch END - Button released");
              spaceHeldRef.current = false;
              stopListening();
            }}
            className={`relative group p-6 md:p-8 rounded-full shadow-2xl transition-all duration-200 flex items-center justify-center select-none touch-none
            ${
              isListening
                ? "bg-red-500 scale-110 ring-8 ring-red-500/20 active:scale-95 shadow-red-500/50"
                : "bg-white hover:scale-105 ring-8 ring-white/10 active:scale-95 shadow-white/10"
            }`}
          >
            {isListening && (
              <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-75"></span>
            )}

            {isListening ? (
              <Square
                size={32}
                className="fill-current text-white relative z-10"
              />
            ) : (
              <Mic
                size={32}
                className="text-slate-900 group-hover:text-blue-600 relative z-10"
              />
            )}
          </button>

          <div className="flex flex-col items-center gap-1">
            <p className="text-slate-400 text-xs md:text-sm font-medium tracking-wide drop-shadow-md">
              {buttonState === "pressed" && "Listening..."}
              {buttonState === "recording" && "Recording..."}
              {buttonState === "saved" && "Processing..."}
              {buttonState === "not_working" && "Microphone Error"}
              {buttonState === "idle" && "Hold Spacebar to Speak"}
            </p>
            {debugInfo && (
              <p className="text-[10px] text-slate-600 font-mono opacity-50">[{debugInfo}]</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceAgentPage;
