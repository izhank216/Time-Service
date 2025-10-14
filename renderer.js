const { ipcRenderer, shell } = require('electron');
const remote = require('@electron/remote');

function updateTime() {
  const now = new Date();
  document.getElementById('timer').textContent =
    now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
setInterval(updateTime, 1000);
updateTime();

ipcRenderer.on('windows-eol', (event, date) => {
  document.getElementById('support-date').textContent = `Win10 EOL: ${date}`;
});

ipcRenderer.on('desktop-wallpaper', (event, wallpaperPath) => {
  if (wallpaperPath) {
    document.body.style.backgroundImage = `url('file:///${wallpaperPath.replace(/\\/g, '/')}')`;
  }
});

let systemInfo = { version: '', build: '', cpu: '', load: '', ram: '' };

ipcRenderer.on('windows-version', (event, info) => {
  systemInfo.version = info.version;
  systemInfo.build = info.build;
  updateSystemInfo();
});

ipcRenderer.on('performance-info', (event, info) => {
  systemInfo.cpu = info.cpu;
  systemInfo.load = info.load;
  systemInfo.ram = info.ram;
  updateSystemInfo();
});

function updateSystemInfo() {
  document.getElementById('system-info').innerHTML =
    `${systemInfo.version}<br>Build: ${systemInfo.build}<br>CPU: ${systemInfo.cpu}<br>CPU Load: ${systemInfo.load}<br>RAM: ${systemInfo.ram}`;
}

function showWelcomeAnimationIfFirstTime(callback) {
  if (!localStorage.getItem('welcome_shown')) {
    const welcomeDiv = document.getElementById('welcome-animation');
    if (welcomeDiv) {
      welcomeDiv.style.display = 'flex';
      setTimeout(() => {
        welcomeDiv.classList.add('hide');
        setTimeout(() => {
          welcomeDiv.style.display = 'none';
          localStorage.setItem('welcome_shown', '1');
          callback();
        }, 950);
      }, 1800);
    } else {
      callback();
    }
  } else {
    callback();
  }
}

window.onload = () => {
  showWelcomeAnimationIfFirstTime(() => {
    setTimeout(() => {
      document.getElementById('animation-overlay').style.display = 'none';
      showOnboarding();

      // Bing search bar event handler
      const searchBtn = document.getElementById('bing-search-btn');
      const searchInput = document.getElementById('bing-query');
      if (searchBtn && searchInput) {
        searchBtn.onclick = () => {
          const query = searchInput.value.trim();
          if (query) {
            shell.openExternal(`https://www.bing.com/search?q=${encodeURIComponent(query)}`);
          }
        };
        searchInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            searchBtn.click();
          }
        });
      }

      setupSettingsButton();
      setupMsLoginStatus();

      // About link event handler
      const aboutLink = document.getElementById('about-link');
      if (aboutLink) {
        aboutLink.onclick = () => {
          const { BrowserWindow } = remote;
          let aboutWin = new BrowserWindow({
            width: 900,
            height: 600,
            resizable: true,
            minimizable: false,
            maximizable: true,
            title: "About Time Service App",
            modal: true,
            parent: remote.getCurrentWindow(),
            webPreferences: {
              nodeIntegration: true,
              contextIsolation: false
            }
          });
          aboutWin.setMenuBarVisibility(false);
          aboutWin.loadFile('about.html');
          aboutWin.maximize();
        };
      }

      // Notepad link event handler
      const notepadLink = document.getElementById('notepad-link');
      if (notepadLink) {
        notepadLink.onclick = () => {
          const { BrowserWindow } = remote;
          let notepadWin = new BrowserWindow({
            width: 900,
            height: 600,
            resizable: true,
            minimizable: false,
            maximizable: true,
            title: "Notepad",
            modal: true,
            parent: remote.getCurrentWindow(),
            webPreferences: {
              nodeIntegration: true,
              contextIsolation: false
            }
          });
          notepadWin.setMenuBarVisibility(false);
          notepadWin.loadFile('notepad.html');
          notepadWin.maximize();
        };
      }
    }, 1200);
  });
};

function showOnboarding() {
  const name = localStorage.getItem('username');
  const device = localStorage.getItem('device');
  const getStarted = document.getElementById('get-started');
  const deviceChoice = document.getElementById('device-choice');

  if (!name) {
    getStarted.style.display = 'flex';
    document.getElementById('timer').style.display = 'none';
    document.getElementById('support-date').style.display = 'none';
    document.getElementById('name-display').style.display = 'none';
    document.getElementById('system-info').style.display = 'none';
    deviceChoice.style.display = 'none';

    document.getElementById('start-btn').onclick = () => {
      const enteredName = document.getElementById('username').value.trim();
      if (enteredName) {
        localStorage.setItem('username', enteredName);
        deviceChoice.style.display = 'flex';
      }
    };

    document.getElementById('choose-laptop').onclick = () => {
      localStorage.setItem('device', 'Laptop');
      finishSetup();
    };
    document.getElementById('choose-pc').onclick = () => {
      localStorage.setItem('device', 'PC');
      finishSetup();
    };
    document.getElementById('choose-skip').onclick = () => {
      finishSetup();
    };

    function finishSetup() {
      getStarted.style.display = 'none';
      document.getElementById('timer').style.display = '';
      document.getElementById('support-date').style.display = '';
      document.getElementById('name-display').style.display = '';
      document.getElementById('system-info').style.display = '';
      setupSettingsButton();
      setNameDisplay(localStorage.getItem('username'));
    }
  } else {
    getStarted.style.display = 'none';
    setNameDisplay(name);
    setupSettingsButton();
  }
}

function setNameDisplay(name) {
  const nameDiv = document.getElementById('name-display');
  nameDiv.textContent = name ? `Hello, ${name}` : '';
  nameDiv.style.display = 'block';
  document.getElementById('timer').style.display = '';
  document.getElementById('support-date').style.display = '';
  document.getElementById('system-info').style.display = '';
}

function setupSettingsButton() {
  const device = localStorage.getItem('device');
  const btn = document.getElementById('settings-btn');
  if (!btn) return;

  if (device === 'Laptop' || device === 'PC') {
    btn.textContent = `Device (${device})`;
  } else {
    btn.textContent = 'Settings';
  }
  btn.style.display = '';

  btn.onclick = () => {
    showSettingsModal();
  };

  function showSettingsModal() {
    const modal = document.getElementById('settings-modal');
    const content = document.getElementById('settings-modal-content');
    modal.classList.add('show');
    modal.classList.remove('hide');
    content.innerHTML = '';

    if (device === 'Laptop' || device === 'PC') {
      content.innerHTML = `<div style="font-size:1.1em;">Your device: <strong>${device}</strong></div>`;
    } else {
      content.innerHTML = `
        <div style="margin-bottom:1em;">Choose your device:</div>
        <button id="settings-choose-laptop">Laptop</button>
        <button id="settings-choose-pc">PC</button>
      `;
      setTimeout(() => {
        document.getElementById('settings-choose-laptop').onclick = () => {
          localStorage.setItem('device', 'Laptop');
          closeSettingsModal();
          setupSettingsButton();
        };
        document.getElementById('settings-choose-pc').onclick = () => {
          localStorage.setItem('device', 'PC');
          closeSettingsModal();
          setupSettingsButton();
        };
      }, 100);
    }

    document.getElementById('settings-close-btn').onclick = () => {
      closeSettingsModal();
    };
  }

  function closeSettingsModal() {
    const modal = document.getElementById('settings-modal');
    modal.classList.remove('show');
    modal.classList.add('hide');
    setTimeout(() => {
      modal.classList.remove('hide');
      modal.style.display = 'none';
      setTimeout(() => { modal.style.display = 'flex'; }, 10);
    }, 300);
  }
}

// Microsoft account sign-in status + Office icons logic
function setupMsLoginStatus() {
  const msStatusDiv = document.getElementById('ms-login-status');
  const msIconsDiv = document.getElementById('ms-office-icons');
  if (!msStatusDiv || !msIconsDiv) return;

  // Office icon data
  const officeApps = [
    {
      id: "excel",
      name: "Excel",
      img: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Microsoft_Office_Excel_%282025%E2%80%93present%29.svg/250px-Microsoft_Office_Excel_%282025%E2%80%93present%29.svg.png",
      url: "https://www.office.com/launch/excel"
    },
    {
      id: "word",
      name: "Word",
      img: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Microsoft_Office_Word_%282025%E2%80%93present%29.svg/250px-Microsoft_Office_Word_%282025%E2%80%93present%29.svg.png",
      url: "https://www.office.com/launch/word"
    },
    {
      id: "outlook",
      name: "Outlook",
      img: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Microsoft_Outlook_Icon_%282025%E2%80%93present%29.svg/250px-Microsoft_Outlook_Icon_%282025%E2%80%93present%29.svg.png",
      url: "https://outlook.office.com/"
    },
    {
      id: "powerpoint",
      name: "PowerPoint",
      img: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/Microsoft_Office_PowerPoint_%282025%E2%80%93present%29.svg/250px-Microsoft_Office_PowerPoint_%282025%E2%80%93present%29.svg.png",
      url: "https://www.office.com/launch/powerpoint"
    }
  ];

  let msSignedIn = localStorage.getItem('ms_account_signedin') === 'true';

  function renderStatus() {
    if (msSignedIn) {
      msStatusDiv.classList.add('signedin');
      msStatusDiv.innerHTML = `You are signed in with your Microsoft account.`;
      renderIcons();
      msIconsDiv.style.display = 'flex';
    } else {
      msStatusDiv.classList.remove('signedin');
      msStatusDiv.innerHTML = `You are not signed in with your Microsoft account, <span id="ms-signin-link">click here to sign in with your microsoft account</span>.`;
      msIconsDiv.style.display = 'none';
      msIconsDiv.innerHTML = '';
      const signinLink = document.getElementById('ms-signin-link');
      if (signinLink) {
        signinLink.onclick = () => {
          // Open Microsoft sign-in page in the default browser
          shell.openExternal('https://login.microsoftonline.com/');
          // Simulate sign-in after redirect (in real app, handle OAuth)
          setTimeout(() => {
            if (confirm("Did you complete Microsoft sign-in? Click OK to confirm.")) {
              localStorage.setItem('ms_account_signedin', 'true');
              msSignedIn = true;
              renderStatus();
            }
          }, 1000);
        };
      }
    }
  }

  function renderIcons() {
    msIconsDiv.innerHTML = '';
    officeApps.forEach(app => {
      const btn = document.createElement('button');
      btn.className = 'office-icon';
      btn.title = app.name;
      btn.tabIndex = 0;
      btn.innerHTML = `<img src="${app.img}" alt="${app.name}" style="width:32px;height:32px;pointer-events:none;" />`;
      btn.onclick = () => shell.openExternal(app.url);
      msIconsDiv.appendChild(btn);
    });
  }

  renderStatus();
}