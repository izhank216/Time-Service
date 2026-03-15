const { app, BrowserWindow } = require('electron');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');
const os = require('os');
const { loadPlugins } = require('./pluginLoader');

// Enable @electron/remote
require('@electron/remote/main').initialize();

function fetchWindowsEOL(callback) {
  https.get('https://windowscountdown.com/', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      const match = data.match(/End of support:? (\d{4}-\d{2}-\d{2})/i);
      callback(match ? match[1] : '2025-10-14');
    });
  }).on('error', () => callback('2025-10-14'));
}

function getDesktopWallpaper() {
  if (os.platform() === 'win32') {
    try {
      const stdout = execSync(
        'reg query "HKCU\\Control Panel\\Desktop" /v Wallpaper'
      );
      const match = stdout.toString().match(/Wallpaper\s+REG_SZ\s+(.+)/);
      if (match && match[1]) return match[1].trim();
    } catch {
      return null;
    }
  }
  return null;
}

function getWindowsVersionInfo() {
  if (os.platform() === 'win32') {
    try {
      const version = os.release();
      const build = version.split('.')[2] || version;
      let winVer = 'Windows';
      let caption = '';
      try {
        caption = execSync('wmic os get Caption', { encoding: 'utf8' })
          .split('\n')[1].trim();
        if (caption) winVer = caption;
      } catch {}
      return {
        version: winVer,
        build: build
      };
    } catch {
      return { version: 'Windows', build: os.release() };
    }
  }
  return { version: os.platform(), build: os.release() };
}

function getPerformanceInfo() {
  const cpus = os.cpus();
  const load = os.loadavg()[0];
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  return {
    cpu: `${cpus[0].model}`,
    load: load.toFixed(2),
    ram: `${((totalMem - freeMem) / totalMem * 100).toFixed(1)}% used`
  };
}

function createWindow() {
  const win = new BrowserWindow({
    width: 900,
    height: 600,
    frame: true,
    transparent: false,
    webPreferences: {
      preload: path.join(__dirname, 'renderer.js'),
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    }
  });

  win.setMenuBarVisibility(false);

  win.maximize();

  win.loadFile('index.html');

  // Enable @electron/remote for this window
  require('@electron/remote/main').enable(win.webContents);

  win.webContents.on('did-finish-load', () => {
    fetchWindowsEOL((date) => {
      win.webContents.send('windows-eol', date);
    });
    win.webContents.send('desktop-wallpaper', getDesktopWallpaper());
    win.webContents.send('windows-version', getWindowsVersionInfo());
    win.webContents.send('performance-info', getPerformanceInfo());
    loadPlugins(win);
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => { app.quit(); });
