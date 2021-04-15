import '@babel/polyfill'
import Phaser from './phaser-custom' // slightly more nuanced custom build

import UAParser from 'ua-parser-js'

import BBCodeTextPlugin from 'phaser3-rex-plugins/plugins/bbcodetext-plugin.js'
import TextTypingPlugin from 'phaser3-rex-plugins/plugins/texttyping-plugin.js'
import TitleScene from './scenes/titleScene'
import MainScene from './scenes/mainScene'
// import EndScene from './scenes/endScene'

let small_dim = 800 // nothing's going to be perfectly scaled, but that's fine?
const phaser_config = {
  type: Phaser.AUTO,
  backgroundColor: '#111111',
  scale: {
    parent: 'phaser-game',
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: small_dim,
    height: small_dim,
  },
  audio: {
    noAudio: true,
  },
  scene: [TitleScene, MainScene],
  plugins: {
    global: [
      {
        key: 'rexBBCodeTextPlugin',
        plugin: BBCodeTextPlugin,
        start: true,
      },
      {
        key: 'rexTextTypingPlugin',
        plugin: TextTypingPlugin,
        start: true,
      },
    ],
  },
}

// https://stackoverflow.com/a/1527820/2690232
function getRandomInt(min, max) {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min + 1)) + min
}

window.addEventListener('load', () => {
  const game = new Phaser.Game(phaser_config)
  const url_params = new URL(window.location.href).searchParams
  // If coming from prolific, use that ID. Otherwise, generate some random chars
  const randomString = (length) => [...Array(length)].map(() => (~~(Math.random() * 36)).toString(36)).join('')
  let id = url_params.get('PROLIFIC_PID') || url_params.get('id') || localStorage.getItem('id') || randomString(8)
  localStorage.setItem('id', id)

  // for now, just exploring adaptive vs non
  let exp_type = url_params.get('exp_type') || 'adapt_vs_non'
  // group
  let group = url_params.get('group') || getRandomInt(1, 2)

  let ua_res = new UAParser().getResult()
  let user_config = {
    id: id.slice(0, 8),
    is_prolific: url_params.get('PROLIFIC_PID') !== null,
    exp_type: exp_type,
    datetime: new Date(),
    width: game.config.width,
    height: game.config.height,
    renderer: game.config.renderType === Phaser.CANVAS ? 'canvas' : 'webgl',
    // only take a subset of the UA results-- we don't need everything
    user_agent: {
      browser: ua_res.browser,
      os: ua_res.os,
    },
    fullscreen_supported: document.fullscreenEnabled, // this is pretty important for us?
    debug: url_params.get('debug') !== null,
    version: 2,
  }
  game.user_config = user_config // patch in to pass into game
  // set up for user
})

// once the data is successfully sent, null this out
// need to log this too
export function onBeforeUnload(event) {
  // https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeunload_event
  event.preventDefault()
  console.warn('Early termination impending?')
  event.returnValue = ''
  return 'experiment not done yet.'
}
// TODO: add back after iterating
window.addEventListener('beforeunload', onBeforeUnload)

// if prematurely ended, shuffle logs away?
// we'll at least store a local time to get an idea if they're
// refreshing
window.addEventListener('unload', (event) => {})
