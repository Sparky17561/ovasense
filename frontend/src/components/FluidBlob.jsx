import React, { useEffect, useRef, useState } from "react";

/**
 * Utility to load Three.js dynamically
 */
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

/**
 * FluidBlob Component
 * @param {string} state - 'rest' | 'listening' | 'speaking'
 */
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
    scaleX: 1.0,
    scaleY: 1.0,
    scaleZ: 1.0,
  });

  useEffect(() => {
    let renderer, scene, camera, mesh, animationId;

    const init = async () => {
      await loadScript(
        "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"
      );

      // 1. Scene Setup
      scene = new window.THREE.Scene();
      // Transparent background so it blends with parent container
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
  }, []); // Run once on mount

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

export default FluidBlob;
