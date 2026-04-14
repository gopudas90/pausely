const {
  app,
  BrowserWindow,
  Tray,
  Menu,
  ipcMain,
  Notification,
  nativeImage,
  screen,
  shell,
} = require('electron');
const path = require('path');
const fs   = require('fs');

// Disable GPU hardware acceleration to avoid GPU process crashes
// on systems with incompatible GPU drivers
app.disableHardwareAcceleration();

// ─── Settings ─────────────────────────────────────────────────────────────────

function getSettingsFile() {
  return path.join(app.getPath('userData'), 'settings.json');
}

const DEFAULT_SETTINGS = {
  break:      { enabled: true, interval:  45 },
  water:      { enabled: true, interval:  90 },
  screenTime: { enabled: true, threshold: 60 },
};

function loadSettings() {
  try {
    if (fs.existsSync(getSettingsFile())) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(fs.readFileSync(getSettingsFile(), 'utf-8')) };
    }
  } catch (e) {
    console.error('Failed to load settings:', e.message);
  }
  return { ...DEFAULT_SETTINGS };
}

function persistSettings(s) {
  try {
    fs.writeFileSync(getSettingsFile(), JSON.stringify(s, null, 2));
  } catch (e) {
    console.error('Failed to save settings:', e.message);
  }
}

// ─── Timer State ───────────────────────────────────────────────────────────────

let settings = DEFAULT_SETTINGS;

function makeTimerState(s) {
  return {
    break: {
      enabled:   s.break.enabled,
      remaining: s.break.interval * 60,
      total:     s.break.interval * 60,
      stopped:   false,
    },
    water: {
      enabled:   s.water.enabled,
      remaining: s.water.interval * 60,
      total:     s.water.interval * 60,
      stopped:   false,
    },
    screenTime: {
      enabled:   s.screenTime.enabled,
      elapsed:   0,
      threshold: s.screenTime.threshold * 60,
      notified:  false,
      stopped:   false,
    },
  };
}

let timerState     = makeTimerState(DEFAULT_SETTINGS);
let mainWindow     = null;
let notifWindow    = null;
let reminderModal  = null;
let tray           = null;
let tickInterval   = null;
let modalOpen      = false;  // pauses all timers while a reminder modal is visible

// ─── Warning state ─────────────────────────────────────────────────────────────

const warningState = {
  break:      { warned1min: false },
  water:      { warned1min: false },
  screenTime: { warned1min: false },
};

function clearWarnings(type) {
  warningState[type].warned1min = false;
  dismissNotif(`warning-${type}`);
  dismissNotif(type);
}

function clearAllWarnings() {
  ['break', 'water', 'screenTime'].forEach(clearWarnings);
}

// ─── Notification config ───────────────────────────────────────────────────────

const NOTIF_CONFIG = {
  break: {
    icon:        '☕',
    iconBg:      '#fff7ed',
    borderColor: '#fed7aa',
    color:       '#f97316',
    label:       'break',
  },
  water: {
    icon:        '💧',
    iconBg:      '#f0f9ff',
    borderColor: '#bae6fd',
    color:       '#0ea5e9',
    label:       'water reminder',
  },
  screenTime: {
    icon:        '🖥️',
    iconBg:      '#faf5ff',
    borderColor: '#ddd6fe',
    color:       '#8b5cf6',
    label:       'screen break',
  },
};

// ─── Notification window ───────────────────────────────────────────────────────

const ICON_PATH = path.join(__dirname, 'assets', 'icon.png');

let notifWindowReady = false;
const notifQueue     = [];

function createNotifWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  notifWindow = new BrowserWindow({
    width:       396,
    height:      100,
    x:           width  - 404,
    y:           height - 108,
    frame:       false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable:   false,
    focusable:   true,   // must be true on Windows for IPC to work reliably
    show:        false,
    webPreferences: {
      preload:          path.join(__dirname, 'preload-notif.js'),
      contextIsolation: true,
      nodeIntegration:  false,
    },
  });

  notifWindow.setAlwaysOnTop(true, 'floating');
  notifWindow.loadFile(path.join(__dirname, 'assets', 'notif.html'));

  // Queue any notifications sent before the page is ready
  notifWindow.webContents.on('did-finish-load', () => {
    notifWindowReady = true;
    notifQueue.forEach(msg => {
      if (!notifWindow.isDestroyed()) notifWindow.webContents.send('notif', msg);
    });
    notifQueue.length = 0;
  });

  notifWindow.on('closed', () => {
    notifWindow      = null;
    notifWindowReady = false;
  });
}

function sendNotif(key, data) {
  if (!notifWindow || notifWindow.isDestroyed()) return;
  const msg = { key, ...data };
  if (!notifWindowReady) { notifQueue.push(msg); return; }
  notifWindow.webContents.send('notif', msg);
}

function dismissNotif(key) {
  if (!notifWindow || notifWindow.isDestroyed()) return;
  notifWindow.webContents.send('notif-dismiss', key);
}

// ─── Reminder Modal (with queue for simultaneous reminders) ───────────────────

const modalQueue = [];

function showReminderModal(type, title, body) {
  // If a modal is already visible, queue this one — it will show after
  if (reminderModal && !reminderModal.isDestroyed()) {
    modalQueue.push({ type, title, body });
    return;
  }
  openModal(type, title, body);
}

function openModal(type, title, body) {
  modalOpen = true;   // pause all other timers while this modal is visible
  const { bounds } = screen.getPrimaryDisplay();
  const cfg = NOTIF_CONFIG[type];

  reminderModal = new BrowserWindow({
    width:       bounds.width,
    height:      bounds.height,
    x:           bounds.x,
    y:           bounds.y,
    frame:       false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    focusable:   true,
    show:        false,
    webPreferences: {
      preload:          path.join(__dirname, 'preload-modal.js'),
      contextIsolation: true,
      nodeIntegration:  false,
    },
  });

  reminderModal.setAlwaysOnTop(true, 'screen-saver');
  reminderModal.loadFile(path.join(__dirname, 'assets', 'reminder-modal.html'));

  reminderModal.webContents.once('did-finish-load', () => {
    reminderModal.webContents.send('modal-data', {
      type, title, body,
      icon:       cfg.icon,
      color:      cfg.color,
      iconBg:     cfg.iconBg,
      iconBorder: cfg.borderColor,
      queueLength: modalQueue.length,  // tells modal how many are waiting
    });
    reminderModal.show();
    reminderModal.focus();
  });

  reminderModal.on('closed', () => {
    reminderModal = null;
    if (modalQueue.length > 0) {
      // Next modal opens immediately — modalOpen stays true
      const next = modalQueue.shift();
      setTimeout(() => openModal(next.type, next.title, next.body), 250);
    } else {
      // All modals done — resume all timers
      modalOpen = false;
    }
  });
}

// ─── OS Notification ───────────────────────────────────────────────────────────

function notify(title, body) {
  if (!Notification.isSupported()) return;
  new Notification({
    title,
    body,
    ...(fs.existsSync(ICON_PATH) ? { icon: ICON_PATH } : {}),
  }).show();
}

// ─── Warning check (called from tick) ─────────────────────────────────────────

function checkWarning(type, secondsLeft, total) {
  if (secondsLeft <= 0) return;
  const cfg = NOTIF_CONFIG[type];

  // 1-minute warning — fires as soon as secondsLeft drops into the 16-60 range
  // (>15 so it doesn't overlap the 15-sec countdown, no total check so all timers qualify)
  if (secondsLeft <= 60 && secondsLeft > 15 && !warningState[type].warned1min) {
    warningState[type].warned1min = true;
    sendNotif(`warning-${type}`, {
      ...cfg,
      bgColor:     '#fffbeb',
      borderColor: '#fcd34d',
      title:       `1 min to ${cfg.label}`,
      description: `Get ready — your ${cfg.label} is coming up in 1 minute.`,
    });
  }

  // 15-second countdown (updates every second in-place)
  if (secondsLeft <= 15) {
    sendNotif(`warning-${type}`, {
      ...cfg,
      countdown: secondsLeft,
    });
  }
}

// ─── Fire reminder ─────────────────────────────────────────────────────────────

function fireReminder(type, title, body) {
  notify(title, body);

  // Close the warning popup for this type
  dismissNotif(`warning-${type}`);
  warningState[type].warned1min = false;

  // Show full-screen modal
  showReminderModal(type, title, body);

  // Tell renderer to play the alert sound
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('reminder-fired', { type });
  }
}

// ─── Tick ─────────────────────────────────────────────────────────────────────

function tick() {
  const { break: br, water, screenTime } = timerState;

  // Break
  if (br.enabled && !br.stopped && !modalOpen) {
    br.remaining = Math.max(0, br.remaining - 1);
    if (br.remaining === 0) {
      br.stopped = true;
      fireReminder('break', 'Break Time!', "You've been sitting for a while. Take 5 minutes to stretch!");
    } else {
      checkWarning('break', br.remaining, br.total);
    }
  }

  // Water
  if (water.enabled && !water.stopped && !modalOpen) {
    water.remaining = Math.max(0, water.remaining - 1);
    if (water.remaining === 0) {
      water.stopped = true;
      fireReminder('water', 'Drink Water!', 'Stay hydrated — grab a glass of water right now.');
    } else {
      checkWarning('water', water.remaining, water.total);
    }
  }

  // Screen time
  if (screenTime.enabled && !screenTime.stopped && !modalOpen) {
    screenTime.elapsed++;
    const timeLeft = screenTime.threshold - screenTime.elapsed;
    if (!screenTime.notified && timeLeft <= 0) {
      const hrs = Math.round(screenTime.elapsed / 3600 * 10) / 10;
      screenTime.notified = true;
      screenTime.stopped  = true;
      fireReminder('screenTime', 'Screen Break Time!', `You've been on screen for ${hrs}h. Time to take a real break!`);
    } else {
      checkWarning('screenTime', timeLeft, screenTime.threshold);
    }
  }

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('timer-update', timerState);
  }
}

function startTick() {
  if (tickInterval) clearInterval(tickInterval);
  tickInterval = setInterval(tick, 1000);
}

// ─── Apply Settings ────────────────────────────────────────────────────────────

function applySettings(newSettings) {
  settings = newSettings;
  persistSettings(settings);

  const { break: br, water, screenTime } = timerState;

  br.enabled   = settings.break.enabled;
  br.total     = settings.break.interval * 60;
  br.remaining = br.total;
  br.stopped   = false;

  water.enabled   = settings.water.enabled;
  water.total     = settings.water.interval * 60;
  water.remaining = water.total;
  water.stopped   = false;

  screenTime.enabled   = settings.screenTime.enabled;
  screenTime.threshold = settings.screenTime.threshold * 60;
  screenTime.notified  = false;
  screenTime.stopped   = false;

  clearAllWarnings();
}

// ─── Window ────────────────────────────────────────────────────────────────────

Menu.setApplicationMenu(null);

function createWindow() {
  mainWindow = new BrowserWindow({
    width:     1040,
    height:    640,
    minWidth:  880,
    minHeight: 560,
    webPreferences: {
      preload:          path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration:  false,
    },
    title:           'Break Reminder',
    show:            false,
    backgroundColor: '#f5f6fa',
    icon:            fs.existsSync(ICON_PATH) ? ICON_PATH : undefined,
  });

  mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  mainWindow.once('ready-to-show', () => mainWindow.show());

  mainWindow.on('close', (e) => {
    if (!app.isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });
}

// ─── Tray ──────────────────────────────────────────────────────────────────────

function createTray() {
  let icon;
  try {
    icon = nativeImage.createFromPath(ICON_PATH);
    if (icon.isEmpty()) throw new Error('empty');
    icon = icon.resize({ width: 16, height: 16 });
  } catch {
    icon = nativeImage.createEmpty();
  }

  tray = new Tray(icon);
  tray.setToolTip('Break Reminder');

  const menu = Menu.buildFromTemplate([
    { label: 'Open', click: () => { mainWindow?.show(); mainWindow?.focus(); } },
    { type: 'separator' },
    { label: 'Reset Break Timer',  click: () => { timerState.break.remaining = timerState.break.total; timerState.break.stopped = false; clearWarnings('break'); } },
    { label: 'Reset Water Timer',  click: () => { timerState.water.remaining = timerState.water.total; timerState.water.stopped = false; clearWarnings('water'); } },
    { label: 'Reset Screen Time',  click: () => { timerState.screenTime.elapsed = 0; timerState.screenTime.notified = false; timerState.screenTime.stopped = false; clearWarnings('screenTime'); } },
    { type: 'separator' },
    { label: 'Quit', click: () => { app.isQuitting = true; app.quit(); } },
  ]);

  tray.setContextMenu(menu);
  tray.on('click', () => {
    if (!mainWindow) return;
    mainWindow.isVisible() ? mainWindow.hide() : (mainWindow.show(), mainWindow.focus());
  });
}

// ─── IPC ───────────────────────────────────────────────────────────────────────

ipcMain.on('open-external', (_, url) => shell.openExternal(url));

ipcMain.handle('get-settings',   () => settings);
ipcMain.handle('get-timer-state', () => timerState);

ipcMain.handle('save-settings', (_, newSettings) => {
  applySettings(newSettings);
  return { ok: true };
});

ipcMain.handle('reset-timer', (_, name) => {
  if (name === 'break') {
    timerState.break.remaining = timerState.break.total;
    timerState.break.stopped   = false;
    clearWarnings('break');
  } else if (name === 'water') {
    timerState.water.remaining = timerState.water.total;
    timerState.water.stopped   = false;
    clearWarnings('water');
  } else if (name === 'screenTime') {
    timerState.screenTime.elapsed  = 0;
    timerState.screenTime.notified = false;
    timerState.screenTime.stopped  = false;
    clearWarnings('screenTime');
  }
  return { ok: true };
});

// ── Modal IPC ──────────────────────────────────────────────────────────────────

ipcMain.on('modal-close', () => {
  reminderModal?.close();
});

ipcMain.on('modal-restart', (_, type) => {
  if (type === 'break') {
    timerState.break.remaining = timerState.break.total;
    timerState.break.stopped   = false;
    clearWarnings('break');
  } else if (type === 'water') {
    timerState.water.remaining = timerState.water.total;
    timerState.water.stopped   = false;
    clearWarnings('water');
  } else if (type === 'screenTime') {
    timerState.screenTime.elapsed  = 0;
    timerState.screenTime.notified = false;
    timerState.screenTime.stopped  = false;
    clearWarnings('screenTime');
  }
  reminderModal?.close();
});

// Resize / show / hide the notification window from notif renderer
ipcMain.on('notif-resize', (_, height) => {
  if (!notifWindow || notifWindow.isDestroyed()) return;
  const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize;
  if (height <= 0) {
    notifWindow.hide();
    return;
  }
  const h = Math.min(height + 4, 520);
  const w = 396;
  notifWindow.setBounds({ x: sw - w - 8, y: sh - h - 8, width: w, height: h });
  if (!notifWindow.isVisible()) notifWindow.showInactive();
});

// ─── App Lifecycle ─────────────────────────────────────────────────────────────

app.whenReady().then(() => {
  settings   = loadSettings();
  timerState = makeTimerState(settings);

  createWindow();
  createNotifWindow();
  createTray();
  startTick();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  // Keep alive in tray
});

app.on('before-quit', () => {
  app.isQuitting = true;
});
