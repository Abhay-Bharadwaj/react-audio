let audioContext;
let audioBuffer;
let audioSource;
let analyserNode;
let animationFrameId;

function initialize() {
  const audioFileInput = document.getElementById('audioFileInput');
  const playBtn = document.getElementById('playBtn');
  const pauseBtn = document.getElementById('pauseBtn');
  const volumeRange = document.getElementById('volumeRange');
  const waveform = document.getElementById('waveform');

  audioFileInput.addEventListener('change', handleAudioFile);
  playBtn.addEventListener('click', playAudio);
  pauseBtn.addEventListener('click', pauseAudio);
  volumeRange.addEventListener('input', adjustVolume);

  audioContext = new (window.AudioContext || window.webkitAudioContext)();

  analyserNode = audioContext.createAnalyser();
  analyserNode.fftSize = 2048;
  const bufferLength = analyserNode.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  function renderWaveform() {
    animationFrameId = requestAnimationFrame(renderWaveform);
    analyserNode.getByteTimeDomainData(dataArray);

    waveform.innerHTML = '';
    const canvas = document.createElement('canvas');
    const canvasContext = canvas.getContext('2d');
    canvas.width = waveform.clientWidth;
    canvas.height = waveform.clientHeight;
    waveform.appendChild(canvas);

    canvasContext.clearRect(0, 0, canvas.width, canvas.height);
    canvasContext.lineWidth = 2;
    canvasContext.strokeStyle = '#000000';

    canvasContext.beginPath();
    const sliceWidth = canvas.width * 1.0 / bufferLength;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0;
      const y = v * canvas.height / 2;

      if (i === 0) {
        canvasContext.moveTo(x, y);
      } else {
        canvasContext.lineTo(x, y);
      }

      x += sliceWidth;
    }

    canvasContext.lineTo(canvas.width, canvas.height / 2);
    canvasContext.stroke();
  }

  function handleAudioFile(event) {
    const file = event.target.files[0];
    const fileReader = new FileReader();

    fileReader.onload = function(e) {
      const arrayBuffer = e.target.result;

      audioContext.decodeAudioData(arrayBuffer, function(buffer) {
        audioBuffer = buffer;
        playBtn.disabled = false;
        pauseBtn.disabled = false;
        renderWaveform();
      });
    };

    fileReader.readAsArrayBuffer(file);
  }

  function playAudio() {
    if (audioSource && audioContext.state === 'suspended') {
      audioContext.resume();
    } else {
      audioSource = audioContext.createBufferSource();
      audioSource.buffer = audioBuffer;
      audioSource.connect(analyserNode);
      analyserNode.connect(audioContext.destination);
      audioSource.start();
    }
  }

  function pauseAudio() {
    if (audioSource && audioContext.state === 'running') {
      audioContext.suspend();
    }
  }

  function adjustVolume(event) {
    if (audioSource) {
      audioSource.gain.setValueAtTime(event.target.value, audioContext.currentTime);
    }
  }
}
window.addEventListener('load', initialize);
