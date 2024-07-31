import * as THREE from 'three'
import { SavePass } from 'three/addons/postprocessing/SavePass.js'
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'
import { BlendShader } from 'three/addons/shaders/BlendShader.js'
import { CopyShader } from 'three/addons/shaders/CopyShader.js'
import { addPass } from '../render/init.js'

/**
 * @param {number} width
 * @param {number} height
 * @param {number} motionBlur
 */
export function postprocessing(width, height, motionBlur) {
  // postprocessing
  const renderTargetParameters = {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    stencilBuffer: false,
  }

  // save pass
  const savePass = new SavePass(
    new THREE.WebGLRenderTarget(width, height, renderTargetParameters)
  )

  // blend pass
  const blendPass = new ShaderPass(BlendShader, 'tDiffuse1')
  blendPass.uniforms['tDiffuse2'].value = savePass.renderTarget.texture
  blendPass.uniforms['mixRatio'].value = motionBlur

  // output pass
  const outputPass = new ShaderPass(CopyShader)
  outputPass.renderToScreen = true

  // adding passes to composer
  addPass(blendPass)
  addPass(savePass)
  addPass(outputPass)
}
