import * as RAPIER from '@dimforge/rapier3d-compat'
import * as THREE from 'three'

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
