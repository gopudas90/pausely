import React, { useState, useEffect, useCallback } from 'react';
import { Layout, Tabs } from 'antd';
import Dashboard from './components/Dashboard';
import Settings from './components/Settings';

const { Content } = Layout;

// ─── Alert Sound ──────────────────────────────────────────────────────────────

function playAlertSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const t   = ctx.currentTime;

    // ── Reverb (synthesised impulse response) ─────────────────────────────────
    const irLen    = Math.floor(ctx.sampleRate * 2.4);
    const irBuf    = ctx.createBuffer(2, irLen, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const ch = irBuf.getChannelData(c);
      for (let i = 0; i < irLen; i++) {
        ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / irLen, 2.5);
      }
    }
    const reverb     = ctx.createConvolver();
    reverb.buffer    = irBuf;
    const reverbGain = ctx.createGain();
    reverbGain.gain.value = 0.28;
    reverb.connect(reverbGain);
    reverbGain.connect(ctx.destination);

    // ── Master bus ─────────────────────────────────────────────────────────────
    const master = ctx.createGain();
    master.gain.value = 0.52;
    master.connect(ctx.destination);
    master.connect(reverb);

    // ── Note helper (triangle wave = warm bell-like tone) ─────────────────────
    const note = (freq, start, decay, vol = 0.7) => {
      const osc  = ctx.createOscillator();
      const harm = ctx.createOscillator(); // octave harmonic for richness
      const g    = ctx.createGain();
      const gh   = ctx.createGain();

      osc.type  = 'triangle';
      harm.type = 'sine';
      osc.frequency.value  = freq;
      harm.frequency.value = freq * 2;

      g.gain.setValueAtTime(0, start);
      g.gain.linearRampToValueAtTime(vol, start + 0.012);
      g.gain.exponentialRampToValueAtTime(0.001, start + decay);

      gh.gain.setValueAtTime(0, start);
      gh.gain.linearRampToValueAtTime(vol * 0.28, start + 0.012);
      gh.gain.exponentialRampToValueAtTime(0.001, start + decay * 0.6);

      osc.connect(g);    g.connect(master);
      harm.connect(gh);  gh.connect(master);

      osc.start(start);  osc.stop(start + decay + 0.1);
      harm.start(start); harm.stop(start + decay + 0.1);
    };

    // ── Phrase 1 — ascending C-major arpeggio (C5 E5 G5 C6) ──────────────────
    note(523.25, t + 0.00, 0.55, 0.55);   // C5
    note(659.25, t + 0.16, 0.55, 0.55);   // E5
    note(783.99, t + 0.32, 0.65, 0.55);   // G5
    note(1046.5, t + 0.50, 1.80, 0.65);   // C6 — long sustain

    // ── Phrase 2 — gentle resolution (G5 E5 C5) ──────────────────────────────
    note(783.99, t + 1.70, 0.45, 0.28);   // G5
    note(659.25, t + 1.90, 0.45, 0.28);   // E5
    note(523.25, t + 2.10, 2.80, 0.32);   // C5 — long fading tail (~5 s total)
  } catch (e) {
    // audio not available
  }
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [settings,   setSettings]   = useState(null);
  const [timerState, setTimerState] = useState(null);
  const [activeTab,  setActiveTab]  = useState('dashboard');

  // Load initial state
  useEffect(() => {
    Promise.all([
      window.electronAPI.getSettings(),
      window.electronAPI.getTimerState(),
    ]).then(([s, t]) => {
      setSettings(s);
      setTimerState(t);
    });
  }, []);

  // Live timer updates
  useEffect(() => {
    return window.electronAPI.onTimerUpdate((state) => {
      setTimerState({ ...state });
    });
  }, []);

  // Play sound when a reminder fires (notification popup is handled by main process)
  useEffect(() => {
    return window.electronAPI.onReminderFired(() => playAlertSound());
  }, []);

  const handleSaveSettings = useCallback(async (newSettings) => {
    await window.electronAPI.saveSettings(newSettings);
    setSettings(newSettings);
  }, []);

  const handleResetTimer = useCallback(async (name) => {
    await window.electronAPI.resetTimer(name);
  }, []);

  const tabs = [
    {
      key:      'dashboard',
      label:    'Dashboard',
      children: <Dashboard timerState={timerState} onReset={handleResetTimer} />,
    },
    {
      key:      'settings',
      label:    'Settings',
      children: <Settings settings={settings} onSave={handleSaveSettings} />,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Content style={{ padding: '0 24px 24px' }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabs}
          style={{ marginTop: 4 }}
        />
      </Content>
    </Layout>
  );
}
