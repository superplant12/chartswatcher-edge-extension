// Finds the royalblue-selected panel with a SYMBOL input and syncs on blur/Enter.
(() => {
  console.log('[SymbolSync][CS] init');

  const TARGET_COLORS = ['royalblue', 'rgb(65, 105, 225)', 'rgba(65, 105, 225, 1)'];
  let boundInput = null;
  let applyingRemote = false;
  let pendingBind = null;
  let scanTimer = null;
  let lastSent = '';
  let lastSeen = '';
  let monitorInterval = null;
  let sendTimer = null;
  const SEND_DEBOUNCE_MS = 1200; // wait for typing to settle; blur/Enter still send immediately

  const isRoyalBlue = el => {
    const color = (getComputedStyle(el).color || '').toLowerCase();
    return TARGET_COLORS.some(c => color.includes(c));
  };

  const findSymbolInput = () => {
    console.log('[SymbolSync][CS] scanning for royalblue SYMBOL input');
    for (const tile of document.querySelectorAll('tile')) {
      const colorLabel = [...tile.querySelectorAll('label.contextBtn')].find(isRoyalBlue);
      if (!colorLabel) continue;
      const symbolInput = tile.querySelector('input[slot="input"][placeholder="SYMBOL"]');
      if (symbolInput) {
        console.log('[SymbolSync][CS] found candidate input in tile', tile.getAttribute('id') || '(no id)');
        return symbolInput;
      }
    }
    console.log('[SymbolSync][CS] no matching input found');
    return null;
  };

  const sendSymbol = () => {
    if (!boundInput) return;
    if (applyingRemote) {
      return;
    }
    const symbol = (boundInput.value || '').trim();
    console.log('[SymbolSync][CS] send candidate', symbol);
    if (!symbol || symbol === lastSent) return;
    try {
      chrome.runtime.sendMessage({ type: 'symbolChanged', symbol });
      lastSent = symbol;
    } catch (err) {
      console.warn('[SymbolSync][CS] send error (ignored)', err?.message || err);
    }
  };

  const sendSymbolDebounced = () => {
    if (sendTimer) clearTimeout(sendTimer);
    sendTimer = setTimeout(() => {
      sendTimer = null;
      sendSymbol();
    }, SEND_DEBOUNCE_MS);
  };

  const monitorValue = () => {
    if (!boundInput) return;
    const isFocused = document.activeElement === boundInput;
    const current = (boundInput.value || '').trim();
    if (current === lastSeen) return;
    lastSeen = current;
    if (!current) return;
    if (applyingRemote) {
      applyingRemote = false;
      return;
    }
    // Do not send while user is actively typing; wait for blur/change/enter.
    if (isFocused) return;
    if (current !== lastSent) {
      console.log('[SymbolSync][CS] detected change via monitor (no focus)', current);
      sendSymbolDebounced();
    }
  };

  const bindToSymbolInput = () => {
    pendingBind = null;
    const input = findSymbolInput();
    if (!input) return;

    // If already bound to same input and attached, keep.
    if (boundInput === input && document.contains(boundInput)) return;

    boundInput = input;
    console.log('[SymbolSync][CS] bound to input id=', input.id || '(no id)');
    lastSeen = (boundInput.value || '').trim();

    const onBlur = () => {
      console.log('[SymbolSync][CS] blur');
      if (sendTimer) {
        clearTimeout(sendTimer);
        sendTimer = null;
      }
      sendSymbol();
    };
    const onChange = () => {
      console.log('[SymbolSync][CS] change');
      sendSymbol();
    };
    const onEnter = evt => {
      if (evt.key === 'Enter') {
        console.log('[SymbolSync][CS] enter key');
        sendSymbol();
      }
    };

    boundInput.addEventListener('blur', onBlur);
    boundInput.addEventListener('change', onChange);
    boundInput.addEventListener('keydown', onEnter);

    if (monitorInterval) clearInterval(monitorInterval);
    monitorInterval = setInterval(monitorValue, 500);
  };

  const scheduleBind = () => {
    if (pendingBind) return;
    pendingBind = requestAnimationFrame(bindToSymbolInput);
  };

  const startObservers = () => {
    // Simple periodic scan to bind/rebind; keeps running to stay resilient.
    scheduleBind(); // initial attempt
    if (scanTimer) clearInterval(scanTimer);
    scanTimer = setInterval(() => {
      if (!boundInput || !document.contains(boundInput)) {
        console.log('[SymbolSync][CS] bound input missing; rebinding');
        if (monitorInterval) {
          clearInterval(monitorInterval);
          monitorInterval = null;
        }
        boundInput = null;
        scheduleBind();
      }
    }, 2000);
    console.log('[SymbolSync][CS] scan timer started');
  };

  if (document.readyState === 'complete') {
    setTimeout(startObservers, 3000); // wait for late-loaded content
  } else {
    window.addEventListener('load', () => setTimeout(startObservers, 3000), { once: true });
  }

  chrome.runtime.onMessage.addListener(message => {
    if (message?.type !== 'applySymbol' || !boundInput) return;
    const next = (message.symbol || '').trim();
    if (!next || boundInput.value.trim() === next) return;
    console.log('[SymbolSync][CS] applying incoming symbol', next);
    applyingRemote = true;
    boundInput.value = next;
    boundInput.dispatchEvent(new Event('input', { bubbles: true }));
    boundInput.dispatchEvent(new Event('change', { bubbles: true }));
    // Some tiles react only on Enter; synthesize it.
    const enterEventInit = { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true };
    boundInput.dispatchEvent(new KeyboardEvent('keydown', enterEventInit));
    boundInput.dispatchEvent(new KeyboardEvent('keyup', enterEventInit));
    lastSeen = next;
    lastSent = next;
    if (sendTimer) {
      clearTimeout(sendTimer);
      sendTimer = null;
    }
    // Allow our synthetic events to settle before allowing outbound sends again.
    setTimeout(() => { applyingRemote = false; }, 50);
  });
})();
