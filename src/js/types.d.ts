import * as RAPIER from '@dimforge/rapier3d-compat'
import * as THREE from 'three'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'
import { GameBody } from '../js/game'

declare global {
  // game.js
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
    player: Gamebody
    enemies: GameBody[]
  }

  // player-factory.js
  interface PlayerFactoryAttributes {
    world: RAPIER.World
    position: THREE.Vector3
    geo: THREE.BufferGeometry
    mat: THREE.MeshStandardMaterial
    colliderDesc: RAPIER.ColliderDesc
    linearDamping: number
    rigidBody: RAPIER.RigidBody | null
    body: GameBody | null
  }

  interface PlayerFactoryConfig {
    world: RAPIER.World
    position?: THREE.Vector3
    geo?: THREE.BufferGeometry
    mat?: THREE.Material
    colliderDesc?: RAPIER.ColliderDesc
  }

  // enemy-factory.js
  interface EnemyFactoryAttributes {
    world: RAPIER.World
    position: THREE.Vector3
    mesh: THREE.Mesh | null
    colliderDesc: RAPIER.ColliderDesc | null
    linearDamping: number
    rigidBody: RAPIER.RigidBody | null
    body: GameBody | null
  }

  interface EnemyFactoryConfig {
    world: RAPIER.World
    position?: THREE.Vector3
  }
}

export {}
