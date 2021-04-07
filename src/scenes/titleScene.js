export default class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TitleScene' })
  }
  preload() {
    // load feedback images (check? x? sparks?)
  }
  create() {
    let height = this.game.config.height
    let center = height / 2
    let user_config = this.game.user_config

    this.add
      .text(center, center - 200, 'TITLE', {
        fontSize: 160,
        fill: true,
        fontFamily: 'Arial',
        strokeThickness: 2,
        shadow: {
          blur: 1,
          color: '#ffffff',
          stroke: true,
          fill: true,
        },
      })
      .setOrigin(0.5, 0.5)

    let start_txt = this.add
      .text(center, center + 200, 'Click the left mouse\nbutton to start.', {
        fontFamily: 'Verdana',
        fontStyle: 'bold',
        fontSize: 60,
        color: '#dddddd',
        stroke: '#444444',
        strokeThickness: 6,
        align: 'center',
      })
      .setOrigin(0.5, 0.5)

    this.flash = this.tweens.add({
      targets: start_txt,
      alpha: { from: 0.3, to: 1 },
      ease: 'Linear',
      duration: 1000,
      repeat: -1,
      yoyo: true,
    })

    this.input.once('pointerdown', (ptr) => {
      // I wish I could do both at the same time, but after the fullscreen
      // comes on it releases the pointer lock?? At least on FF, chrome does fine
      // this.input.mouse.requestPointerLock()
      this.flash.stop()
      this.scale.startFullscreen()
      this.tweens.addCounter({
        from: 255,
        to: 0,
        duration: 2000,
        onUpdate: (t) => {
          let v = Math.floor(t.getValue())
          this.cameras.main.setAlpha(v / 255)
        },
        onComplete: () => {
          this.input.mouse.requestPointerLock()
          this.scene.start('MainScene')
        },
      })
    })
    // this.input.once('pointerup', (ptr) => {
    //   this.input.mouse.requestPointerLock()
    // })
  }
}
