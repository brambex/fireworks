import Things from './things'

type Options = {
  maxRockets?: number
  numParticles?: number
  explosionMinHeight?: number
  explosionMaxHeight?: number
  explosionChance?: number
  rocketSpawnInterval?: number
  width?: number
  height?: number
}

export default class Fireworks {
  private container: HTMLElement
  private maxRockets: number
  private rocketSpawnInterval: number
  private cw: number
  private ch: number
  private minH: number
  private maxH: number
  private chance: number
  private things: Things
  private interval: number
  private rafInterval: number

  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D

  constructor(
    container: HTMLElement,
    {
      rocketSpawnInterval = 150,
      maxRockets = 3,
      numParticles = 100,
      explosionMinHeight = 0.2,
      explosionMaxHeight = 0.9,
      explosionChance = 0.08,
      width = container.clientWidth,
      height = container.clientHeight
    }: Options = {}
  ) {
    this.container = container
    this.rocketSpawnInterval = rocketSpawnInterval
    this.maxRockets = maxRockets
    this.cw = width
    this.ch = height
    this.maxH = this.ch * (1 - explosionMaxHeight)
    this.minH = this.ch * (1 - explosionMinHeight)
    this.chance = explosionChance

    this.canvas = document.createElement('canvas')
    this.canvas.width = this.cw
    this.canvas.height = this.ch
    this.ctx = this.canvas.getContext('2d')
    container.appendChild(this.canvas)

    this.things = new Things({
      maxRockets: this.maxRockets,
      numParticles,
      cw: this.cw,
      ch: this.ch
    })
  }

  destroy(): void {
    this.canvas.parentElement.removeChild(this.canvas)
    window.clearInterval(this.interval)
    window.cancelAnimationFrame(this.rafInterval)
  }

  start(): () => void {
    if (this.maxRockets > 0) {
      this.interval = window.setInterval(
        () => this.things.spawnRockets(),
        this.rocketSpawnInterval
      )
      this.rafInterval = window.requestAnimationFrame(() => this.update())
    }
    return (): void => this.stop()
  }

  private updateDimensions(): void {
    this.canvas.width = this.cw
    this.canvas.height = this.ch
    this.things.cw = this.cw
    this.things.ch = this.ch
  }

  setSize(width: number, height: number): void {
    this.cw = width
    this.ch = height
    this.updateDimensions()
  }

  resetSize(): void {
    this.cw = this.container.clientWidth
    this.ch = this.container.clientHeight
    this.updateDimensions()
  }

  stop(): void {
    window.clearInterval(this.interval)
    this.interval = null
  }

  kill(): void {
    this.things.clear()
    this.stop()
    window.cancelAnimationFrame(this.rafInterval)
    this.rafInterval = null
    this._clear(true)
  }

  fire(): void {
    this.things.spawnRocket()
    if (!this.rafInterval) {
      this.rafInterval = window.requestAnimationFrame(() => this.update())
    }
  }

  private _clear(force = false): void {
    this.ctx.globalCompositeOperation = 'destination-out'
    this.ctx.fillStyle = `rgba(0, 0, 0 ${force ? '' : ', 0.5'})`
    this.ctx.fillRect(0, 0, this.cw, this.ch)
    this.ctx.globalCompositeOperation = 'lighter'
  }

  update(): void {
    this._clear()

    for (const particle of this.things.entries()) {
      particle.draw(this.ctx)
      particle.update()

      if (particle.shouldRemove(this.cw, this.ch)) {
        this.things.delete(particle)
      } else if (particle.shouldExplode(this.maxH, this.minH, this.chance)) {
        this.things.explode(particle)
      }
    }

    if (this.interval || this.things.size() > 0) {
      this.rafInterval = window.requestAnimationFrame(() => this.update())
    } else {
      this._clear(true)
      this.rafInterval = null
    }
  }
}
