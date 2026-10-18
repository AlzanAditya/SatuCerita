// Pemutar musik latar (tombol piringan hitam di pojok kanan bawah). Pengaturan lagu ada di MUSIC (js/config.js).
(function () {
  var cfg = MUSIC;
  if (!cfg || !(cfg.videoId || cfg.audio)) return;

  var start = Math.max(0, Math.floor(cfg.start || 0));
  var end = Math.floor(cfg.end || 0);
  if (end && end <= start) end = 0;
  var FADE_MS = 3000;

  var button = document.createElement("button");
  button.type = "button";
  button.className = "ps-player";
  button.setAttribute("aria-pressed", "false");
  button.setAttribute("aria-label", cfg.labels.play);
  button.innerHTML =
    '<span class="ps-player__disc" aria-hidden="true"></span>' +
    '<span class="ps-player__arm" aria-hidden="true"></span>' +
    '<span class="ps-player__muted" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="m22 9-6 6M16 9l6 6"/></svg></span>';
  document.body.appendChild(button);

  var wantPlay = false;
  var playing = false;
  var resumeOnShow = false;
  var autoplayStarted = false;
  var userPaused = false;
  var retryArmed = false;
  var retryEvents = ["pointerup", "touchend", "keydown"];

  function render() {
    button.classList.toggle("is-playing", playing);
    button.setAttribute("aria-pressed", playing ? "true" : "false");
    button.setAttribute("aria-label", playing ? cfg.labels.pause : cfg.labels.play);
  }

  // Musik diblokir browser (mis. lagu baru siap setelah gesture kedaluwarsa): coba lagi
  // pada sentuhan berikutnya di mana saja, kecuali pengguna sendiri yang mematikannya.
  function retryOnGesture(event) {
    if (event.target instanceof Element && event.target.closest(".ps-player")) return;
    disarmRetry();
    if (wantPlay && !playing && !userPaused) play();
  }

  function armRetry() {
    if (retryArmed || userPaused) return;
    retryArmed = true;
    retryEvents.forEach(function (type) { document.addEventListener(type, retryOnGesture, true); });
  }

  function disarmRetry() {
    if (!retryArmed) return;
    retryArmed = false;
    retryEvents.forEach(function (type) { document.removeEventListener(type, retryOnGesture, true); });
  }

  // Dipanggil mesin pemutar saat musik benar-benar berbunyi.
  function onPlaying() {
    if (!wantPlay) {
      engine.stop();
      return;
    }
    // Lagu yang terlambat mulai (jaringan lambat / percobaan ulang) tetap diterima.
    disarmRetry();
    if (!playing) {
      playing = true;
      render();
    }
    engine.fadeIn();
  }

  // Dipanggil mesin pemutar saat browser menolak memutar (belum ada gesture).
  function onBlocked() {
    if (!wantPlay) return;
    playing = false;
    render();
    armRetry();
  }

  function onFail(message) {
    clearTimeout(verifyTimer);
    disarmRetry();
    engine.destroy();
    button.remove();
    if (cfg.diagnose) showError(message);
  }

  var verifyTimer = 0;

  function verify() {
    clearTimeout(verifyTimer);
    verifyTimer = setTimeout(function () {
      if (!engine.ready() || !wantPlay || document.hidden || engine.active()) return;
      // wantPlay tetap true: bila lagu ternyata hanya lambat dimuat, ia boleh mulai belakangan.
      onBlocked();
    }, 3500);
  }

  function play() {
    wantPlay = true;
    playing = true;
    render();
    if (engine.ready()) {
      engine.start();
      verify();
    }
  }

  function pause() {
    wantPlay = false;
    playing = false;
    disarmRetry();
    render();
    engine.stop();
    // Saat diputar lagi, musik masuk perlahan, bukan langsung keras.
    engine.silence();
  }

  // Mesin YouTube: volume diatur lewat API pemutar. Di iOS/HP volume ini diabaikan YouTube,
  // jadi lagu langsung berbunyi penuh; mesin audio di bawah tidak punya batasan itu.
  function youtubeEngine() {
    var holder = document.createElement("div");
    holder.className = "ps-player-yt";
    holder.setAttribute("aria-hidden", "true");
    var mount = document.createElement("div");
    holder.appendChild(mount);
    document.body.appendChild(holder);

    var player = null;
    var isReady = false;
    var volume = 0;
    var fadeTimer = 0;

    function create() {
      player = new YT.Player(mount, {
        width: 1,
        height: 1,
        videoId: cfg.videoId,
        host: "https://www.youtube-nocookie.com",
        playerVars: { autoplay: 0, controls: 0, disablekb: 1, fs: 0, playsinline: 1, rel: 0, start: start, end: end || undefined, origin: location.origin },
        events: {
          onReady: function () {
            isReady = true;
            player.setVolume(0);
            volume = 0;
            button.classList.add("is-ready");
            if (wantPlay) {
              player.playVideo();
              verify();
            }
          },
          onStateChange: function (event) {
            if (event.data === YT.PlayerState.PLAYING) onPlaying();
            if (event.data === YT.PlayerState.ENDED) {
              player.seekTo(start, true);
              if (wantPlay) player.playVideo();
            }
          },
          onError: function (event) {
            var code = event && event.data;
            var reason = code === 101 || code === 150 ? cfg.labels.errorEmbed : code === 100 ? cfg.labels.errorMissing : cfg.labels.errorOther;
            onFail(cfg.labels.error.replace("{code}", String(code)).replace("{reason}", reason));
          }
        }
      });
    }

    if (window.YT && window.YT.Player) {
      create();
    } else {
      var previous = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = function () {
        if (typeof previous === "function") previous();
        create();
      };
      var script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      document.head.appendChild(script);
    }

    return {
      openEvent: "pointerdown",
      ready: function () { return isReady; },
      active: function () {
        var state = player.getPlayerState();
        return state === YT.PlayerState.PLAYING || state === YT.PlayerState.BUFFERING;
      },
      start: function () { player.playVideo(); },
      stop: function () { if (isReady) player.pauseVideo(); },
      silence: function () {
        clearInterval(fadeTimer);
        fadeTimer = 0;
        volume = 0;
        if (isReady) player.setVolume(0);
      },
      fadeIn: function () {
        // PLAYING bisa terpanggil lagi (buffering, seek): fade yang sedang berjalan diteruskan.
        if (fadeTimer || !isReady || volume >= 100) return;
        var from = volume;
        var began = Date.now();
        // Telinga mendengar volume secara logaritmik: kurva kuadrat dengan langkah kecil
        // membuat musik masuk perlahan dan tidak bertangga.
        fadeTimer = setInterval(function () {
          var progress = Math.min(1, (Date.now() - began) / FADE_MS);
          var next = Math.round(from + (100 - from) * progress * progress);
          if (playing && next !== volume) {
            volume = next;
            player.setVolume(volume);
          }
          if (progress >= 1 || !playing) {
            clearInterval(fadeTimer);
            fadeTimer = 0;
          }
        }, 50);
      },
      destroy: function () {
        clearInterval(fadeTimer);
        holder.remove();
      }
    };
  }

  // Mesin file audio: <audio> dialirkan lewat Web Audio GainNode. iOS tidak mengizinkan
  // mengubah volume elemen media, tetapi gain Web Audio bisa, dan kurva fade dijadwalkan
  // di thread audio sehingga tetap mulus walau halaman sedang sibuk animasi.
  function audioEngine() {
    var audio = document.createElement("audio");
    audio.preload = cfg.autoplay ? "auto" : "metadata";
    audio.setAttribute("playsinline", "");
    audio.src = cfg.audio + (start ? "#t=" + start : "");

    var isIOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    var sameOrigin = new URL(cfg.audio, location.href).origin === location.origin;
    // Web Audio di iOS ikut dibisukan tombol senyap kecuali sesi audionya "playback" (iOS 17+).
    // Di iOS lama musik tetap diputar tanpa Web Audio agar tidak hilang, meski tanpa fade.
    var canUseGraph = Boolean(window.AudioContext || window.webkitAudioContext) && sameOrigin && (!isIOS || "audioSession" in navigator);
    var ctx = null;
    var gain = null;
    var graphTried = false;
    var fadeTimer = 0;
    var failed = false;
    var fadeEnds = 0;
    var loopFading = false;
    var LOOP_OUT = 1.2;
    var LOOP_IN = 1.5;

    // Jadwalkan kurva gain di thread audio. Naik: kuadrat (pelan lalu cepat); turun: kebalikannya.
    function ramp(to, seconds) {
      var now = ctx.currentTime;
      var from = gain.gain.value;
      var curve = new Float32Array(64);
      for (var i = 0; i < curve.length; i++) {
        var t = i / (curve.length - 1);
        curve[i] = to >= from ? from + (to - from) * t * t : to + (from - to) * (1 - t) * (1 - t);
      }
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(from, now);
      gain.gain.setValueCurveAtTime(curve, now, Math.max(seconds, 0.05));
      fadeEnds = now + seconds;
    }

    // Harus dipanggil di dalam gesture pengguna: AudioContext baru boleh berjalan setelah gesture.
    function ensureGraph() {
      if (graphTried) {
        if (ctx && ctx.state !== "running") ctx.resume().catch(function () {});
        return;
      }
      graphTried = true;
      if (!canUseGraph) return;
      try {
        if (navigator.audioSession) navigator.audioSession.type = "playback";
        var Context = window.AudioContext || window.webkitAudioContext;
        ctx = new Context();
        gain = ctx.createGain();
        gain.gain.value = 0;
        ctx.createMediaElementSource(audio).connect(gain);
        gain.connect(ctx.destination);
        if (ctx.state !== "running") ctx.resume().catch(function () {});
      } catch (error) {
        ctx = null;
        gain = null;
        quietElement();
      }
    }

    // Jalur tanpa Web Audio memudarkan volume elemen, jadi harus mulai dari senyap.
    function quietElement() {
      try { audio.volume = 0; } catch (error) {}
    }

    function rewind() {
      try {
        audio.currentTime = start;
      } catch (error) {}
    }

    audio.addEventListener("playing", onPlaying);
    // Potongan "berhenti di detik ke": pudar keluar sebelum titik akhir, lalu masuk lagi dari titik mulai.
    audio.addEventListener("timeupdate", function () {
      if (!end) return;
      var left = end - audio.currentTime;
      if (gain && playing && !loopFading && left > 0 && left <= LOOP_OUT) {
        loopFading = true;
        ramp(0, left);
      }
      if (left <= 0) {
        rewind();
        if (gain && loopFading && playing) ramp(1, LOOP_IN);
        loopFading = false;
      }
    });
    audio.addEventListener("ended", function () {
      rewind();
      if (wantPlay) audio.play().catch(onBlocked);
    });
    audio.addEventListener("error", function () {
      if (failed) return;
      failed = true;
      onFail(cfg.labels.errorAudio);
    });
    if (!canUseGraph) quietElement();
    button.classList.add("is-ready");

    return {
      openEvent: "click",
      ready: function () { return !failed; },
      active: function () { return !audio.paused && (!ctx || ctx.state === "running"); },
      start: function () {
        ensureGraph();
        if (audio.currentTime < start || (end && audio.currentTime >= end)) rewind();
        var attempt = audio.play();
        if (attempt && attempt.catch) attempt.catch(function (error) { if (!error || error.name !== "AbortError") onBlocked(); });
      },
      stop: function () { audio.pause(); },
      silence: function () {
        clearInterval(fadeTimer);
        fadeTimer = 0;
        fadeEnds = 0;
        loopFading = false;
        if (gain) {
          gain.gain.cancelScheduledValues(ctx.currentTime);
          gain.gain.setValueAtTime(0, ctx.currentTime);
        } else {
          quietElement();
        }
      },
      fadeIn: function () {
        if (gain) {
          // "playing" muncul lagi setelah seek/buffering: fade yang sedang berjalan diteruskan.
          if (ctx.currentTime < fadeEnds || gain.gain.value >= 1) return;
          ramp(1, FADE_MS / 1000);
          return;
        }
        if (fadeTimer) return;
        // Tanpa Web Audio (iOS lama / file beda domain): volume elemen, diabaikan iOS.
        var startVolume = audio.volume;
        var began = Date.now();
        fadeTimer = setInterval(function () {
          var progress = Math.min(1, (Date.now() - began) / FADE_MS);
          try { audio.volume = startVolume + (1 - startVolume) * progress * progress; } catch (error) {}
          if (progress >= 1 || !playing) {
            clearInterval(fadeTimer);
            fadeTimer = 0;
          }
        }, 50);
      },
      destroy: function () {
        clearInterval(fadeTimer);
        audio.pause();
        audio.removeAttribute("src");
        if (ctx) ctx.close().catch(function () {});
      }
    };
  }

  var engine = cfg.audio ? audioEngine() : youtubeEngine();

  button.addEventListener("click", function (event) {
    event.stopPropagation();
    userPaused = playing;
    if (playing) pause(); else play();
  });

  // Mulai musik pada gesture tombol pembuka undangan, sebelum animasinya berjalan. File audio
  // menunggu "click" karena pointerdown dari sentuhan belum dihitung gesture untuk memutar suara.
  if (cfg.autoplay && (cfg.demo || !cfg.preview)) {
    var onOpenGesture = function (event) {
      if (autoplayStarted || !(event.target instanceof Element) || !event.target.closest("[data-invitation-open]")) return;
      autoplayStarted = true;
      play();
    };
    document.addEventListener(engine.openEvent, onOpenGesture, true);
    document.addEventListener("keydown", function (event) {
      if ((event.key === "Enter" || event.key === " ") && event.target instanceof Element && event.target.closest("[data-invitation-open]")) {
        onOpenGesture(event);
      }
    }, true);
  }

  document.addEventListener("visibilitychange", function () {
    if (document.hidden && playing) {
      resumeOnShow = true;
      engine.stop();
      engine.silence();
    } else if (!document.hidden && resumeOnShow) {
      resumeOnShow = false;
      if (playing && engine.ready()) {
        engine.start();
        verify();
      }
    }
  });

  // Hanya untuk admin: jelaskan kenapa lagu tidak muncul alih-alih pemutar hilang tanpa kabar.
  function showError(message) {
    var note = document.createElement("div");
    note.setAttribute("role", "alert");
    note.style.cssText = "position:fixed;left:50%;bottom:20px;z-index:2147483647;transform:translateX(-50%);width:min(92vw,420px);padding:12px 16px;border-radius:12px;background:#1b1a19;color:#fff;font:500 13px/1.45 system-ui,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.35)";
    note.textContent = message;
    document.body.appendChild(note);
    setTimeout(function () { note.remove(); }, 12000);
  }

  window.PluvioMusic = { play: play, pause: pause, isPlaying: function () { return playing; } };
})();
