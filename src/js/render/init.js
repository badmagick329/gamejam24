import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'
import Stats from 'three/examples/jsm/libs/stats.module.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import TickManager from './tick-manager.js'

let scene,
  sceneHUD,
  camera,
  renderer,
  composer,
  controls,
  stats,
  gui,
  renderWidth,
  renderHeight,
  renderAspectRatio
const renderTickManager = new TickManager()

export const initEngine = async (config) => {
  scene = new THREE.Scene()

  renderWidth = window.innerWidth
  renderHeight = window.innerHeight

  renderAspectRatio = renderWidth / renderHeight

  camera = new THREE.PerspectiveCamera(75, renderAspectRatio, 0.1, 1000)
  camera.position.z = 2

  renderer = new THREE.WebGLRenderer({ antialias: false })
  renderer.setSize(renderWidth, renderHeight)
  renderer.setPixelRatio(window.devicePixelRatio * 1.5)
  renderer.autoClear = false

  renderer.setClearColor(0x101114)

  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap

  document.body.appendChild(renderer.domElement)

  // HUD
  sceneHUD = new THREE.Scene()
  const hudCanvas = document.createElement('canvas')
  hudCanvas.width = renderWidth
  hudCanvas.height = renderHeight
  sceneHUD.canvas = hudCanvas
  sceneHUD.ctx = hudCanvas.getContext('2d')

  const cameraHUD = new THREE.OrthographicCamera(
    -renderWidth / 2,
    renderWidth / 2,
    renderHeight / 2,
    -renderHeight / 2,
    0,
    30
  )

  sceneHUD.hudTexture = new THREE.Texture(hudCanvas)
  sceneHUD.hudTexture.needsUpdate = true
  sceneHUD.renderWidth = renderWidth
  sceneHUD.renderHeight = renderHeight
  const material = new THREE.MeshBasicMaterial({ map: sceneHUD.hudTexture })
  material.transparent = true

  const planeGeometry = new THREE.PlaneGeometry(renderWidth, renderHeight)
  const plane = new THREE.Mesh(planeGeometry, material)
  sceneHUD.add(plane)
  // End HUD

  const target = new THREE.WebGLRenderTarget(renderWidth, renderHeight, {
    samples: 8,
  })
  composer = new EffectComposer(renderer, target)
  const renderPass = new RenderPass(scene, camera)
  const uiPass = new RenderPass(sceneHUD, cameraHUD)
  uiPass.clear = false
  composer.addPass(renderPass)
  composer.addPass(uiPass)

  if (config?.bloom) {
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(renderWidth, renderHeight),
      config.bloom?.strength ?? 1.5,
      config.bloom?.radius ?? 0.5,
      config.bloom?.threshold ?? 0.002
    )
    composer.addPass(bloomPass)
  }

  stats = Stats()
  document.body.appendChild(stats.dom)

  gui = new GUI()

  if (!config?.disableOrbitControls) {
    controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
  }

  window.addEventListener(
    'resize',
    () => {
      renderWidth = window.innerWidth
      renderHeight = window.innerHeight
      renderAspectRatio = renderWidth / renderHeight

      renderer.setPixelRatio(window.devicePixelRatio * 1.5)

      camera.aspect = renderAspectRatio
      camera.updateProjectionMatrix()

      renderer.setSize(renderWidth, renderHeight)
      composer.setSize(renderWidth, renderHeight)
    },
    false
  )

  renderTickManager.startLoop()
}

/**
 * @returns {THREE.Renderer}
 */
export const useRenderer = () => renderer

/**
 * @typedef {Object} RenderSize
 * @property {number} width
 * @property {number} height
 */
/**
 * @returns {RenderSize}
 */
export const useRenderSize = () => ({
  width: renderWidth,
  height: renderHeight,
})

/**
 * @returns {THREE.Scene}
 */
export const useScene = () => scene

/**
 * @returns {THREE.Scene}
 */
export const useSceneHUD = () => sceneHUD

/**
 * @returns {THREE.Camera}
 */
export const useCamera = () => camera

/**
 * @returns {OrbitControls}
 */
export const useControls = () => controls

/**
 * @returns {Stats}
 */
export const useStats = () => stats

/**
 * @returns {EffectComposer}
 */
export const useComposer = () => composer

/**
 * @returns {GUI}
 */
export const useGui = () => gui

/**
 * @param {THREE.Pass} pass
 * @returns {void}
 */
export const addPass = (pass) => {
  composer.addPass(pass)
}

/**
 * Perform an action on each frame tick.
 * @param {Function} fn
 * @returns {void}
 */
export const useTick = (fn) => {
  if (renderTickManager) {
    const _tick = (e) => {
      fn(e.data)
    }
    renderTickManager.addEventListener('tick', _tick)
  }
}
