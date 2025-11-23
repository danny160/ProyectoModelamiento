window.addEventListener('DOMContentLoaded',function (event) {
  const ROL_CHATBOT = {
    USER: "USER",
    BOT: "BOT",
  };
  const buttonOpenChat = this.document.querySelector(".buttonOpenChat");
  const chat = this.document.querySelector(".chat");
  const display = chat.querySelector(".display");
  const chatButtonSend = chat.querySelector("#chatButtonSend");
  const inputChatUser = chat.querySelector("#inputChatUser");
  const buttonClosedChat = chat.querySelector(".closed-chat");
  const clearDisplay = this.document.querySelector("#clearDisplay");
  // elemento para mostrar la advertencia POR FUERA de las burbujas de mensaje
  let globalWarningEl = chat.querySelector(".global-warning");
  if (!globalWarningEl) {
    globalWarningEl = document.createElement("div");
    globalWarningEl.className = "global-warning";
    // lo insertamos entre .display y .chat-input (fuera de las burbujas)
    const chatInput = chat.querySelector(".chat-input");
    chat.insertBefore(globalWarningEl, chatInput);
  }
  let idTimeout = null;

  //Desabilita los inputs
  function disableButtonAndInput(isActive) {
    chatButtonSend.disabled = isActive;
    inputChatUser.readOnly = isActive;
    inputChatUser.focus();
  }

  function formatBotReply2(text) {
    // Primero detectamos bloques tipo **Titulo:** contenido
    let formatted = text
      .replace(/\n/g, "<br>") // Saltos de línea
      .replace(/(\*\*|__)(.*?)\1/g, "<strong>$2</strong>") // Negrita
      .replace(/(\*|_)(.*?)\1/g, "<em>$2</em>") // Cursiva
      .replace(/`(.*?)`/g, "<code>$1</code>") // Código en línea
      .replace(/```([\s\S]*?)```/g, "<pre><code>$1</code></pre>"); // Bloques de código

    // Detectar puntos tipo "Palabra: texto" y volverlos <li>
    formatted = formatted.replace(
      /(?:<br>)?\s*(<strong>.*?:<\/strong>.*?)<br>?/g,
      "<li>$1</li>"
    );

    // Si hay <li>, los envolvemos en <ul>
    if (formatted.includes("<li>")) {
      formatted = formatted.replace(/(<li>[\s\S]*<\/li>)/g, "<ul>$1</ul>");
    }

    return formatted;
  }

  // Función para formatear el texto con bloques de código
  function formatBotReply(text) {
    // Reemplazar bloques de código
    let formattedMessage = text;

    // Buscar bloques de código con triple backtick
    const codeBlockRegex = /```(\w+)?\s*([\s\S]*?)```/g;
    formattedMessage = formattedMessage.replace(
      codeBlockRegex,
      (match, language, code) => {
        console.log("Bloque de código encontrado:", {
          language,
          code: code.trim(),
        });

        // Crear un contenedor para el bloque de código con estilo
        const langDisplay = language
          ? `<div class="code-language">${language}</div>`
          : "";
        return `
      <div class="code-block-container">
        ${langDisplay}
        <pre class="code-block"><code>${escapeHtml(code.trim())}</code></pre>
      </div>
    `;
      }
    );

    // Formatear texto en negrita
    formattedMessage = formattedMessage.replace(
      /\*\*(.*?)\*\*/g,
      "<strong>$1</strong>"
    );

    // Convertir saltos de línea en <br>
    formattedMessage = formattedMessage.replace(/\n/g, "<br>");

    return formattedMessage;
  }

    // --- Reproducción de audio al responder el BOT ---
  function playBotAudio() {
    const audio = new Audio("chabox/audio/bot-response.mp3");
    audio.volume = 1; // volumen suave
    audio.play().catch(e => console.warn("Audio bloqueado por el navegador:", e));
  }
  //Muestra el mensaje depemdiendo del rol
  function displayMessage(rol, message, isHtml = false) {
    const box = document.createElement("div");
    clearTimeout(idTimeout);
    box.classList.add("message");

    // Helper: escribe HTML respetando las etiquetas, tipeando solo el texto interno carácter a carácter
    function typeHtmlTyping(container, html, speed, onComplete) {
      const temp = document.createElement("div");
      temp.innerHTML = html;

      const textNodes = [];

      function cloneStructure(node) {
        if (node.nodeType === Node.TEXT_NODE) {
          const t = document.createTextNode("");
          textNodes.push({ node: t, text: node.textContent });
          return t;
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const el = document.createElement(node.tagName.toLowerCase());
          // copiar atributos
          for (let i = 0; i < node.attributes.length; i++) {
            const attr = node.attributes[i];
            el.setAttribute(attr.name, attr.value);
          }
          for (let child of node.childNodes) {
            el.appendChild(cloneStructure(child));
          }
          return el;
        } else {
          return document.createTextNode("");
        }
      }

      // Limpiar contenedor y clonar la estructura con nodos de texto vacíos
      container.innerHTML = "";
      for (let child of Array.from(temp.childNodes)) {
        container.appendChild(cloneStructure(child));
      }

      if (textNodes.length === 0) {
        // No hay texto para tipear
        onComplete && onComplete();
        return;
      }

      // Escribir carácter por carácter en cada textNode en orden
      let nodeIndex = 0;
      let charIndex = 0;

      function step() {
        const entry = textNodes[nodeIndex];
        if (!entry) {
          onComplete && onComplete();
          return;
        }
        if (charIndex < entry.text.length) {
          entry.node.textContent += entry.text.charAt(charIndex);
          charIndex++;
          display.scrollTop = display.scrollHeight;
          setTimeout(step, speed);
        } else {
          nodeIndex++;
          charIndex = 0;
          step();
        }
      }

      step();
    }

    // Extrae y elimina SUGERENCIA y ADVERTENCIA si vienen al final (soporta HTML)
    function splitSuggestionAndWarning(rawText, rawHtml = null) {
      let suggestion = null;
      let warning = null;
      let body = rawText || "";
      let cleanedHtml = null;

      if (rawHtml) {
        const tmp = document.createElement("div");
        tmp.innerHTML = rawHtml;

        // Examinar hijos desde el final y eliminar nodos que sean sugerencia/advertencia
        const nodes = Array.from(tmp.childNodes);
        for (let i = nodes.length - 1; i >= 0; i--) {
          const node = nodes[i];
          const txt = (node.textContent || "").trim();
          if (!txt) {
            tmp.removeChild(node);
            continue;
          }
          if (!warning && (/recuerda:/i.test(txt) || /no se hace responsable/i.test(txt))) {
            warning = txt;
            tmp.removeChild(node);
            continue;
          }
          if (!suggestion && (/^sugerencia:/i.test(txt) || /^¿te/i.test(txt) || /^\?/i.test(txt))) {
            suggestion = txt;
            tmp.removeChild(node);
            continue;
          }
          // si encontramos contenido no relacionado, dejamos el resto
          break;
        }

        cleanedHtml = tmp.innerHTML;
        body = tmp.textContent ? tmp.textContent.trim() : "";
      } else {
        // Texto plano: separar por líneas y buscar desde el final
        const parts = (rawText || "")
          .split(/\r?\n|<br\s*\/?>/i)
          .map((s) => s.trim())
          .filter(Boolean);

        for (let i = parts.length - 1; i >= 0; i--) {
          const p = parts[i];
          if (!warning && (/recuerda:/i.test(p) || /no se hace responsable/i.test(p))) {
            warning = p;
            parts.splice(i, 1);
            continue;
          }
          if (!suggestion && (/^sugerencia:/i.test(p) || /^¿te/i.test(p) || /^\?/i.test(p))) {
            suggestion = p;
            parts.splice(i, 1);
            continue;
          }
          // si es un párrafo normal, dejamos el resto
          break;
        }
        body = parts.join("\n\n");
      }

      return { body, suggestion, warning, cleanedHtml };
    }

    if (rol === ROL_CHATBOT.USER) {
      box.classList.add("user");
      box.innerHTML = `<p>${message}</p>`;
      display.append(box);
      display.scrollTop = display.scrollHeight;
      inputChatUser.value = "";
      return;
    }

    if (rol === ROL_CHATBOT.BOT) {
      // Construimos la estructura de la burbuja según si es HTML o texto plano
      if (isHtml) {
        box.innerHTML = `
          <img src="chabox/img/BOT2.png" width="35px" alt="">
          <div class="result">
              <div class="html"></div>
              <button class="play-audio">🔊</button>
          </div>
        `;
      } else {
        box.innerHTML = `
          <img src="chabox/img/BOT2.png" width="35px" alt="">
          <div class="result">
              <p></p>
              <button class="play-audio">🔊</button>
          </div>
        `;
      }

      display.append(box);
      display.scrollTop = display.scrollHeight;

      let currentUtterance = null; 
      let isSpeaking = false;

      const playButton = box.querySelector(".play-audio");
      playButton.addEventListener("click", () => {
        const text =
            (box.querySelector(".result .html")?.innerText ||
            box.querySelector(".result p")?.innerText ||
            "").trim();

        if (!text) return;

        // Si ya está hablando → detener
        if (isSpeaking && currentUtterance) {
            window.speechSynthesis.cancel();
            isSpeaking = false;
            playButton.innerHTML = "🔊"; // ícono normal
            return;
        }

        // Si NO está hablando → iniciar desde cero
        window.speechSynthesis.cancel();
        
        const utter = new SpeechSynthesisUtterance(text);
        const v = chooseVoice ? chooseVoice("es") : null;
        if (v) utter.voice = v;
        utter.lang = (v && v.lang) ? v.lang : "es-ES";
        utter.rate = 1.5;
        utter.pitch = 0.8

        // Guardar referencia actual
        currentUtterance = utter;
        isSpeaking = true;
        playButton.innerHTML = "⏹️"; // ícono de stop

        utter.onend = () => {
            isSpeaking = false;
            playButton.innerHTML = "🔊"; // regresar icono
        };

        window.speechSynthesis.speak(utter);
    });


      const typingSpeed = 40; // ms por carácter
      disableButtonAndInput(true); // Deshabilitar inputs mientras escribe

      // Separar partes (si el modelo añadió la sugerencia y la advertencia al final)
      const split = splitSuggestionAndWarning(message, isHtml ? message : null);
      const resultContainer = box.querySelector(".result");

      if (isHtml) {
        // Usar el HTML ya limpiado para tipear (evita duplicados)
        const htmlToType = split.cleanedHtml !== null ? split.cleanedHtml : message;
        const htmlContainer = box.querySelector(".result .html");
        typeHtmlTyping(htmlContainer, htmlToType, typingSpeed, () => {
          // Añadir sugerencia (texto plano separado) dentro del mismo contenedor .result
          if (split.suggestion) {
            const s = document.createElement("p");
            s.className = "bot-suggestion";
            s.textContent = split.suggestion;
            resultContainer.appendChild(s);
          }
          // Añadir advertencia en cursiva y tamaño pequeño dentro del mismo contenedor .result
          if (split.warning) {
            const w = document.createElement("div");
            w.className = "bot-warning";
            w.textContent = split.warning;
            resultContainer.appendChild(w);
          }
          playBotAudio();
          disableButtonAndInput(false);
        });
      } else {
        // Texto plano: escribir carácter por carácter en el <p>
        const p = box.querySelector(".result p");
        let i = 0;
        const bodyText = split.body || message;
        function typeWriterPlain() {
          if (i < bodyText.length) {
            p.textContent += bodyText.charAt(i);
            i++;
            display.scrollTop = display.scrollHeight;
            setTimeout(typeWriterPlain, typingSpeed);
          } else {
            // Después del cuerpo, añadir sugerencia y advertencia como elementos dentro de .result (si existen)
            if (split.suggestion) {
              const s = document.createElement("p");
              s.className = "bot-suggestion";
              s.textContent = split.suggestion;
              resultContainer.appendChild(s);
            }
            if (split.warning) {
              const w = document.createElement("div");
              w.className = "bot-warning";
              w.textContent = split.warning;
              resultContainer.appendChild(w);
            }
            typeWriterPlain();
            disableButtonAndInput(false);
          }
        }
        typeWriterPlain();
      }

      inputChatUser.value = "";
    }
  }

  function closedChat(e) {
    chat.classList.toggle("open");
  }

  // ...existing code...
  //Envia el mensaje a gemini
  const sendMessageGemini = async (e) => {
    // Evitar envíos concurrentes si ya está deshabilitado
    if (chatButtonSend.disabled || inputChatUser.readOnly) return;

    const typing = this.document.querySelector(".typing");
    const message = inputChatUser.value;

    // Validar contenido antes de deshabilitar
    if (!message.trim()) {
      inputChatUser.focus();
      return;
    }

    // Ahora sí bloquear inputs y mostrar typing
    disableButtonAndInput(true);
    typing.style.display = "flex";

    // Mostrar mensaje del usuario en la UI y en el historial
    displayMessage(ROL_CHATBOT.USER, message);
    HISTORY_MESSAGE.push({
      role: "user",
      parts: [{ text: message }],
    });

    try {
      const response = await this.fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: HISTORY_MESSAGE,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        typing.style.display = "none";
        disableButtonAndInput(false);
        displayMessage(ROL_CHATBOT.BOT, errorText);
        return;
      }

      const data = await response.json();
      const botReply =
        data?.candidates?.[0]?.content?.parts?.[0].text || "Sin respuesta";
      typing.style.display = "none";

      // Mostrar respuesta formateada (isHtml = true)
      displayMessage(ROL_CHATBOT.BOT, formatBotReply(botReply), true);

      // Agregar al historial la respuesta cruda
      HISTORY_MESSAGE.push({
        role: "model",
        parts: [{ text: botReply }],
      });
      // Nota: la re-habilitación de inputs la hace displayMessage cuando termina el tipeo
    } catch (error) {
      console.error(error);
      typing.style.display = "none";
      disableButtonAndInput(false);
    } finally {
      inputChatUser.value = "";
    }
  };
 // ...existing code...

 async function playAudioFromText(text) {
  if (!text) return;
  const cleaned = String(text).replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
  if (!cleaned) return;

  // 1) Preferir Web Speech API (funciona sin red)
  if (window.speechSynthesis) {
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(cleaned);
      // elegir voz si ya cargaste voices
      const v = chooseVoice ? chooseVoice("es") : null;
      if (v) u.voice = v;
      u.lang = (v && v.lang) ? v.lang : "es-ES";
      u.rate = 1;
      u.pitch = 1;
      window.speechSynthesis.speak(u);
      return;
    } catch (e) {
      console.warn("Web Speech API error, fallback a Cloud TTS:", e);
      // continuar al fallback HTTP
    }
  }

  // 2) Fallback: Google Cloud Text-to-Speech REST (requiere habilitar API y puede tener CORS)
  if (typeof API_KEY === "undefined" || !API_KEY) {
    console.warn("No API_KEY para Cloud TTS");
    return;
  }

  try {
    const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${API_KEY}`;
    const body = {
      input: { text: cleaned },
      // ajustar voice.languageCode / name según disponibilidad
      voice: { languageCode: "es-ES", ssmlGender: "NEUTRAL" },
      audioConfig: { audioEncoding: "MP3" }
    };
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const txt = await res.text();
      console.warn("Cloud TTS error", res.status, txt);
      return;
    }

    const json = await res.json();
    if (!json.audioContent) {
      console.warn("No se recibió audio");
      return;
    }

    // Reproducir base64 mp3
    const audioSrc = "data:audio/mp3;base64," + json.audioContent;
    const audio = new Audio(audioSrc);
    audio.play().catch((err) => {
      console.warn("Error al reproducir audio:", err);
    });
  } catch (err) {
    console.warn("playAudioFromText error:", err);
  }
}


  chatButtonSend.addEventListener("click", sendMessageGemini);
  inputChatUser.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      sendMessageGemini(e);
      display.scrollTop = display.scrollHeight;
    }
  });
  buttonOpenChat.addEventListener("click", closedChat);
  buttonClosedChat.addEventListener("click", closedChat);
  clearDisplay.addEventListener("click", function () {
    display.innerHTML = `
            <div class="message">
                <img src="chabox/img/BOT2.png" width="35px" alt="">
                <div class="result"><p>¡Hola! Soy OptiWatt, tu asistente en eficiencia energética. <br> <br>¿En qué te puedo ayudar el día de hoy?</p></div>
            </div>
        `;
    HISTORY_MESSAGE = [
      {
        role: "user",
        parts: [{ text: PROMPT }],
      },
      {
        role: "model",
        parts: [{ text: "Hola, ¿En qué te puedo ayudar el día de hoy?" }],
      },
    ];
  });
})
  // Cached voices + estado de carga
  let availableVoices = [];
  let voicesReady = false;
  let voicesReadyPromise = null;

  function loadVoicesOnce() {
    if (!window.speechSynthesis) return Promise.resolve();
    if (voicesReady) return Promise.resolve();
    if (voicesReadyPromise) return voicesReadyPromise;

    voicesReadyPromise = new Promise((resolve) => {
      function tryLoad() {
        availableVoices = window.speechSynthesis.getVoices() || [];
        if (availableVoices.length) {
          voicesReady = true;
          resolve();
        }
      }
      tryLoad();
      // onvoiceschanged puede dispararse después
      window.speechSynthesis.onvoiceschanged = () => {
        tryLoad();
        if (voicesReady) window.speechSynthesis.onvoiceschanged = null;
      };
      // timeout fallback: resolver aunque no haya voces (evita bloqueo)
      setTimeout(() => {
        if (!voicesReady) {
          availableVoices = window.speechSynthesis.getVoices() || [];
          voicesReady = true;
          resolve();
        }
      }, 1500);
    });
    return voicesReadyPromise;
  }

  // Llamar a loadVoicesOnce tras la PRIMERA interacción del usuario (click para abrir o enviar)
  function ensureVoicesAfterUserGesture() {
    // si ya se intentó cargar, devolver la promesa
    return loadVoicesOnce();
  }

  function chooseVoice(langPrefix = "es") {
    if (!availableVoices.length) availableVoices = window.speechSynthesis.getVoices() || [];
    const lp = (langPrefix || "es").toLowerCase();
    let v = availableVoices.find((x) => x.lang && x.lang.toLowerCase().startsWith(lp));
    if (!v) v = availableVoices.find((x) => x.lang && x.lang.toLowerCase().includes(lp));
    if (!v) v = availableVoices.find((x) => x.lang && x.lang.toLowerCase().startsWith("es"));
    if (!v) v = availableVoices.find((x) => x.lang && x.lang.toLowerCase().startsWith("en"));
    return v || (availableVoices.length ? availableVoices[0] : null);
  }

  async function speakText(text) {
    if (!voiceEnabled) return;
    if (!text || !window.speechSynthesis) return;
    try {
      // Asegurar carga de voces tras interacción del usuario
      await ensureVoicesAfterUserGesture();
      const cleaned = String(text).replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
      if (!cleaned) return;
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(cleaned);
      const chosen = chooseVoice("es");
      if (chosen) utter.voice = chosen;
      utter.lang = (chosen && chosen.lang) ? chosen.lang : "es-ES";
      utter.rate = 1;
      utter.pitch = 1;
      utter.onstart = () => { console.debug("TTS start:", cleaned.slice(0, 60)); };
      utter.onend = () => { console.debug("TTS end"); };
      window.speechSynthesis.speak(utter);
    } catch (err) {
      console.warn("TTS error:", err);
    }
  }

  // Asegurar iniciar loadVoices al primer click del usuario (abrir chat o enviar mensaje)
  const firstUserInteraction = () => {
    // esto se ejecuta una sola vez
    ensureVoicesAfterUserGesture().catch(() => {});
    // desactivar el listener ya que no hace falta más
    document.removeEventListener("click", firstUserInteraction);
  };
  document.addEventListener("click", firstUserInteraction, { once: true });
