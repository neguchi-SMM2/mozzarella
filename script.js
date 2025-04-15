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
  navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    microphone = audioContext.createMediaStreamSource(stream);
    analyser.fftSize = 256;
    dataArray = new Uint8Array(analyser.frequencyBinCount);
    microphone.connect(analyser);
    updateAudio();
  });
}

function stopMic() {
  if (microphone) microphone.disconnect();
  if (analyser) analyser.disconnect();
  if (audioContext) audioContext.close();
  cancelAnimationFrame(animationId);
}

function updateAudio() {
  analyser.getByteTimeDomainData(dataArray);
  drawWaveform(dataArray);

  let sum = 0;
  for (let i = 0; i < dataArray.length; i++) {
    const v = (dataArray[i] - 128) / 128;
    sum += v * v;
  }
  const volume = Math.round(Math.sqrt(sum / dataArray.length) * 100);
  document.getElementById("currentVolume").textContent = volume;
  document.getElementById("volumeBar").style.width = `${volume}%`;

  if (volume > maxVolume) maxVolume = volume;

  if (volume > 5) {
    clearTimeout(silenceTimeout);
  } else {
    if (!silenceTimeout) {
      silenceTimeout = setTimeout(() => {
        endTurnFinal();
      }, 600); // 無音が0.6秒続いたら終了
    }
  }

  animationId = requestAnimationFrame(updateAudio);
}

function endTurnFinal() {
  stopMic();
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
