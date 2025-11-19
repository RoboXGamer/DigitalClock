document.addEventListener("DOMContentLoaded", () => {
  const D = document;
  const docEl = D.documentElement;

  // --- State Management ---
  const state = {
    is24Hour: false,
    showSeconds: true,
    isDark: window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? true,
    currentMode: "clock", // clock, timer, stopwatch
    timer: {
      running: false,
      paused: false,
      duration: 0,
      remaining: 0,
      endTime: null,
    },
    stopwatch: {
      running: false,
      startTime: null,
      elapsed: 0,
      laps: [],
    },
    lastDateString: "",
  };

  // Load settings
  const savedState = JSON.parse(localStorage.getItem("clockSettings") || "{}");
  state.is24Hour = savedState.is24Hour ?? state.is24Hour;
  state.showSeconds = savedState.showSeconds ?? state.showSeconds;
  state.isDark = savedState.isDark ?? state.isDark;
  state.currentMode = savedState.currentMode ?? "clock";

  // --- Elements ---
  const ELS = {
    // Common
    modeBtns: D.querySelectorAll(".mode-btn"),
    views: D.querySelectorAll(".view"),
    settingsBtn: D.getElementById("settings-btn"),
    settingsPanel: D.getElementById("settings-panel"),

    // Clock
    clock: {
      h: D.querySelectorAll("#hours .digit-container"),
      m: D.querySelectorAll("#minutes .digit-container"),
      s: D.querySelectorAll("#seconds .digit-container"),
      ampm: D.querySelector("#ampm .ampm-container"),
      date: D.getElementById("date-display"),
      seconds: D.getElementById("seconds"),
      secondsSeparator: D.getElementById("seconds-separator"),
      ampmContainer: D.getElementById("ampm"),
    },

    // Timer
    timer: {
      view: D.getElementById("timer-view"),
      h: D.querySelectorAll("#timer-hours .digit-container"),
      m: D.querySelectorAll("#timer-minutes .digit-container"),
      s: D.querySelectorAll("#timer-seconds .digit-container"),
      inputs: {
        h: D.getElementById("input-h"),
        m: D.getElementById("input-m"),
        s: D.getElementById("input-s"),
      },
      startBtn: D.getElementById("timer-start-btn"),
      resetBtn: D.getElementById("timer-reset-btn"),
    },

    // Stopwatch
    stopwatch: {
      h: D.querySelectorAll("#sw-hours .digit-container"),
      m: D.querySelectorAll("#sw-minutes .digit-container"),
      s: D.querySelectorAll("#sw-seconds .digit-container"),
      ms: D.querySelectorAll("#sw-ms .digit-container"),
      hoursGroup: D.querySelector(".sw-hours-group"),
      hoursSep: D.querySelector(".sw-hours-sep"),
      msGroup: D.querySelector(".sw-ms-group"),
      msSep: D.querySelector(".sw-ms-sep"),
      startBtn: D.getElementById("sw-start-btn"),
      lapBtn: D.getElementById("sw-lap-btn"),
      resetBtn: D.getElementById("sw-reset-btn"),
      lapsList: D.getElementById("laps-list"),
    },
  };

  // Apply fast transition to milliseconds
  ELS.stopwatch.ms.forEach(el => el.classList.add("fast-ms"));

  // --- Helpers ---
  function saveState() {
    localStorage.setItem(
      "clockSettings",
      JSON.stringify({
        is24Hour: state.is24Hour,
        showSeconds: state.showSeconds,
        isDark: state.isDark,
        currentMode: state.currentMode,
      })
    );
  }

  function createDigitRollers(containers) {
    containers.forEach((container) => {
      if (container.querySelector(".digit-roller")) return;
      const roller = D.createElement("div");
      roller.className = "digit-roller";
      roller.innerHTML = Array.from(
        { length: 10 },
        (_, i) => `<div class="digit">${i}</div>`
      ).join("");
      container.appendChild(roller);
    });
  }

  function setDigit(elements, value) {
    const s = String(value).padStart(2, "0");
    if (elements[0] && elements[0].firstElementChild) {
      elements[0].firstElementChild.style.transform = `translateY(-${s[0] * 1.1}em)`;
    }
    if (elements[1] && elements[1].firstElementChild) {
      elements[1].firstElementChild.style.transform = `translateY(-${s[1] * 1.1}em)`;
    }
  }

  // --- Mode Switching ---
  function switchMode(mode) {
    state.currentMode = mode;

    // Update Buttons
    ELS.modeBtns.forEach(btn => {
      btn.classList.toggle("active", btn.dataset.mode === mode);
    });

    // Update Views
    ELS.views.forEach(view => {
      view.classList.remove("active");
      if (view.id === `${mode}-view`) {
        view.classList.add("active");
      }
    });

    saveState();
  }

  // --- Clock Logic ---
  function updateClock() {
    if (state.currentMode !== "clock") return;

    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();

    if (!state.is24Hour) {
      ELS.clock.ampm.textContent = hours >= 12 ? "PM" : "AM";
      hours = hours % 12 || 12;
    }

    setDigit(ELS.clock.h, hours);
    setDigit(ELS.clock.m, minutes);
    if (state.showSeconds) {
      setDigit(ELS.clock.s, seconds);
    }

    const currentDateString = now.toDateString();
    if (currentDateString !== state.lastDateString) {
      ELS.clock.date.textContent = now.toLocaleDateString(undefined, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      state.lastDateString = currentDateString;
    }
  }

  // --- Timer Logic ---
  let timerInterval;

  function updateTimerDisplay(totalSeconds) {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    setDigit(ELS.timer.h, h);
    setDigit(ELS.timer.m, m);
    setDigit(ELS.timer.s, s);
  }

  function startTimer() {
    if (state.timer.running) {
      // Pause
      clearInterval(timerInterval);
      state.timer.running = false;
      state.timer.paused = true;
      ELS.timer.startBtn.textContent = "Start";
      ELS.timer.startBtn.classList.remove("stop");
      ELS.timer.startBtn.classList.add("start");
      return;
    }

    // Start
    let duration = 0;
    if (state.timer.paused) {
      duration = state.timer.remaining;
    } else {
      const h = parseInt(ELS.timer.inputs.h.value) || 0;
      const m = parseInt(ELS.timer.inputs.m.value) || 0;
      const s = parseInt(ELS.timer.inputs.s.value) || 0;
      duration = h * 3600 + m * 60 + s;
    }

    if (duration <= 0) return;

    state.timer.running = true;
    state.timer.paused = false;
    state.timer.duration = duration;
    state.timer.remaining = duration;
    state.timer.endTime = Date.now() + duration * 1000;

    ELS.timer.view.classList.add("timer-running");
    ELS.timer.startBtn.textContent = "Pause";
    ELS.timer.startBtn.classList.remove("start");
    ELS.timer.startBtn.classList.add("stop");

    updateTimerDisplay(duration);

    timerInterval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.ceil((state.timer.endTime - now) / 1000);

      if (remaining <= 0) {
        clearInterval(timerInterval);
        state.timer.running = false;
        state.timer.remaining = 0;
        updateTimerDisplay(0);
        ELS.timer.view.classList.remove("timer-running");
        ELS.timer.startBtn.textContent = "Start";
        ELS.timer.startBtn.classList.remove("stop");
        ELS.timer.startBtn.classList.add("start");
        alert("Timer Finished!"); // Simple alert for now
        return;
      }

      state.timer.remaining = remaining;
      updateTimerDisplay(remaining);
    }, 100);
  }

  function resetTimer() {
    clearInterval(timerInterval);
    state.timer.running = false;
    state.timer.paused = false;
    state.timer.remaining = 0;
    ELS.timer.view.classList.remove("timer-running");
    ELS.timer.startBtn.textContent = "Start";
    ELS.timer.startBtn.classList.remove("stop");
    ELS.timer.startBtn.classList.add("start");
    updateTimerDisplay(0);
    ELS.timer.inputs.h.value = "";
    ELS.timer.inputs.m.value = "";
    ELS.timer.inputs.s.value = "";
  }

  // --- Stopwatch Logic ---
  let stopwatchInterval;

  function updateStopwatchDisplay(elapsed) {
    const totalSeconds = Math.floor(elapsed / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    const ms = Math.floor((elapsed % 1000) / 10);

    // Show hours section when >= 60 minutes (3600 seconds)
    const showHours = totalSeconds >= 3600;
    if (showHours) {
      ELS.stopwatch.hoursGroup.classList.add("show");
      ELS.stopwatch.hoursSep.classList.add("show");
      ELS.stopwatch.msGroup.classList.add("hide");
      ELS.stopwatch.msSep.classList.add("hide");
      setDigit(ELS.stopwatch.h, h);
    } else {
      ELS.stopwatch.hoursGroup.classList.remove("show");
      ELS.stopwatch.hoursSep.classList.remove("show");
      ELS.stopwatch.msGroup.classList.remove("hide");
      ELS.stopwatch.msSep.classList.remove("hide");
      setDigit(ELS.stopwatch.ms, ms);
    }

    setDigit(ELS.stopwatch.m, m);
    setDigit(ELS.stopwatch.s, s);
  }

  function startStopwatch() {
    if (state.stopwatch.running) {
      // Pause
      clearInterval(stopwatchInterval);
      state.stopwatch.running = false;
      ELS.stopwatch.startBtn.textContent = "Start";
      ELS.stopwatch.startBtn.classList.remove("stop");
      ELS.stopwatch.startBtn.classList.add("start");
      return;
    }

    // Start
    state.stopwatch.running = true;
    state.stopwatch.startTime = Date.now() - state.stopwatch.elapsed;
    ELS.stopwatch.startBtn.textContent = "Stop";
    ELS.stopwatch.startBtn.classList.remove("start");
    ELS.stopwatch.startBtn.classList.add("stop");

    stopwatchInterval = setInterval(() => {
      state.stopwatch.elapsed = Date.now() - state.stopwatch.startTime;
      updateStopwatchDisplay(state.stopwatch.elapsed);
    }, 10);
  }

  function resetStopwatch() {
    clearInterval(stopwatchInterval);
    state.stopwatch.running = false;
    state.stopwatch.elapsed = 0;
    state.stopwatch.laps = [];
    ELS.stopwatch.startBtn.textContent = "Start";
    ELS.stopwatch.startBtn.classList.remove("stop");
    ELS.stopwatch.startBtn.classList.add("start");
    updateStopwatchDisplay(0);
    renderLaps();
  }

  function lapStopwatch() {
    if (!state.stopwatch.running) return;
    const lapTime = state.stopwatch.elapsed;
    state.stopwatch.laps.unshift(lapTime);
    renderLaps();
  }

  function renderLaps() {
    ELS.stopwatch.lapsList.innerHTML = state.stopwatch.laps
      .map((lap, index) => {
        const totalSeconds = Math.floor(lap / 1000);
        const h = Math.floor(totalSeconds / 3600);
        const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
        const s = String(totalSeconds % 60).padStart(2, "0");
        const ms = String(Math.floor((lap % 1000) / 10)).padStart(2, "0");

        // Show hours in lap time if >= 1 hour
        const timeStr = h > 0
          ? `${String(h).padStart(2, "0")}:${m}:${s}.${ms}`
          : `${m}:${s}.${ms}`;

        return `<li class="lap-item">
            <span class="lap-number">#${state.stopwatch.laps.length - index}</span>
            <span>${timeStr}</span>
        </li>`;
      })
      .join("");
  }

  // --- UI State ---
  function applyUIState() {
    ELS.clock.seconds.style.display = state.showSeconds ? "contents" : "none";
    ELS.clock.secondsSeparator.style.display = state.showSeconds ? "block" : "none";
    ELS.clock.ampmContainer.style.display = state.is24Hour ? "none" : "flex";
    docEl.classList.toggle("dark", state.isDark);
  }

  // --- Event Listeners ---

  // Mode Switching
  ELS.modeBtns.forEach(btn => {
    btn.addEventListener("click", () => switchMode(btn.dataset.mode));
  });

  // Settings
  ELS.settingsBtn.addEventListener("click", () =>
    ELS.settingsPanel.classList.toggle("active")
  );

  D.addEventListener("click", (e) => {
    if (
      !ELS.settingsPanel.contains(e.target) &&
      !ELS.settingsBtn.contains(e.target)
    ) {
      ELS.settingsPanel.classList.remove("active");
    }
  });

  ELS.settingsPanel.addEventListener("change", (e) => {
    if (e.target.type !== "checkbox") return;
    const { id, checked } = e.target;
    switch (id) {
      case "theme-toggle":
        state.isDark = checked;
        break;
      case "format-toggle":
        state.is24Hour = checked;
        updateClock();
        break;
      case "seconds-toggle":
        state.showSeconds = checked;
        break;
      case "fullscreen-toggle":
        if (!D.fullscreenElement) {
          docEl.requestFullscreen().catch(() => (e.target.checked = false));
        } else {
          D.exitFullscreen();
        }
        return;
    }
    applyUIState();
    saveState();
  });

  // Timer Events
  ELS.timer.startBtn.addEventListener("click", startTimer);
  ELS.timer.resetBtn.addEventListener("click", resetTimer);

  // Stopwatch Events
  ELS.stopwatch.startBtn.addEventListener("click", startStopwatch);
  ELS.stopwatch.resetBtn.addEventListener("click", resetStopwatch);
  ELS.stopwatch.lapBtn.addEventListener("click", lapStopwatch);

  // --- Init ---
  D.getElementById("theme-toggle").checked = state.isDark;
  D.getElementById("format-toggle").checked = state.is24Hour;
  D.getElementById("seconds-toggle").checked = state.showSeconds;

  // Create rollers for all digit containers
  createDigitRollers(D.querySelectorAll(".digit-container"));

  applyUIState();
  switchMode(state.currentMode);
  updateClock();
  setInterval(updateClock, 1000);
});
