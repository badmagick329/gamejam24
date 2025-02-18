import {
  useCamera,
  useComposer,
  useControls,
  useRenderer,
  useScene,
  useStats,
} from './init.js'

// animation params
const localData = {
  timestamp: 0,
  timeDiff: 0,
  frame: null,
}
const localFrameOpts = {
  data: localData,
}

const frameEvent = new MessageEvent('tick', localFrameOpts)

class TickManager extends EventTarget {
  constructor({ timestamp, timeDiff, frame } = localData) {
    super()

    this.timestamp = timestamp
    this.timeDiff = timeDiff
    this.frame = frame
  }
  startLoop() {
    const composer = useComposer()
    const renderer = useRenderer()
    const scene = useScene()
    const camera = useCamera()
    const controls = useControls()
    const stats = useStats()

    if (!renderer) {
      throw new Error('Updating Frame Failed : Uninitialized Renderer')
    }

    let lastTimestamp = performance.now()

    const animate = (timestamp, frame) => {
      // get timediff
      this.timestamp = timestamp ?? performance.now()
      this.timeDiff = timestamp - lastTimestamp
      lastTimestamp = timestamp

      const timeDiffCapped = this.timeDiff

      // performance tracker
      controls?.update()
      composer.render()
      stats?.update()

      this.tick(timestamp, timeDiffCapped, frame)
    }

    renderer.setAnimationLoop(animate)
  }
  tick(timestamp, timeDiff, frame) {
    localData.timestamp = timestamp
    localData.frame = frame
    localData.timeDiff = timeDiff
    this.dispatchEvent(frameEvent)
  }
}

export default TickManager
