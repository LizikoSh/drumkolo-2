const menuToggle = document.querySelector(".menu-toggle");
const mainMenu = document.querySelector("#main-menu");

if (menuToggle && mainMenu) {
  menuToggle.addEventListener("click", () => {
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!isOpen));
    mainMenu.classList.toggle("is-open");
  });

  mainMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      mainMenu.classList.remove("is-open");
      menuToggle.setAttribute("aria-expanded", "false");
    });
  });
}

const tracks = [
  { id: "bass", label: "Бас", sound: "bass" },
  { id: "tone", label: "Тон", sound: "tone" },
  { id: "slap", label: "Слеп", sound: "slap" },
  { id: "shaker", label: "Шейкер", sound: "shaker" }
];

const presets = {
  circle: {
    bass: [0, 4],
    tone: [2, 6],
    slap: [3, 7],
    shaker: [0, 2, 4, 6]
  },
  dance: {
    bass: [0, 3, 4],
    tone: [2, 6],
    slap: [1, 5, 7],
    shaker: [0, 1, 2, 3, 4, 5, 6, 7]
  },
  dialogue: {
    bass: [0, 4],
    tone: [2, 3, 6],
    slap: [1, 5, 7],
    shaker: [0, 2, 4, 6]
  },
  clear: { bass: [], tone: [], slap: [], shaker: [] }
};

let audioContext;

function getAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
}

function playSound(type, volume = 0.45, when = 0) {
  const context = getAudioContext();
  const start = context.currentTime + when;
  const gain = context.createGain();
  gain.connect(context.destination);

  if (type === "bass") {
    const oscillator = context.createOscillator();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(125, start);
    oscillator.frequency.exponentialRampToValueAtTime(55, start + 0.16);
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.22);
    oscillator.connect(gain);
    oscillator.start(start);
    oscillator.stop(start + 0.23);
  } else if (type === "tone") {
    const oscillator = context.createOscillator();
    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(230, start);
    gain.gain.setValueAtTime(volume * 0.55, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.09);
    oscillator.connect(gain);
    oscillator.start(start);
    oscillator.stop(start + 0.1);
  } else {
    const buffer = context.createBuffer(1, context.sampleRate * 0.08, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) {
      data[i] = Math.random() * 2 - 1;
    }
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    filter.type = type === "slap" ? "bandpass" : "highpass";
    filter.frequency.value = type === "slap" ? 1600 : 4200;
    gain.gain.setValueAtTime(volume * (type === "slap" ? 0.45 : 0.18), start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.07);
    source.buffer = buffer;
    source.connect(filter).connect(gain);
    source.start(start);
  }
}

const sequencer = document.querySelector("#sequencer");

if (sequencer) {
  tracks.forEach((track) => {
    const row = document.createElement("div");
    row.className = "seq-row";
    row.innerHTML = `<div class="seq-label">${track.label}</div>`;

    for (let step = 0; step < 8; step += 1) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "seq-step";
      button.dataset.track = track.id;
      button.dataset.step = step;
      button.setAttribute("aria-label", `${track.label}, крок ${step + 1}`);
      button.setAttribute("aria-pressed", "false");
      button.addEventListener("click", () => {
        const active = button.classList.toggle("is-active");
        button.setAttribute("aria-pressed", String(active));
        playSound(track.sound, 0.6);
      });
      row.append(button);
    }
    sequencer.append(row);
  });

  let rhythmTimer;
  let currentStep = 0;
  let isPlaying = false;
  const playButton = document.querySelector("#play-rhythm");
  const tempo = document.querySelector("#tempo");
  const tempoValue = document.querySelector("#tempo-value");

  function applyPreset(name) {
    const preset = presets[name];
    document.querySelectorAll(".seq-step").forEach((button) => {
      const active = preset[button.dataset.track].includes(Number(button.dataset.step));
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  function tick() {
    document.querySelectorAll(".seq-step").forEach((button) => {
      button.classList.toggle("is-current", Number(button.dataset.step) === currentStep);
      if (Number(button.dataset.step) === currentStep && button.classList.contains("is-active")) {
        const track = tracks.find((item) => item.id === button.dataset.track);
        playSound(track.sound);
      }
    });
    currentStep = (currentStep + 1) % 8;
  }

  function stopRhythm() {
    window.clearInterval(rhythmTimer);
    isPlaying = false;
    currentStep = 0;
    document.querySelectorAll(".seq-step").forEach((button) => button.classList.remove("is-current"));
    playButton.innerHTML = '<span aria-hidden="true">▶</span> Грати';
  }

  function startRhythm() {
    const bpm = Number(tempo.value);
    tick();
    rhythmTimer = window.setInterval(tick, (60000 / bpm) / 2);
    isPlaying = true;
    playButton.innerHTML = '<span aria-hidden="true">■</span> Стоп';
  }

  playButton.addEventListener("click", () => {
    if (isPlaying) stopRhythm();
    else startRhythm();
  });

  tempo.addEventListener("input", (event) => {
    tempoValue.textContent = `${event.target.value} BPM`;
    if (isPlaying) {
      stopRhythm();
      startRhythm();
    }
  });

  document.querySelectorAll("[data-preset]").forEach((button) => {
    button.addEventListener("click", () => applyPreset(button.dataset.preset));
  });

  applyPreset("circle");
}

let previewTimer;

document.querySelectorAll(".audio-play").forEach((button) => {
  button.addEventListener("click", () => {
    window.clearInterval(previewTimer);
    document.querySelectorAll(".audio-play").forEach((item) => {
      item.classList.remove("is-playing");
      item.textContent = "▶ Послухати";
    });

    const pattern = presets[button.dataset.audioPattern];
    let step = 0;
    button.classList.add("is-playing");
    button.textContent = "■ Звучить…";

    const playPreviewStep = () => {
      tracks.forEach((track) => {
        if (pattern[track.id].includes(step)) playSound(track.sound, 0.5);
      });
      step += 1;
      if (step >= 8) {
        window.clearInterval(previewTimer);
        button.classList.remove("is-playing");
        button.textContent = "▶ Послухати ще";
      }
    };

    playPreviewStep();
    previewTimer = window.setInterval(playPreviewStep, 260);
  });
});

const regionData = {
  "west-africa": {
    title: "Західна Африка",
    text: "Поліритмія тут народжується з кількох взаємопов’язаних партій. Джембе часто веде діалог, а басові дунуни тримають опору.",
    listen: "ансамблеву гру",
    try: "питання — відповідь"
  },
  "middle-east": {
    title: "Близький Схід",
    text: "Ритмічні цикли впізнаються за чергуванням низького «дум» і високого «тек». Вони тісно пов’язані з танцем і мелодією.",
    listen: "макам і перкусійний таксим",
    try: "дум — тек — пауза — тек"
  },
  mediterranean: {
    title: "Середземномор’я",
    text: "Рамкові барабани поєднують глибокий тон мембрани з дрібним дзвоном. Ритм може бути і танцювальним, і медитативним.",
    listen: "ансамблі рамкових барабанів",
    try: "удар, дріб і тиша"
  },
  latin: {
    title: "Латинська Америка",
    text: "Конґи й кахон утворюють пружну основу, де кожна партія має власний малюнок, але разом вони підсилюють рух.",
    listen: "афро-кубинську перкусію",
    try: "синкопований бас"
  },
  "south-asia": {
    title: "Південна Азія",
    text: "Ритм організований у цикли, а удари мають складову мову. Табла дозволяє буквально промовляти композицію ритмічними складами.",
    listen: "сольну гру на таблі",
    try: "повторювати ритм голосом"
  }
};

document.querySelectorAll(".map-point").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".map-point").forEach((item) => item.classList.remove("is-active"));
    button.classList.add("is-active");
    const region = regionData[button.dataset.region];
    const regionCard = document.querySelector("#region-card");
    regionCard.innerHTML = `
      <span class="region-label">Обраний регіон</span>
      <h3>${region.title}</h3>
      <p>${region.text}</p>
      <div class="region-meta">
        <span>Слухати: ${region.listen}</span>
        <span>Спробувати: ${region.try}</span>
      </div>
    `;
  });
});

const joinForm = document.querySelector("#join-form");

if (joinForm) {
  joinForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const button = event.currentTarget.querySelector("button");
    button.textContent = "Дякуємо, до зустрічі";
    button.disabled = true;
  });
}
