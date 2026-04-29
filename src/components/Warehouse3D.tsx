import React, { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, ContactShadows, Float, Text, Html } from '@react-three/drei';
import type { InventoryItem } from '../types';
import styles from './Warehouse3D.module.css';

interface Warehouse3DProps {
  inventory: InventoryItem[];
  onSlotClick: (slotId: string) => void;
}

const Shelf = ({ position, name, inventory, onSlotClick }: { 
  position: [number, number, number], 
  name: string, 
  inventory: InventoryItem[],
  onSlotClick: (id: string) => void 
}) => {
  const rows = [1, 2];
  const cols = [1, 2];
  
  return (
    <group position={position}>
      {/* Shelf Structure */}
      <mesh position={[0, 1.5, 0]}>
        <boxGeometry args={[4, 3, 1]} />
        <meshStandardMaterial color="#334155" transparent opacity={0.3} />
      </mesh>
      
      {/* Shelves Lines */}
      {[0, 1.5, 3].map((y) => (
        <mesh key={y} position={[0, y, 0]}>
          <boxGeometry args={[4.2, 0.1, 1.1]} />
          <meshStandardMaterial color="#475569" />
        </mesh>
      ))}
      
      {/* Vertical Bars */}
      {[-2, 2].map((x) => (
        <mesh key={x} position={[x, 1.5, 0]}>
          <boxGeometry args={[0.1, 3, 1.1]} />
          <meshStandardMaterial color="#475569" />
        </mesh>
      ))}

      {/* Label */}
      <Text
        position={[0, 3.5, 0]}
        fontSize={0.5}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        KỆ {name}
      </Text>

      {/* Slots */}
      {rows.map((row) => 
        cols.map((col) => {
          const slotId = `${name}-0${row * 2 - 2 + col}`;
          const item = inventory.find(i => i.shelfLocation === slotId);
          const xPos = (col - 1.5) * 2;
          const yPos = (row - 1) * 1.5 + 0.75;
          
          return (
            <group key={slotId} position={[xPos, yPos, 0]}>
              {/* Slot Indicator */}
              <mesh onClick={() => onSlotClick(slotId)}>
                <boxGeometry args={[1.8, 1.3, 0.8]} />
                <meshStandardMaterial 
                  color={item ? "#3b82f6" : "#1e293b"} 
                  transparent 
                  opacity={item ? 0.6 : 0.2} 
                  emissive={item ? "#3b82f6" : "#000"}
                  emissiveIntensity={item ? 0.5 : 0}
                />
              </mesh>
              
              {/* Item if exists */}
              {item && (
                <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
                  <mesh position={[0, 0, 0.2]}>
                    <boxGeometry args={[1, 0.8, 0.6]} />
                    <meshStandardMaterial color="#8b5cf6" metalness={0.5} roughness={0.2} />
                  </mesh>
                </Float>
              )}
              
              {/* Slot ID Label */}
              <Text
                position={[0, -0.5, 0.5]}
                fontSize={0.2}
                color="#94a3b8"
              >
                {slotId}
              </Text>
            </group>
          );
        })
      )}
    </group>
  );
};

const Warehouse3D: React.FC<Warehouse3DProps> = ({ inventory, onSlotClick }) => {
  return (
    <div className={styles.container}>
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[10, 8, 15]} fov={40} />
        <OrbitControls 
          enablePan={true} 
          enableZoom={true} 
          maxPolarAngle={Math.PI / 2.1} 
          minDistance={5}
          maxDistance={30}
        />
        
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} castShadow />
        <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
        
        <Suspense fallback={null}>
          {/* Ground */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
            <planeGeometry args={[50, 50]} />
            <meshStandardMaterial color="#0f172a" roughness={0.8} />
          </mesh>
          <gridHelper args={[50, 50, "#1e293b", "#0f172a"]} />

          {/* Shelves A, B, C */}
          <Shelf position={[-6, 0, 0]} name="A" inventory={inventory} onSlotClick={onSlotClick} />
          <Shelf position={[0, 0, 0]} name="B" inventory={inventory} onSlotClick={onSlotClick} />
          <Shelf position={[6, 0, 0]} name="C" inventory={inventory} onSlotClick={onSlotClick} />
          
          <Environment preset="city" />
          <ContactShadows position={[0, 0, 0]} opacity={0.4} scale={20} blur={2} far={4.5} />
        </Suspense>
      </Canvas>
      
      <div className={styles.controlsHint}>
        Dùng chuột để xoay và phóng to mô hình 3D
      </div>
    </div>
  );
};

export default Warehouse3D;
