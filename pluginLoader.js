const { app } = require('electron');
const fs = require('fs');
const path = require('path');

function loadPlugins(window) {
    const pluginsDir = path.join(app.getPath('userData'), 'plugins');

    if (!fs.existsSync(pluginsDir)) {
        fs.mkdirSync(pluginsDir, { recursive: true });
        return;
    }

    const folders = fs.readdirSync(pluginsDir);

    folders.forEach((folder) => {
        const folderPath = path.join(pluginsDir, folder);
        
        if (fs.lstatSync(folderPath).isDirectory()) {
            const configPath = path.join(folderPath, 'plugin.json');
            
            if (fs.existsSync(configPath)) {
                try {
                    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                    const mainFileName = config.main || 'index.js';
                    const scriptPath = path.join(folderPath, mainFileName);

                    if (fs.existsSync(scriptPath)) {
                        const scriptContent = fs.readFileSync(scriptPath, 'utf8');
                        const pName = (config.name || folder).toLowerCase();

                        const injection = `
                            (function() {
                                const pluginInfo = ${JSON.stringify(config)};
                                console.log('plugin info [' + '${pName}' + ']: loading...');
                                try {
                                    ${scriptContent}
                                } catch (e) {
                                    console.error('plugin error! [' + '${pName}' + ']:', e);
                                }
                                if (false) { 
                                    console.warn('plugin warn! [' + '${pName}' + ']:');
                                }
                            })();
                        `;

                        window.webContents.executeJavaScript(injection);
                    }
                } catch (err) {
                    console.error('plugin error! [loader]: failed to load ' + folder, err);
                }
            }
        }
    });
}

module.exports = { loadPlugins };
