import Granular from 'granular-js'

import p5 from 'p5'
import 'p5/lib/addons/p5.sound'
import getData from './getData'

import Waveform from './Waveform'
import Grains from './Grains'
import DragAndDrop from './DragAndDrop'
import AutoPlay from './AutoPlay'

// TODO: explore around
// TODO: add peerjs chatroom capabilities to this 

const PRESETS = [
  {
    name: 1,
    url: 'samples/ringTones.wav'
  },
  {
    name: '2',
    url: 'samples/doit2.wav'
  },
  {
    name: 3,
    url: 'samples/four1.wav'
  },
  {
    name: 4,
    url: 'samples/gotit1.wav'
  }
]

const pillPlay = document.getElementById('pill-play'),
  pillLoading = document.getElementById('pill-loading'),
  pillTitle = document.getElementById('pill-title'),
  canvases = document.getElementById('canvases'),
  presets = document.getElementById('presets')

let autoPlay,
  dragAndDrop,
  granular

const AUDIO_BUFFER_CACHE = {}

function stopPropagation (event) {
  event.stopPropagation()
}

async function loadUserData (data) {
  autoPlay.stop()

  pillPlay.textContent = 'Play'

  pillLoading.classList.remove('hidden')
  pillPlay.classList.add('inactive')
  presets.classList.add('inactive')

  const buttons = Array.from(document.querySelectorAll('#presets .preset'))

  buttons.forEach(b => b.classList.add('pill-inverted'))

  await granular.setBuffer(data)

  pillLoading.classList.add('hidden')
  pillPlay.classList.remove('inactive')
  presets.classList.remove('inactive')
}

async function loadPreset ({ name, url }) {
  if (process.ENV === 'development') {
  }

  autoPlay.stop()

  pillPlay.textContent = 'Play'

  pillLoading.classList.remove('hidden')
  pillPlay.classList.add('inactive')
  presets.classList.add('inactive')

  let data


  data = await getData(url)
  const audioBuffer = await granular.setBuffer(data)

  AUDIO_BUFFER_CACHE[name] = audioBuffer

  pillLoading.classList.add('hidden')
  pillPlay.classList.remove('inactive')
  presets.classList.remove('inactive')
}

function createPresets (data, text) {
  PRESETS.forEach((preset) => {
    const { name } = preset

    const button = document.createElement('div')

    button.classList.add('preset', 'pill', 'pill-inverted', 'pill-button')

    button.textContent = name

    button.addEventListener('click', () => {
      const buttons = Array.from(document.querySelectorAll('#presets .preset'))

      buttons.forEach((b) => {
        if (button === b) {
          b.classList.remove('pill-inverted')
        } else {
          b.classList.add('pill-inverted')
        }
      })


      loadPreset(preset)
    })

    presets.appendChild(button)
  })
}

async function init () {
  const audioContext = p5.prototype.getAudioContext()

  granular = new Granular({
    audioContext,
    envelope: {
      attack: 0.2,
      decay: 0.5
    },
    density: 0.8,
    spread: 0.1,
    pitch: 1
  })

  const delay = new p5.Delay()

  delay.process(granular, 0, 0.5, 3000) // source, delayTime, feedback, filter frequency

  const reverb = new p5.Reverb()

  reverb.process(delay) // source, reverbTime, decayRate in %, reverse

  reverb.amp(0)

  const compressor = new p5.Compressor()

  compressor.process(reverb, 0.005, 6, 10, -24, 0.05) // [attack], [knee], [ratio], [threshold], [release]

  const waveform = new Waveform()

  new Grains(granular)

  dragAndDrop = new DragAndDrop(canvases)

  dragAndDrop.on('fileRead', async ({ data }) => {
    loadUserData(data)
  })

  granular.on('bufferSet', ({ buffer }) => {
    waveform.draw(buffer)
  })

  autoPlay = new AutoPlay(granular)

  pillPlay.addEventListener('click', (event) => {
    event.preventDefault()
    event.stopPropagation()

    if (autoPlay.isRunning()) {
      autoPlay.stop()

      pillPlay.textContent = 'Play'
    } else {
      autoPlay.start()

      pillPlay.textContent = 'Stop'
    }
  })

  window.addEventListener('keydown', (key) => {
    // space
    if (event.keyCode === 32) {
      if (autoPlay.isRunning()) {
        // autoPlay.stop()

        pillPlay.textContent = 'Play'
      } else {
        // autoPlay.start()
        autoPlay.interpolate()
        pillPlay.textContent = 'Stop'
      }
    }
  })

  createPresets()

  const buttons = Array.from(document.querySelectorAll('#presets .preset'))

  buttons.concat([pillPlay, pillTitle]).forEach(element => {
    [
      'click',
      'mousedown',
      'touchstart'
    ].forEach(event => {
      element.addEventListener(event, stopPropagation)
    })
  })

  buttons[0].classList.remove('pill-inverted')

  await loadPreset(PRESETS[0])

  pillPlay.classList.add('animated', 'pulse')
}

init()
