import { Canvas } from '@react-three/fiber';
import { useFrame, useThree } from '@react-three/fiber';
import { forwardRef, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

function FloatingShapes() {
  const shapesRef = useRef([]);
  const [shapes] = useState(() => 
    Array.from({ length: 15 }, (_, i) => ({
      id: i,
      position: [
        (Math.random() - 0.5) * 30,
        (Math.random() - 0.5) * 30,
        (Math.random() - 0.5) * 30,
      ],
      rotation: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI],
      rotationSpeed: [
        (Math.random() - 0.5) * 0.01,
        (Math.random() - 0.5) * 0.01,
        (Math.random() - 0.5) * 0.01,
      ],
      floatOffset: Math.random() * Math.PI * 2,
      floatSpeed: 0.5 + Math.random() * 0.5,
      floatAmplitude: 0.5 + Math.random() * 1,
      scale: 0.3 + Math.random() * 0.7,
      type: Math.floor(Math.random() * 4),
      color: new THREE.Color().setHSL(Math.random(), 0.7, 0.6),
    }))
  );

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();
    shapes.forEach((shape, i) => {
      const mesh = shapesRef.current[i];
      if (!mesh) return;
      
      mesh.rotation.x += shape.rotationSpeed[0];
      mesh.rotation.y += shape.rotationSpeed[1];
      mesh.rotation.z += shape.rotationSpeed[2];
      
      const floatY = Math.sin(time * shape.floatSpeed + shape.floatOffset) * shape.floatAmplitude;
      mesh.position.y = shape.position[1] + floatY;
      mesh.position.x = shape.position[0] + Math.cos(time * shape.floatSpeed * 0.7 + shape.floatOffset) * 0.3;
      mesh.position.z = shape.position[2] + Math.sin(time * shape.floatSpeed * 0.5 + shape.floatOffset) * 0.3;
    });
  });

  return (
    <>
      {shapes.map((shape) => (
        <Shape
          key={shape.id}
          ref={(el) => (shapesRef.current[shape.id] = el)}
          type={shape.type}
          color={shape.color}
          scale={shape.scale}
          initialPosition={shape.position}
          initialRotation={shape.rotation}
        />
      ))}
    </>
  );
}

const Shape = forwardRef(function Shape(
  { type, color, scale, initialPosition, initialRotation },
  ref
) {
  const geometry = useMemo(() => (
    type === 0 ? new THREE.BoxGeometry(1, 1, 1) :
      type === 1 ? new THREE.SphereGeometry(0.5, 32, 32) :
        type === 2 ? new THREE.ConeGeometry(0.5, 1, 32) :
          new THREE.TorusGeometry(0.4, 0.2, 16, 32)
  ), [type]);

  return (
    <mesh
      ref={ref}
      position={initialPosition}
      rotation={initialRotation}
      scale={scale}
      castShadow
      receiveShadow
    >
      <primitive object={geometry} attach="geometry" />
      <meshStandardMaterial 
        color={color}
        metalness={0.3}
        roughness={0.4}
        transparent
        opacity={0.8}
      />
    </mesh>
  );
});

function ParticleField() {
  const particlesRef = useRef();
  const [particles] = useState(() => {
    const positions = new Float32Array(2000 * 3);
    const colors = new Float32Array(2000 * 3);
    const sizes = new Float32Array(2000);
    const velocities = [];
    
    for (let i = 0; i < 2000; i++) {
      const radius = 5 + Math.random() * 20;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
      
      const hue = 0.55 + Math.random() * 0.15;
      const color = new THREE.Color().setHSL(hue, 0.8, 0.6);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
      
      sizes[i] = Math.random() * 3 + 1;
      
      velocities.push({
        x: (Math.random() - 0.5) * 0.002,
        y: (Math.random() - 0.5) * 0.002,
        z: (Math.random() - 0.5) * 0.002,
      });
    }
    
    return { positions, colors, sizes, velocities };
  });

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const positions = particles.positions;
    const velocities = particles.velocities;
    
    for (let i = 0; i < 2000; i++) {
      positions[i * 3] += velocities[i].x;
      positions[i * 3 + 1] += velocities[i].y + Math.sin(time * 0.5 + i * 0.01) * 0.001;
      positions[i * 3 + 2] += velocities[i].z;
      
      const dist = Math.sqrt(
        positions[i * 3] ** 2 + 
        positions[i * 3 + 1] ** 2 + 
        positions[i * 3 + 2] ** 2
      );
      
      if (dist > 25) {
        const radius = 5 + Math.random() * 15;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        
        positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = radius * Math.cos(phi);
      }
    }
    
    if (particlesRef.current) {
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={particles.positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" array={particles.colors} itemSize={3} />
        <bufferAttribute attach="attributes-size" array={particles.sizes} itemSize={1} />
      </bufferGeometry>
      <pointsMaterial
        size={2}
        sizeAttenuation
        vertexColors
        transparent
        opacity={0.6}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function LightningBolts() {
  const [bolts] = useState(() => 
    Array.from({ length: 5 }, (_, i) => ({
      id: i,
      active: false,
      progress: 0,
      startPoint: new THREE.Vector3(),
      endPoint: new THREE.Vector3(),
      segments: [],
    }))
  );

  useFrame(() => {
    bolts.forEach((bolt, i) => {
      if (!bolt.active && Math.random() < 0.003) {
        bolt.active = true;
        bolt.progress = 0;
        bolt.startPoint.set(
          (Math.random() - 0.5) * 20,
          15,
          (Math.random() - 0.5) * 20
        );
        bolt.endPoint.set(
          bolt.startPoint.x + (Math.random() - 0.5) * 5,
          -10,
          bolt.startPoint.z + (Math.random() - 0.5) * 5
        );
        bolt.segments = generateLightningSegments(bolt.startPoint, bolt.endPoint, 8);
      }
      
      if (bolt.active) {
        bolt.progress += 0.05;
        if (bolt.progress >= 1) {
          bolt.active = false;
        }
      }
    });
  });

  return (
    <>
      {bolts.map((bolt) => 
        bolt.active && (
          <LightningBolt 
            key={bolt.id}
            segments={bolt.segments}
            progress={bolt.progress}
          />
        )
      )}
    </>
  );
}

function generateLightningSegments(start, end, segments) {
  const points = [];
  const direction = new THREE.Vector3().subVectors(end, start);
  const length = direction.length();
  direction.normalize();
  
  points.push(start.clone());
  
  for (let i = 1; i < segments; i++) {
    const t = i / segments;
    const point = start.clone().add(direction.clone().multiplyScalar(length * t));
    
    const offset = (Math.random() - 0.5) * (length * 0.15);
    point.x += (Math.random() - 0.5) * 2;
    point.y += offset;
    point.z += (Math.random() - 0.5) * 2;
    
    points.push(point);
  }
  
  points.push(end.clone());
  return points;
}

function LightningBolt({ segments, progress }) {
  const visibleSegments = Math.floor(segments.length * progress);
  
  if (visibleSegments < 2) return null;
  
  return (
    <line 
      linewidth={3}
    >
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={new Float32Array(segments.slice(0, visibleSegments).flatMap(p => [p.x, p.y, p.z]))}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial 
        color={0x00d8fb}
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
      />
    </line>
  );
}

function MouseGlow({ color = 0x00d8fb }) {
  const { viewport, mouse } = useThree();
  const glowRef = useRef();

  useFrame(() => {
    const targetX = mouse.x * (viewport.width / viewport.height);
    const targetY = -mouse.y;
    
    if (glowRef.current) {
      glowRef.current.position.x += (targetX - glowRef.current.position.x) * 0.1;
      glowRef.current.position.y += (targetY - glowRef.current.position.y) * 0.1;
    }
  });

  return (
    <mesh ref={glowRef} position={[0, 0, -5]}>
      <planeGeometry args={[20, 20]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.03}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

export function Scene3D({ className, style, children }) {
  return (
    <div className={className} style={{ ...style, position: 'relative', width: '100%', height: '100%' }}>
      <Canvas
        camera={{ position: [0, 0, 20], fov: 50 }}
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}
      >
        <color attach="background" args={['#0a0a0f']} />
        <fog attach="fog" args={['#0a0a0f', 10, 50]} />
        
        <ambientLight intensity={0.4} color="#ffffff" />
        <directionalLight position={[10, 20, 10]} intensity={1} color="#ffffff" castShadow />
        <directionalLight position={[-10, -10, -10]} intensity={0.5} color="#00d8fb" />
        <pointLight position={[0, 5, 5]} intensity={1} color="#5b9cf2" distance={30} decay={2} />
        <pointLight position={[0, -5, -5]} intensity={0.5} color="#ff6b6b" distance={30} decay={2} />
        
        <ParticleField />
        <FloatingShapes />
        <LightningBolts />
        <MouseGlow />
        
        {children}
      </Canvas>
    </div>
  );
}

export function Scene3DFull({ className, style, children }) {
  return (
    <div className={className} style={{ ...style, position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1 }}>
      <Canvas
        camera={{ position: [0, 0, 20], fov: 50 }}
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
      >
        <color attach="background" args={['#0a0a0f']} />
        <fog attach="fog" args={['#0a0a0f', 10, 50]} />
        
        <ambientLight intensity={0.4} color="#ffffff" />
        <directionalLight position={[10, 20, 10]} intensity={1} color="#ffffff" castShadow />
        <directionalLight position={[-10, -10, -10]} intensity={0.5} color="#00d8fb" />
        <pointLight position={[0, 5, 5]} intensity={1} color="#5b9cf2" distance={30} decay={2} />
        <pointLight position={[0, -5, -5]} intensity={0.5} color="#ff6b6b" distance={30} decay={2} />
        
        <ParticleField />
        <FloatingShapes />
        <LightningBolts />
        <MouseGlow />
        
        {children}
      </Canvas>
    </div>
  );
}