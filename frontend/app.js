/**
 * Gaming Agent Frontend
 * Pure Vanilla JavaScript (No dependencies)
 */

(function () {
  'use strict';

  // DOM Elements
  const html = document.documentElement;
  const themeToggle = document.getElementById('theme-toggle');
  const playForm = document.getElementById('play-form');
  const promptInput = document.getElementById('prompt-input');
  const runBtn = document.getElementById('run-btn');
  const clearBtn = document.getElementById('clear-btn');
  const chipDice = document.getElementById('chip-dice');
  const chipCoin = document.getElementById('chip-coin');
  const chips = [chipDice, chipCoin];

  const resultCard = document.getElementById('result-card');
  const statusDot = document.getElementById('status-dot');
  const statusText = document.getElementById('status-text');
  const copyBtn = document.getElementById('copy-btn');
  const resultPlaceholder = document.getElementById('result-placeholder');
  const resultContent = document.getElementById('result-content');
  const resultText = document.getElementById('result-text');
  const resultBadges = document.getElementById('result-badges');
  const resultBadge = document.getElementById('result-badge');
  const badgeIcon = document.getElementById('badge-icon');
  const badgeLabel = document.getElementById('badge-label');
  const resultError = document.getElementById('result-error');
  const errorMessage = document.getElementById('error-message');
  const resultFooter = document.getElementById('result-footer');
  const latencyValue = document.getElementById('latency-value');

  const historySection = document.getElementById('history-section');
  const historyList = document.getElementById('history-list');
  const clearHistoryBtn = document.getElementById('clear-history-btn');

  const STORAGE_KEY_THEME = 'gaming-agent-theme';
  let historyItems = [];

  // ==========================================
  // Theme Management (Persisted in localStorage)
  // ==========================================
  function initTheme() {
    const savedTheme = localStorage.getItem(STORAGE_KEY_THEME);
    if (savedTheme === 'light' || savedTheme === 'dark') {
      applyTheme(savedTheme);
    } else {
      // Default to Osaka Jade (dark), but check system preference
      const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
      applyTheme(prefersLight ? 'light' : 'dark');
    }
  }

  function applyTheme(theme) {
    html.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY_THEME, theme);
    if (themeToggle) {
      const nextThemeName = theme === 'dark' ? 'light' : 'Osaka Jade dark';
      themeToggle.setAttribute('title', `Switch to ${nextThemeName} theme`);
      themeToggle.setAttribute('aria-label', `Switch to ${nextThemeName} theme`);
    }
  }

  function toggleTheme() {
    const currentTheme = html.getAttribute('data-theme') || 'dark';
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);
  }

  themeToggle.addEventListener('click', toggleTheme);

  // ==========================================
  // Prompt Chips Interaction
  // ==========================================
  function setChipActive(selectedChip) {
    chips.forEach(chip => {
      if (!chip) return;
      const isActive = chip === selectedChip;
      chip.classList.toggle('is-active', isActive);
      chip.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
  }

  function selectPrompt(promptText, sourceChip) {
    promptInput.value = promptText;
    setChipActive(sourceChip);
    updateClearButton();
    adjustTextareaHeight();
    promptInput.focus();
  }

  chipDice.addEventListener('click', () => {
    selectPrompt('Roll a 12 sided dice', chipDice);
  });

  chipCoin.addEventListener('click', () => {
    selectPrompt('Toss a Coin', chipCoin);
  });

  // Check if manual typing matches any chip prompt
  function checkChipsMatch() {
    const val = promptInput.value.trim().toLowerCase();
    if (val === 'roll a 12 sided dice') {
      setChipActive(chipDice);
    } else if (val === 'toss a coin') {
      setChipActive(chipCoin);
    } else {
      setChipActive(null);
    }
  }

  // ==========================================
  // Input Handling & Textarea Auto-Resize
  // ==========================================
  function updateClearButton() {
    if (promptInput.value.length > 0) {
      clearBtn.style.display = 'inline-block';
    } else {
      clearBtn.style.display = 'none';
    }
  }

  function adjustTextareaHeight() {
    promptInput.style.height = 'auto';
    const newHeight = Math.min(Math.max(promptInput.scrollHeight, 64), 200);
    promptInput.style.height = newHeight + 'px';
  }

  promptInput.addEventListener('input', () => {
    updateClearButton();
    adjustTextareaHeight();
    checkChipsMatch();
  });

  clearBtn.addEventListener('click', () => {
    promptInput.value = '';
    updateClearButton();
    adjustTextareaHeight();
    setChipActive(null);
    promptInput.focus();
  });

  // Enter to send, Shift+Enter for newline
  promptInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      playForm.requestSubmit();
    }
  });

  // ==========================================
  // Form Submission & API Request to /play
  // ==========================================
  function setStatus(state, message) {
    statusDot.className = 'status-indicator status-' + state;
    statusText.textContent = message;
  }

  async function handlePlaySubmit(e) {
    e.preventDefault();
    const promptTextValue = promptInput.value.trim();
    if (!promptTextValue) {
      promptInput.focus();
      return;
    }

    // Set UI to loading state
    runBtn.disabled = true;
    runBtn.classList.add('is-loading');
    setStatus('loading', 'Agent Thinking...');
    
    // Hide previous responses / errors
    resultPlaceholder.style.display = 'none';
    resultContent.style.display = 'none';
    resultError.style.display = 'none';
    resultFooter.style.display = 'none';
    copyBtn.style.display = 'none';

    const startTime = performance.now();

    try {
      const response = await fetch('/play', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt: promptTextValue })
      });

      const elapsed = Math.round(performance.now() - startTime);
      latencyValue.textContent = `${elapsed} ms`;

      if (!response.ok) {
        let errDetail = `Server responded with ${response.status} ${response.statusText}`;
        try {
          const errData = await response.json();
          if (errData.error) errDetail = errData.error;
          else if (errData.message) errDetail = errData.message;
        } catch (_) {
          // ignore non-json error responses
        }
        throw new Error(errDetail);
      }

      const data = await response.json();
      if (typeof data.result === 'undefined') {
        throw new Error('Invalid response received: missing "result" property');
      }

      // Display successful result
      renderSuccess(data.result, data.toolCalls);
      addHistoryItem(promptTextValue, data.result, data.toolCalls);
      setStatus('success', 'Completed');

    } catch (err) {
      renderError(err.message || 'Failed to communicate with the AI Agent');
      setStatus('error', 'Failed');
    } finally {
      runBtn.disabled = false;
      runBtn.classList.remove('is-loading');
    }
  }

  playForm.addEventListener('submit', handlePlaySubmit);

  // ==========================================
  // Tool Call Resolution & Badges Rendering
  // ==========================================
  const KNOWN_TOOLS = {
    roll_a_dice: {
      icon: '🎲',
      label: 'Dice Game Tool'
    },
    flip_a_coin: {
      icon: '🪙',
      label: 'Coin Toss Tool'
    }
  };

  function getToolName(call) {
    if (!call) return '';
    if (typeof call === 'string') return call;
    return call.toolName || call.name || call.function?.name || '';
  }

  function getToolDisplay(toolCall) {
    const rawName = getToolName(toolCall);
    if (!rawName) return null;

    if (KNOWN_TOOLS[rawName]) {
      return { ...KNOWN_TOOLS[rawName], rawName };
    }

    const normalized = rawName.toLowerCase().replace(/[-_\s]/g, '');
    if (normalized.includes('dice')) {
      return { icon: '🎲', label: 'Dice Game Tool', rawName };
    }
    if (normalized.includes('coin')) {
      return { icon: '🪙', label: 'Coin Toss Tool', rawName };
    }

    return { icon: '🎮', label: rawName, rawName };
  }

  function renderToolBadges(toolCalls) {
    const container = resultBadges || (resultBadge && resultBadge.parentElement);
    if (!container) return;

    const calls = Array.isArray(toolCalls)
      ? toolCalls
      : (toolCalls ? [toolCalls] : []);

    const displays = calls.map(getToolDisplay).filter(Boolean);

    if (displays.length === 0) {
      container.innerHTML = `
        <div class="result-badge" id="result-badge">
          <span class="badge-icon" id="badge-icon">🤖</span>
          <span class="badge-label" id="badge-label">AI Agent</span>
        </div>
      `;
      return;
    }

    container.innerHTML = displays.map((tool, idx) => `
      <div class="result-badge"${idx === 0 ? ' id="result-badge"' : ''} title="${escapeHtml(tool.rawName || tool.label)}">
        <span class="badge-icon"${idx === 0 ? ' id="badge-icon"' : ''}>${tool.icon}</span>
        <span class="badge-label"${idx === 0 ? ' id="badge-label"' : ''}>${escapeHtml(tool.label)}</span>
      </div>
    `).join('');
  }

  // ==========================================
  // Render Success / Error
  // ==========================================
  function renderSuccess(output, toolCalls) {
    resultText.textContent = output;

    // Render tool chip(s) from response payload
    renderToolBadges(toolCalls);

    resultContent.style.display = 'flex';
    resultFooter.style.display = 'flex';
    copyBtn.style.display = 'inline-flex';
  }

  function renderError(msg) {
    errorMessage.textContent = msg;
    resultError.style.display = 'flex';
  }

  // ==========================================
  // Clipboard Copy Action
  // ==========================================
  copyBtn.addEventListener('click', async () => {
    const textToCopy = resultText.textContent;
    if (!textToCopy) return;

    try {
      await navigator.clipboard.writeText(textToCopy);
      const textSpan = copyBtn.querySelector('.action-btn-text');
      const originalText = textSpan.textContent;
      textSpan.textContent = 'Copied!';
      copyBtn.style.borderColor = 'var(--accent-jade)';
      copyBtn.style.color = 'var(--accent-jade)';

      setTimeout(() => {
        textSpan.textContent = originalText;
        copyBtn.style.borderColor = '';
        copyBtn.style.color = '';
      }, 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  });

  // ==========================================
  // Session History Management
  // ==========================================
  function addHistoryItem(prompt, result, toolCalls) {
    historyItems.unshift({ prompt, result, toolCalls, timestamp: new Date() });
    if (historyItems.length > 8) historyItems.pop();
    renderHistory();
  }

  function renderHistory() {
    if (historyItems.length === 0) {
      historySection.style.display = 'none';
      return;
    }

    historySection.style.display = 'flex';
    historyList.innerHTML = '';

    historyItems.forEach(item => {
      const el = document.createElement('div');
      el.className = 'history-item';
      
      let icon = '💬';
      if (item.toolCalls && Array.isArray(item.toolCalls) && item.toolCalls.length > 0) {
        const toolDisplay = getToolDisplay(item.toolCalls[0]);
        if (toolDisplay && toolDisplay.icon) {
          icon = toolDisplay.icon;
        }
      } else {
        const isDice = item.prompt.toLowerCase().includes('dice');
        const isCoin = item.prompt.toLowerCase().includes('coin');
        icon = isDice ? '🎲' : isCoin ? '🪙' : '💬';
      }

      el.innerHTML = `
        <span class="history-prompt">
          <span class="history-icon">${icon}</span>
          <span class="history-text">${escapeHtml(item.prompt)}</span>
        </span>
        <span class="history-result">${escapeHtml(item.result)}</span>
      `;

      el.addEventListener('click', () => {
        promptInput.value = item.prompt;
        checkChipsMatch();
        updateClearButton();
        adjustTextareaHeight();
        promptInput.focus();
      });

      historyList.appendChild(el);
    });
  }

  clearHistoryBtn.addEventListener('click', () => {
    historyItems = [];
    renderHistory();
  });

  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // ==========================================
  // Initialization
  // ==========================================
  initTheme();
  adjustTextareaHeight();
  updateClearButton();
})();
