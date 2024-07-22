import * as RAPIER from '@dimforge/rapier3d-compat'
import * as THREE from 'three'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'
import { GameBody } from './game'

export type Message = {
  topic: string
  value: Object
}

export type PlayerFactoryConfig = {
  world: RAPIER.World
  position?: THREE.Vector3
  geo?: THREE.BufferGeometry
  mat?: THREE.Material
  colliderDesc?: RAPIER.ColliderDesc
}

export type EnemyFactoryConfig = {
  world: RAPIER.World
  position?: THREE.Vector3
}

declare global {
  interface GameClassAttributes {
    scene: THREE.Scene | null
    camera: THREE.PerspectiveCamera | null
    renderer: THREE.WebGLRenderer | null
    gui: GUI | null
    width: number | null
    height: number | null
    world: RAPIER.World | null
    characterController: RAPIER.KinematicCharacterController | null
    ground: THREE.Mesh | null
    bodies: GameBody[]
  }
}
