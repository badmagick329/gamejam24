export type Message = {
  topic: string
  value: Object
}

export type GameSettings = {
  thirdPerson: boolean
  groundWidth: number
  groundDepth: number
  cannonDebugger: boolean
  lightCameraHelper: boolean
  darkGround: number
  darkPlayer: number
  darkEnemy: number
  lightGround: number
  lightPlayer: number
  lightEnemy: number
  playerSphereRadius: number
  playerBoxSize: number
  playerY: number
  playerSpeed: number
  playerLinearDamping: number
  bulletSpeed: number
  bulletRadius: number
  bulletIntervalBetweenShots: number
  enemyMovement: boolean
}
