let players = [];
let currentIndex = 0;
let previousVolume = 0;
let audioContext, analyser, microphone, dataArray;
let animationId;
let shoutButtonPressed = false;
let silenceTimeout;

function startGame() {
  if (players.length < 2) {
    alert("プレイヤーは2人以上必要です！");
    return;
  }

  currentIndex = 0;
  previousVolume = 0;
  document.getElementById("setup").classList.add("hidden");
  document.getElementById("game").classList.remove("hidden");
  document.body.style.backgroundColor = "white";
  startMic();
}

function startMic() {
  navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      analyser = audioContext.createAnalyser();
      microphone = audioContext.createMediaStreamSource(stream);
      analyser.fftSize = 256;
      dataArray = new Uint8Array(analyser.frequencyBinCount);
      microphone.connect(analyser);
      update();
    });
}

function update() {
  analyser.getByteTimeDomainData(dataArray);
  drawWaveform(dataArray);

  let sum = 0;
  for (let i = 0; i < dataArray.length; i++) {
    const v = (dataArray[i] - 128) / 128;
    sum += v * v;
  }
  const volume = Math.sqrt(sum / dataArray.length);
  const volumeRounded = Math.round(volume * 100);

  document.getElementById("currentPlayerName").textContent = `${players[currentIndex]} の番！`;
  document.getElementById("currentVolume").textContent = volumeRounded;
  document.getElementById("volumeBar").style.width = `${volumeRounded}%`;

  // 音声が出ていない時間が続いたら「モッツァレラチーズ」終了と判断
  if (volumeRounded > 0) {
    clearTimeout(silenceTimeout);
    shoutButtonPressed = true;  // 発声している状態
  } else if (shoutButtonPressed) {
    silenceTimeout = setTimeout(() => {
      endTurn(volumeRounded);
    }, 500);  // 0.5秒無音でターン終了
  }

  animationId = requestAnimationFrame(update);
}

function drawWaveform(dataArray) {
  const canvas = document.getElementById("waveform");
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.lineWidth = 2;
  ctx.strokeStyle = "lime";
  ctx.beginPath();

  const sliceWidth = canvas.width * 1.0 / dataArray.length;
  let x = 0;

  for (let i = 0; i < dataArray.length; i++) {
    const v = dataArray[i] / 128.0;
    const y = v * canvas.height / 2;

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }

    x += sliceWidth;
  }

  ctx.lineTo(canvas.width, canvas.height / 2);
  ctx.stroke();
}

function endTurn(volume) {
  // 現在の音量を最大値として記録
  previousVolume = volume;
  document.body.style.backgroundColor = "#d4f5d4"; // 緑

  // 「次の人へ」ボタンを表示
  document.getElementById("shoutButton").classList.add("hidden");
  showNextButton();
}

function showNextButton() {
  const nextButton = document.createElement("button");
  nextButton.textContent = "次の人へ";
  nextButton.onclick = nextPlayer;
  document.getElementById("game").appendChild(nextButton);
}

function nextPlayer() {
  currentIndex = (currentIndex + 1) % players.length;
  document.getElementById("shoutButton").classList.remove("hidden");
  document.getElementById("game").querySelector("button:last-child").remove();  // 「次の人へ」ボタン削除
}

function addPlayer() {
  const nameInput = document.getElementById("playerName");
  const name = nameInput.value.trim();
  if (name) {
    players.push(name);
    updatePlayerList();
    nameInput.value = "";
  }
}

function updatePlayerList() {
  const list = document.getElementById("playerList");
  list.innerHTML = players.map(name => `<div>${name}</div>`).join("");
}

function resetGame() {
  players = [];
  currentIndex = 0;
  previousVolume = 0;
  document.getElementById("setup").classList.remove("hidden");
  document.getElementById("game").classList.add("hidden");
  document.getElementById("result").classList.add("hidden");
  updatePlayerList();
}
