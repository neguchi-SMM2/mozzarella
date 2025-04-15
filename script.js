let players = [];
let currentIndex = 0;
let previousVolume = 0;
let audioContext, analyser, microphone, dataArray;
let animationId;
let maxVolume = 0;
let silenceTimeout = null;

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
  updatePlayerName();
}

function updatePlayerName() {
  document.getElementById("currentPlayerName").textContent = `${players[currentIndex]} の番！`;
  document.getElementById("currentVolume").textContent = "0";
  document.getElementById("volumeBar").style.width = "0%";
}

function startTurn() {
  maxVolume = 0;
  startMic();
}

function startMic() {
  // マイクストリームを取得
  navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {
      // Web Audio APIを使用してマイクのストリームを処理
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      analyser = audioContext.createAnalyser();
      microphone = audioContext.createMediaStreamSource(stream);
      analyser.fftSize = 256; // 周波数解析の精度
      dataArray = new Uint8Array(analyser.frequencyBinCount); // バイトデータの配列
      microphone.connect(analyser);

      // 波形を更新
      updateAudio();
    })
    .catch(err => {
      console.error("マイクのアクセスに失敗しました:", err);
      alert(`マイクのアクセスに失敗しました。エラー: ${err.name}\n${err.message}`);
    });
}

function stopMic() {
  if (microphone) microphone.disconnect();
  if (analyser) analyser.disconnect();
  if (audioContext) audioContext.close();
  cancelAnimationFrame(animationId);
}

function updateAudio() {
  analyser.getByteTimeDomainData(dataArray); // データを取得
  drawWaveform(dataArray); // 波形描画

  let sum = 0;
  for (let i = 0; i < dataArray.length; i++) {
    const v = (dataArray[i] - 128) / 128;
    sum += v * v;
  }
  const volume = Math.round(Math.sqrt(sum / dataArray.length) * 100);
  document.getElementById("currentVolume").textContent = volume;
  document.getElementById("volumeBar").style.width = `${volume}%`;

  if (volume > maxVolume) maxVolume = volume;

  // 無音が続いたら終了
  if (volume > 5) {
    clearTimeout(silenceTimeout);
  } else {
    if (!silenceTimeout) {
      silenceTimeout = setTimeout(() => {
        endTurnFinal();
      }, 500); // 0.5秒無音で終了
    }
  }

  animationId = requestAnimationFrame(updateAudio); // ループ
}

function drawWaveform(dataArray) {
  const canvas = document.getElementById("waveform");
  const ctx = canvas.getContext("2d");

  // 波形を描画する前にクリア
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const width = canvas.width;
  const height = canvas.height;
  const step = Math.ceil(dataArray.length / width); // 横に何ピクセルごとにデータを取るか

  ctx.beginPath();
  for (let i = 0; i < width; i++) {
    const x = i;
    const y = (dataArray[i * step] / 128) * height / 2 + height / 2;
    ctx.lineTo(x, y);
  }
  ctx.lineWidth = 2;
  ctx.strokeStyle = "white";
  ctx.stroke();
}

function endTurnFinal() {
  stopMic(); // 音声監視を終了
  silenceTimeout = null;

  // 背景色で結果表示
  if (maxVolume < previousVolume) {
    document.body.style.backgroundColor = "#f8d0d0"; // 赤：負け
  } else {
    document.body.style.backgroundColor = "#d4f5d4"; // 緑：セーフ
  }

  previousVolume = maxVolume;

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

  const nextButton = document.querySelector("#game button:last-child");
  if (nextButton && nextButton.textContent === "次の人へ") {
    nextButton.remove();
  }

  document.body.style.backgroundColor = "white";
  updatePlayerName();
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
