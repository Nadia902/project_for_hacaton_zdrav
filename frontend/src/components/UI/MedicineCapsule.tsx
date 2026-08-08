'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, Group } from 'three';
import { MeshPhysicalMaterial, MeshStandardMaterial, CylinderGeometry, SphereGeometry, TorusGeometry } from 'three';

export function MedicineCapsule() {
  const containerRef = useRef<Group>(null); // Общий контейнер для капсулы и орбиталей
  const orbit1Ref = useRef<Mesh>(null);
  const orbit2Ref = useRef<Mesh>(null);
  const orbit3Ref = useRef<Mesh>(null);

  // Анимация вращения всей системы (капсула + орбитали) вокруг горизонтальной оси (Y)
  useFrame((state, delta) => {
    try {
      if (containerRef.current) {
        containerRef.current.rotation.y += delta * 0.8; // Скорость вращения всей системы
      }
      
      // Анимация орбиталей (пульсация, свечение)
      const time = state.clock.elapsedTime;
      
      if (orbit1Ref.current?.material) {
        const material = orbit1Ref.current.material as MeshStandardMaterial;
        if (material && typeof material.emissiveIntensity !== 'undefined') {
          material.emissiveIntensity = 0.4 + Math.sin(time * 2) * 0.3; // Пульсация свечения
          material.opacity = 0.7 + Math.sin(time * 1.5) * 0.2; // Пульсация прозрачности
        }
      }
      
      if (orbit2Ref.current?.material) {
        const material = orbit2Ref.current.material as MeshStandardMaterial;
        if (material && typeof material.emissiveIntensity !== 'undefined') {
          material.emissiveIntensity = 0.4 + Math.sin(time * 2 + Math.PI / 3) * 0.3; // Сдвиг фазы
          material.opacity = 0.7 + Math.sin(time * 1.5 + Math.PI / 3) * 0.2;
        }
      }
      
      if (orbit3Ref.current?.material) {
        const material = orbit3Ref.current.material as MeshStandardMaterial;
        if (material && typeof material.emissiveIntensity !== 'undefined') {
          material.emissiveIntensity = 0.4 + Math.sin(time * 2 + (2 * Math.PI / 3)) * 0.3; // Сдвиг фазы
          material.opacity = 0.7 + Math.sin(time * 1.5 + (2 * Math.PI / 3)) * 0.2;
        }
      }
    } catch (error) {
      // Игнорируем ошибки анимации, чтобы не ломать весь компонент
    }
  });

  // Параметры капсулы (уменьшена, чтобы поместиться внутри орбиталей)
  const radius = 0.3;
  const cylinderHeight = 0.4; // Общая высота цилиндрической части
  const segments = 64; // Больше сегментов для более гладкой поверхности
  const orbitRadius = 1.3; // Увеличенный радиус орбиталей, чтобы капсула была внутри
  
  // Вычисляем правильные позиции для соединения частей
  // В Three.js CylinderGeometry центрирован, так что центр цилиндра находится на указанной позиции
  const halfCylinderHeight = cylinderHeight / 2; // = 0.2
  const topCylinderY = halfCylinderHeight; // Центр верхнего цилиндра на 0.2, верх на 0.3, низ на 0.1
  const bottomCylinderY = -halfCylinderHeight; // Центр нижнего цилиндра на -0.2, верх на -0.1, низ на -0.3
  // Полусферы центрированы, их экватор находится на уровне центра
  // Верхняя полусфера: центр должен быть на высоте, где заканчивается верхний цилиндр (0.3)
  const topSphereY = topCylinderY + halfCylinderHeight / 2; // = 0.2 + 0.1 = 0.3
  // Нижняя полусфера: центр должен быть на высоте, где заканчивается нижний цилиндр (-0.3)
  const bottomSphereY = bottomCylinderY - halfCylinderHeight / 2; // = -0.2 - 0.1 = -0.3
  const jointY = 0; // Соединение в центре

  // Мемоизируем геометрию с обработкой ошибок
  const geometries = useMemo(() => {
    try {
      return {
        // Полусферы - верхняя и нижняя половины сферы
        topSphere: new SphereGeometry(radius, segments, segments, 0, Math.PI * 2, 0, Math.PI / 2),
        bottomSphere: new SphereGeometry(radius, segments, segments, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
        // Цилиндры для верхней и нижней частей
        topCylinder: new CylinderGeometry(radius, radius, halfCylinderHeight, segments),
        bottomCylinder: new CylinderGeometry(radius, radius, halfCylinderHeight, segments),
        // Соединительная полоса между половинками (заполняет зазор между цилиндрами)
        jointCylinder: new CylinderGeometry(radius * 0.995, radius * 0.995, halfCylinderHeight, segments),
        highlightSphere: new SphereGeometry(radius * 0.12, 24, 24),
        highlightSphereSmall: new SphereGeometry(radius * 0.08, 24, 24),
        textureTorus: new TorusGeometry(radius * 0.98, 0.003, 8, 32),
        // Орбитали (шире, без электронов)
        orbitTorus: new TorusGeometry(orbitRadius, 0.012, 8, 64), // Более толстые линии орбиталей
      };
    } catch (error) {
      // Возвращаем минимальную геометрию в случае ошибки
      return {
        topSphere: new SphereGeometry(radius, 16, 16),
        bottomSphere: new SphereGeometry(radius, 16, 16),
        topCylinder: new CylinderGeometry(radius, radius, halfCylinderHeight, 16),
        bottomCylinder: new CylinderGeometry(radius, radius, halfCylinderHeight, 16),
        jointCylinder: new CylinderGeometry(radius * 0.995, radius * 0.995, halfCylinderHeight, 16),
        highlightSphere: new SphereGeometry(radius * 0.12, 16, 16),
        highlightSphereSmall: new SphereGeometry(radius * 0.08, 16, 16),
        textureTorus: new TorusGeometry(radius * 0.98, 0.003, 8, 16),
        orbitTorus: new TorusGeometry(orbitRadius, 0.012, 8, 32),
      };
    }
  }, [radius, halfCylinderHeight, segments, orbitRadius]);

  // Мемоизируем материалы - эпичный дизайн с обработкой ошибок
  const materials = useMemo(() => {
    try {
      return {
        top: new MeshPhysicalMaterial({
          color: '#ffffff',
          metalness: 0.3,
          roughness: 0.05,
          clearcoat: 1.0,
          clearcoatRoughness: 0.05,
          transmission: 0.1,
          thickness: 0.5,
          ior: 1.5,
          emissive: '#ffffff',
          emissiveIntensity: 0.1,
        }),
        bottom: new MeshPhysicalMaterial({
          color: '#0a0a0a',
          metalness: 0.6,
          roughness: 0.05,
          clearcoat: 1.0,
          clearcoatRoughness: 0.05,
          transmission: 0.05,
          thickness: 0.5,
          ior: 1.5,
          emissive: '#1a1a2e',
          emissiveIntensity: 0.15,
        }),
        highlight: new MeshStandardMaterial({
          color: '#ffffff',
          metalness: 1.0,
          roughness: 0.0,
          transparent: true,
          opacity: 0.9,
          emissive: '#ffffff',
          emissiveIntensity: 0.5,
        }),
        highlightSmall: new MeshStandardMaterial({
          color: '#ffffff',
          metalness: 0.9,
          roughness: 0.05,
          transparent: true,
          opacity: 0.6,
          emissive: '#ffffff',
          emissiveIntensity: 0.3,
        }),
        glow: new MeshStandardMaterial({
          color: '#4a9eff',
          metalness: 0.8,
          roughness: 0.1,
          transparent: true,
          opacity: 0.4,
          emissive: '#4a9eff',
          emissiveIntensity: 0.8,
        }),
        orbit: new MeshStandardMaterial({
          color: '#a1a1aa', // Более яркий цвет для лучшей видимости
          metalness: 0.4,
          roughness: 0.2,
          transparent: true,
          opacity: 0.7,
          emissive: '#a1a1aa',
          emissiveIntensity: 0.4,
        }),
      };
    } catch (error) {
      // Возвращаем простые материалы в случае ошибки
      return {
        top: new MeshStandardMaterial({ color: '#ffffff' }),
        bottom: new MeshStandardMaterial({ color: '#0a0a0a' }),
        highlight: new MeshStandardMaterial({ color: '#ffffff', transparent: true, opacity: 0.9 }),
        highlightSmall: new MeshStandardMaterial({ color: '#ffffff', transparent: true, opacity: 0.6 }),
        glow: new MeshStandardMaterial({ color: '#4a9eff', transparent: true, opacity: 0.4 }),
        orbit: new MeshStandardMaterial({ color: '#a1a1aa', transparent: true, opacity: 0.7 }),
      };
    }
  }, []);

  return (
    <>
      {/* Улучшенное освещение для лучшей видимости */}
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 8, 5]} intensity={2.5} color="#ffffff" />
      <directionalLight position={[-5, -5, -5]} intensity={1.0} color="#a1a1aa" />
      <pointLight position={[3, 5, 3]} intensity={1.5} distance={12} decay={2} color="#ffffff" />
      <pointLight position={[-3, -5, -3]} intensity={0.8} distance={12} decay={2} color="#a1a1aa" />
      <pointLight position={[0, 0, 5]} intensity={1.0} distance={12} decay={2} color="#ffffff" />
      <spotLight position={[0, 8, 0]} angle={0.5} penumbra={1} intensity={1.2} color="#ffffff" />
      {/* Дополнительное освещение для орбиталей */}
      <pointLight position={[0, 0, 0]} intensity={0.5} distance={8} decay={1.5} color="#a1a1aa" />
      
      {/* Общий контейнер - капсула и орбитали вращаются вместе */}
      <group ref={containerRef}>
        
      {/* Капсула - внутри орбиталей */}
      <group rotation={[0, 0, Math.PI / 4]}>

      {/* Верхняя половинка капсулы - Полусфера */}
      <mesh position={[0, topSphereY, 0]} geometry={geometries.topSphere} material={materials.top} />

      {/* Верхняя половинка - Цилиндрическая часть (соединяет полусферу с центром) */}
      <mesh position={[0, topCylinderY, 0]} geometry={geometries.topCylinder} material={materials.top} />

      {/* Соединительная полоса между половинками */}
      <mesh position={[0, jointY, 0]} geometry={geometries.jointCylinder}>
        <meshPhysicalMaterial
          color="#1a1a1a"
          metalness={0.6}
          roughness={0.05}
          clearcoat={1.0}
          clearcoatRoughness={0.05}
          transmission={0.05}
          thickness={0.3}
          ior={1.5}
        />
      </mesh>

      {/* Нижняя половинка - Цилиндрическая часть (соединяет центр с полусферой) */}
      <mesh position={[0, bottomCylinderY, 0]} geometry={geometries.bottomCylinder} material={materials.bottom} />

      {/* Нижняя половинка капсулы - Полусфера */}
      <mesh position={[0, bottomSphereY, 0]} geometry={geometries.bottomSphere} material={materials.bottom} />

      {/* Эпичные блики на верхней половинке */}
      <mesh position={[radius * 0.3, topSphereY + radius * 0.2, radius * 0.45]} geometry={geometries.highlightSphere} material={materials.highlight} />
      <mesh position={[-radius * 0.25, topSphereY + radius * 0.1, radius * 0.35]} geometry={geometries.highlightSphereSmall} material={materials.highlightSmall} />

      {/* Эпичные блики на нижней половинке */}
      <mesh position={[-radius * 0.3, bottomSphereY - radius * 0.1, radius * 0.35]} geometry={geometries.highlightSphereSmall} material={materials.highlightSmall} />
      <mesh position={[radius * 0.25, bottomSphereY - radius * 0.15, radius * 0.4]} geometry={geometries.highlightSphereSmall} material={materials.highlightSmall} />

      {/* Светящиеся акценты */}
      <mesh position={[radius * 0.9, 0, 0]} geometry={geometries.highlightSphereSmall} material={materials.glow} />
      <mesh position={[-radius * 0.9, 0, 0]} geometry={geometries.highlightSphereSmall} material={materials.glow} />
      <mesh position={[0, 0, radius * 0.9]} geometry={geometries.highlightSphereSmall} material={materials.glow} />
      <mesh position={[0, 0, -radius * 0.9]} geometry={geometries.highlightSphereSmall} material={materials.glow} />

      {/* Дополнительные светящиеся кольца для эффекта */}
      <mesh position={[0, topCylinderY + radius * 0.1, 0]} rotation={[0, 0, 0]} geometry={geometries.textureTorus}>
        <meshStandardMaterial
          color="#ffffff"
          metalness={0.5}
          roughness={0.1}
          transparent
          opacity={0.3}
          emissive="#ffffff"
          emissiveIntensity={0.2}
        />
      </mesh>
      <mesh position={[0, bottomCylinderY - radius * 0.1, 0]} rotation={[0, 0, 0]} geometry={geometries.textureTorus}>
        <meshStandardMaterial
          color="#4a9eff"
          metalness={0.5}
          roughness={0.1}
          transparent
          opacity={0.3}
          emissive="#4a9eff"
          emissiveIntensity={0.3}
        />
       </mesh>
       </group>

       {/* Орбитали - вращаются вместе с капсулой, с анимацией свечения */}
       {/* Правильное расположение: одна скошенная по центру, две отзеркаленные под 45° */}
       
       {/* Орбиталь 1 - скошенная по центру (наклонная) */}
       <mesh 
         ref={orbit1Ref}
         rotation={[Math.PI / 4, 0, 0]} 
         geometry={geometries.orbitTorus} 
         material={materials.orbit} 
       />

       {/* Орбиталь 2 - отзеркаленная под 45° (первая) */}
       <mesh 
         ref={orbit2Ref}
         rotation={[0, Math.PI / 4, Math.PI / 2]} 
         geometry={geometries.orbitTorus} 
         material={materials.orbit} 
       />

       {/* Орбиталь 3 - отзеркаленная под 45° (вторая, симметричная) */}
       <mesh 
         ref={orbit3Ref}
         rotation={[0, -Math.PI / 4, Math.PI / 2]} 
         geometry={geometries.orbitTorus} 
         material={materials.orbit} 
       />
       
       </group>
     </>
   );
 }

