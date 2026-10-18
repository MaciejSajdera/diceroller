/**
 * 3D Dice Roller using Three.js
 * Provides a toggle between 2D and 3D dice visualization
 */

import React from 'react';
import * as THREE from 'three';

interface Props {
  value: number | null;
  sides: number;
  rollKey?: number;
  onRollComplete?: (value: number) => void;
}

export class Dice3D extends React.Component<Props> {
  private containerRef = React.createRef<HTMLDivElement>();
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private renderer: THREE.WebGLRenderer | null = null;
  private dice: THREE.Mesh | null = null;
  private animationId: number | null = null;
  private isRolling = false;
  private targetRotation = { x: 0, y: 0, z: 0 };
  private currentRotation = { x: 0, y: 0, z: 0 };
  private rotationVelocity = { x: 0, y: 0, z: 0 };

  componentDidMount() {
    this.initThreeJS();
    if (this.props.value !== null) {
      this.setDiceToValue(this.props.value);
    }
  }

  componentWillUnmount() {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.renderer) {
      this.renderer.dispose();
    }
  }

  componentDidUpdate(prevProps: Props) {
    if (this.props.rollKey !== prevProps.rollKey && this.props.value !== null) {
      this.rollDice(this.props.value);
    }
  }

  private initThreeJS() {
    if (!this.containerRef.current) return;

    const width = 120;
    const height = 120;

    // Scene
    this.scene = new THREE.Scene();

    // Camera
    this.camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
    this.camera.position.z = 4;

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setClearColor(0x000000, 0);
    this.containerRef.current.appendChild(this.renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    this.scene.add(directionalLight);

    // Create dice geometry
    this.createDice();

    // Start animation loop
    this.animate();
  }

  private createDice() {
    if (!this.scene) return;

    const geometry = this.getDiceGeometry(this.props.sides);
    const material = new THREE.MeshStandardMaterial({
      color: this.getDiceColor(this.props.sides),
      roughness: 0.3,
      metalness: 0.1,
    });

    this.dice = new THREE.Mesh(geometry, material);
    this.scene.add(this.dice);

    // Add numbers to faces
    this.addNumbersToFaces();
  }

  private getDiceGeometry(sides: number): THREE.BufferGeometry {
    switch (sides) {
      case 4:
        return new THREE.TetrahedronGeometry(1.2);
      case 6:
        return new THREE.BoxGeometry(1.8, 1.8, 1.8);
      case 8:
        return new THREE.OctahedronGeometry(1.2);
      case 12:
        return new THREE.DodecahedronGeometry(1.2);
      case 20:
        return new THREE.IcosahedronGeometry(1.2);
      default:
        return new THREE.BoxGeometry(1.8, 1.8, 1.8);
    }
  }

  private getDiceColor(sides: number): number {
    switch (sides) {
      case 4: return 0xec4899; // pink
      case 6: return 0x0ea5e9; // blue
      case 8: return 0xa855f7; // purple
      case 10: return 0x14b8a6; // teal
      case 12: return 0xeab308; // yellow
      case 20: return 0xf43f5e; // red
      case 100: return 0x64748b; // gray
      default: return 0x64748b;
    }
  }

  private addNumbersToFaces() {
    if (!this.dice || !this.scene || this.props.sides !== 6) return;

    // For simplicity, only add numbers to d6 for now
    // In a real implementation, you'd load textures with numbers
    // For now, we'll just use solid colors
  }

  private setDiceToValue(value: number) {
    if (!this.dice) return;

    // Calculate rotation to show the correct face
    const rotations = this.getRotationForValue(value, this.props.sides);
    this.dice.rotation.set(rotations.x, rotations.y, rotations.z);
    this.currentRotation = { ...rotations };
    this.targetRotation = { ...rotations };
  }

  private getRotationForValue(value: number, sides: number): { x: number; y: number; z: number } {
    if (sides === 6) {
      // D6 face rotations
      const rotations: Record<number, { x: number; y: number; z: number }> = {
        1: { x: 0, y: 0, z: 0 },
        2: { x: 0, y: Math.PI / 2, z: 0 },
        3: { x: 0, y: 0, z: -Math.PI / 2 },
        4: { x: 0, y: 0, z: Math.PI / 2 },
        5: { x: 0, y: -Math.PI / 2, z: 0 },
        6: { x: Math.PI, y: 0, z: 0 },
      };
      return rotations[value] || { x: 0, y: 0, z: 0 };
    }

    // For other dice, use a simple rotation based on value
    const angle = (value / sides) * Math.PI * 2;
    return { x: angle, y: angle * 1.3, z: angle * 0.7 };
  }

  private rollDice(finalValue: number) {
    if (this.isRolling) return;

    this.isRolling = true;

    // Set random initial velocity
    this.rotationVelocity = {
      x: (Math.random() - 0.5) * 0.5,
      y: (Math.random() - 0.5) * 0.5,
      z: (Math.random() - 0.5) * 0.5,
    };

    // Set target rotation for final value
    const baseRotation = this.getRotationForValue(finalValue, this.props.sides);
    this.targetRotation = {
      x: baseRotation.x + Math.PI * 4,
      y: baseRotation.y + Math.PI * 4,
      z: baseRotation.z + Math.PI * 4,
    };

    // Animation will complete in ~500ms
    setTimeout(() => {
      this.isRolling = false;
      if (this.props.onRollComplete) {
        this.props.onRollComplete(finalValue);
      }
    }, 600);
  }

  private animate = () => {
    if (!this.dice || !this.renderer || !this.scene || !this.camera) return;

    this.animationId = requestAnimationFrame(this.animate);

    if (this.isRolling) {
      // Apply rolling physics
      const damping = 0.92;
      this.rotationVelocity.x *= damping;
      this.rotationVelocity.y *= damping;
      this.rotationVelocity.z *= damping;

      // Move towards target
      const spring = 0.08;
      this.rotationVelocity.x += (this.targetRotation.x - this.currentRotation.x) * spring;
      this.rotationVelocity.y += (this.targetRotation.y - this.currentRotation.y) * spring;
      this.rotationVelocity.z += (this.targetRotation.z - this.currentRotation.z) * spring;

      this.currentRotation.x += this.rotationVelocity.x;
      this.currentRotation.y += this.rotationVelocity.y;
      this.currentRotation.z += this.rotationVelocity.z;

      this.dice.rotation.set(
        this.currentRotation.x,
        this.currentRotation.y,
        this.currentRotation.z
      );
    } else {
      // Gentle idle rotation
      this.dice.rotation.y += 0.003;
    }

    this.renderer.render(this.scene, this.camera);
  };

  render() {
    return <div ref={this.containerRef} style={{ width: 120, height: 120, margin: '0 auto' }} />;
  }
}
