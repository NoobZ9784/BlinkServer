const { app, BrowserWindow, ipcMain, dialog, Menu, shell, Tray, BrowserView } = require('electron');
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf } = format;
const http = require('http');
const https = require('https');
const winston = require('winston');
const detect = require('detect-port');
const express = require('express');
const osu = require('node-os-utils');
const path = require("path");
const fs = require('fs');
const os = require('os');
const EventEmitter = require('node:events');
const emitter = new EventEmitter();
const util = require('util');
const crypto = require("crypto");

emitter.setMaxListeners(50);

class MemoryTransport extends winston.Transport {
    constructor(options) {
        super(options);
        this.logs = [];
    }

    log(level, msg, meta, callback) {
        // Store log message in memory
        this.logs.push({ level, msg, meta });
        callback();
    }

    getLogsAndClear() {
        // Clear all logs stored in memory
        let result = this.logs
        this.logs = [];
        return result;
    }

    getLogs() {
        // Return all logs stored in memory
        return this.logs;
    }
}


const machineCpu = osu.cpu;
const width = 1600;
const height = 900;
let appWindow;
let tray;
const memoryTransport = new MemoryTransport();

function createWindowMain() {
    appWindow = new BrowserWindow({
        width: width,
        height: height,
        autoHideMenuBar: false,
        frame: false,
        icon: path.join(__dirname, 'modules/Server-gui/assets/logo1.png'),
        webPreferences: {
            nodeIntegration: false, // is default value after Electron v5
            contextIsolation: true, // protect against prototype pollution
            enableRemoteModule: false, // turn off remote
            preload: path.join(__dirname, "preload.js")
        }
    })
    // Menu.setApplicationMenu(null);
    appWindow.loadFile('modules/Server-gui/index.html');
    appWindow.maximize();
    // appWindow.hide();
    // const view = new BrowserView();
    // appWindow.setBrowserView(view);
    // view.setBounds({ x: 0, y: 0, width: width, height: height });
    // view.webContents.loadURL('http://localhost:4200/');
    // appWindow.webContents.openDevTools();


    appWindow.on('closed', function () {
        appWindow = null
    })
}
const customLogFormat = printf(({ level, message, timestamp }) => {
    return `{"level":"${level}","message":"${timestamp} : ${message}"}`;
});

const mainLogger = winston.createLogger({
    level: 'info',
    format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        customLogFormat
    ),
    transports: [
        // Log to console
        // new winston.transports.Console(),
        // Log to file
        new winston.transports.File({ filename: path.join(__dirname, `/modules/Server-logs/server.log`) }),
        // memory tranport
        memoryTransport
    ]
});

function createTray() {
    tray = new Tray(path.join(__dirname, 'modules/Server-gui/assets/logo1.png'));

    const contextMenu = Menu.buildFromTemplate([
        { label: 'Show server', click: () => appWindow.show() },
        {
            label: 'Quit', click: async () => {
                mainLogger.warn('Blink server is closed.');
                await stopAllRunningServers(); app.quit();
            }
        }
    ]);

    tray.setToolTip('Blink Server');
    tray.setContextMenu(contextMenu);

    tray.on('double-click', () => {
        // appWindow.isVisible() ? appWindow.hide() : appWindow.show();
        appWindow.show();
    });
}

let cpuRamStats = {
    time: [],
    cpuUtil: [],
    ramUtil: [],
};

let targetedCpuRamStatsClearTime
let cpuRamInterval;
let serverTrafficInterval;
let serversTraffic = {};

const fiveSecondsIntervalFunc = () => {
    let date = new Date();
    if (date >= targetedCpuRamStatsClearTime) {
        cpuRamStats = {
            time: [],
            cpuUtil: [],
            ramUtil: [],
        };
        targetedCpuRamStatsClearTime += (24 * 60 * 60 * 1000);
    }
    machineCpu.usage()
        .then(usage => {
            let free = os.freemem()
            let total = os.totalmem()
            let ramUsage = ((total - free) / total) * 100

            let ramUtil = Math.floor(ramUsage * 100) / 100;

            cpuRamStats.time.push(`${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`);
            cpuRamStats.cpuUtil.push(usage);
            cpuRamStats.ramUtil.push(ramUtil);
            if (ramUtil > 75 || usage > 75) {
                mainLogger.warn(`Machine info CPU : ${usage}% & RAM : ${ramUtil}%`);
            }
        })
        .catch(error => {
            mainLogger.warn('Exception while getting CPU & RAM usage:' + error)
        });
}

const encData = { key: null, iv: null };
function setEncryptionData() {
    const keyBuffer = Buffer.alloc(32);
    keyBuffer.write('Noobz@BlinkServerEncryptionKey', 0, 'utf-8');
    const ivBuffer = Buffer.alloc(16);
    ivBuffer.write('Noobz@BlinkServerIVKey', 0, 'utf-8');
    encData.key = keyBuffer;
    encData.iv = ivBuffer;
}

app.whenReady().then(() => {
    setEncryptionData();

    if (!app.requestSingleInstanceLock()) {
        dialog.showErrorBox('Error', 'Sorry can not open new blink server instance because a instance is already running.');
        // setTimeout(() => { app.quit(); }, 5000);
        app.quit();
    } else {
        try {
            targetedCpuRamStatsClearTime = Date.now() + (24 * 60 * 60 * 1000);
            createTray();
            fiveSecondsIntervalFunc();
            cpuRamInterval = setInterval(() => {
                fiveSecondsIntervalFunc();
            }, 5000);

            fs.readFile(path.join(__dirname, 'modules/Server-conf/servers-list.json'), 'utf8', async (err, fileData) => {
                if (err) {
                    fs.writeFileSync(path.join(__dirname, 'modules/Server-conf/servers-list.json'), JSON.stringify({}))
                } else {
                    try {
                        let jsonData = JSON.parse(fileData);
                        await forLoopPromiseForWriteAllRunningServers(jsonData);
                        // for (let prj of Object.values(jsonData)) { serversTraffic[prj.name] = 0 }
                    } catch (err) { mainLogger.error(err); return false; }
                }
            });
            createWindowMain();
            mainLogger.warn('Blink Server Init Succesfull');
        } catch (err) { mainLogger.error('Blink Server Init Failed : ' + err) }
    }
})


const forLoopPromiseForWriteAllRunningServers = (jsonData) => {
    return new Promise(async (resolve, reject) => {
        for (let project of Object.values(jsonData)) {
            if (project.is_Active) {
                project.is_Active = false;
                fs.writeFileSync(path.join(__dirname, 'modules/Server-conf/servers-list.json'), JSON.stringify(jsonData));
            }
        }
        resolve();
    })
}

// ========================= SERVER CODE ===========================

let serversList = {};

const createServer = (project, jsonData = null) => {
    return new Promise(async (resolve, reject) => {
        try {
            serversTraffic[`${project.name}`] = 0;
            let expApp = express();
            // mainLogger.debug

            detect(project.port)
                .then(
                    async (_port) => {
                        if (project.port == _port) {
                            expApp.use((req, res, next) => {
                                mainLogger.info(`HTTP ${req.method} ${(project.httpSecured) ? 'https' : 'http'}://${project.ip}:${project.port}${req.url}`);
                                if (!path.extname(req.url)) { serversTraffic[`${project.name}`] += 1; }
                                next();
                            });
                            if (!project.dynamic_routing) {
                                expApp.use(express.static(path.join(__dirname, `/modules/Server-all/Project${project.id}`)));
                                expApp.get('/', (req, res) => {
                                    res.sendFile(path.join(__dirname, `/modules/Server-all/Project${project.id}/index.html`))
                                })
                                expApp.use((req, res, next) => {
                                    mainLogger.error(`Route not Found : http://${project.ip}:${project.port}${req.url}`);
                                    res.status(404).send('Route not found');
                                });
                            } else {
                                expApp.use(express.static(path.join(__dirname, `/modules/Server-all/Project${project.id}`)));
                                expApp.get('*.js', (req, res, next) => {
                                    res.set('Content-Type', 'application/javascript');
                                    next();
                                });
                                expApp.get('*', (req, res) => {
                                    res.sendFile(path.join(__dirname, `/modules/Server-all/Project${project.id}/index.html`));
                                });
                            }
                            expApp.use((err, req, res, next) => {
                                mainLogger.error(err.stack);
                                res.status(500).send('Something went wrong!');
                            });

                            if (project.httpSecured) {
                                let options = {
                                    key: fs.readFileSync(path.join(__dirname, `modules/Server-all/Project${project.id}/server.key`)),
                                    cert: fs.readFileSync(path.join(__dirname, `modules/Server-all/Project${project.id}/server.cert`))
                                }
                                serversList[`${project.name + project.id}`] = https.createServer(options, expApp);
                            } else {
                                serversList[`${project.name + project.id}`] = http.createServer(expApp);
                            }

                            serversList[`${project.name + project.id}`].listen(project.port, project.ip, () => { mainLogger.warn(`Server ${project.name} started successfully on IP:${project.ip} & Port:${project.port}`); });

                            if (jsonData !== null) {
                                jsonData[`${project.name + project.id}`].is_Active = true;
                                fs.writeFileSync(path.join(__dirname, 'modules/Server-conf/servers-list.json'), JSON.stringify(jsonData));
                            }
                            resolve();

                        } else {
                            mainLogger.error(`port: ${project.port} is occupied.`);
                            reject(`port: ${project.port} is occupied.`);
                        }
                    })
                .catch(err => {
                    mainLogger.error(err);
                    reject(err);
                });
        } catch (err) { mainLogger.error(err); reject(err); }
    })
}
const stopServer = (project) => {
    return new Promise((resolve, reject) => {
        fs.readFile(path.join(__dirname, 'modules/Server-conf/servers-list.json'), 'utf8', (err, fileData) => {
            if (err) { mainLogger.error('servers-list.json file is missing : ' + err); return; }
            try {
                let jsonData = JSON.parse(fileData);
                serversList[project.name + project.id].close(() => {
                    mainLogger.warn(`Server with name ${project.name} is closed`);
                    jsonData[`${project.name + project.id}`].is_Active = false;
                    fs.writeFileSync(path.join(__dirname, 'modules/Server-conf/servers-list.json'), JSON.stringify(jsonData));

                    // serversTraffic = Object.keys(serversTraffic).filter(objKey =>
                    //     objKey !== `${project.name}`).reduce((newObj, key) => {
                    //         newObj[key] = serversTraffic[key];
                    //         return newObj;
                    //     }, {});

                    serversTraffic[project.name] = -1;
                    mainLogger.warn(`Project ${project.name} is successfully closed.`)
                    resolve();
                });
            } catch (err) { mainLogger.error('Can not stop server' + err); reject(); }
        });
    })
}
const undeployeServer = (project) => {
    return new Promise((resolve, reject) => {
        fs.readFile(path.join(__dirname, 'modules/Server-conf/servers-list.json'), 'utf8', (err, fileData) => {
            if (err) { mainLogger.error('servers-list.json file is missing : ' + err); reject(err); }
            try {
                let jsonData = JSON.parse(fileData);
                mainLogger.warn(path.join(__dirname, `modules/Server-all/Project${project.id}`));
                fs.rmSync(path.join(__dirname, `modules/Server-all/Project${project.id}`), { recursive: true, force: true });
                jsonData = Object.keys(jsonData).filter(objKey =>
                    objKey !== `${project.name + project.id}`).reduce((newObj, key) => {
                        newObj[key] = jsonData[key];
                        return newObj;
                    }, {});
                fs.writeFileSync(path.join(__dirname, 'modules/Server-conf/servers-list.json'), JSON.stringify(jsonData));
                mainLogger.warn(`Project ${project.name} successfully undeployed`);
                resolve();
            } catch (err) { mainLogger.error(err); reject(err); }
        });
    })
}

const forLoopPromiseForStopServer = (jsonData) => { return new Promise(async (resolve, reject) => { for (let project of Object.values(jsonData)) { if (project.is_Active) { await stopServer(project) } } resolve(); }) }

const forLoopPromiseForStartServer = (jsonData) => {
    let usedPorts = [];
    let values = Object.values(jsonData);
    return new Promise((resolve, reject) => {
        for (let i in values) {
            if (!values[i].is_Active) {
                createServer(values[i], jsonData).then(
                    () => { },
                    (err) => { usedPorts.push(values[i].port) }
                );
            }
            if (parseInt(i) === values.length - 1) { resolve(usedPorts); }
        }
    });
}

const stopAllRunningServers = () => {
    return new Promise((resolve, reject) => {
        fs.readFile(path.join(__dirname, 'modules/Server-conf/servers-list.json'), 'utf8', async (err, fileData) => {
            if (err) { mainLogger.error('servers-list.json file is missing : ' + err); reject(); }
            try {
                let jsonData = JSON.parse(fileData);
                await forLoopPromiseForStopServer(jsonData);
                mainLogger.warn('All running projects are stopped');
                resolve();
            } catch (parseError) { mainLogger.error('servers-list.json file data parsing error : ' + parseError); reject() }
        });
    })
}










// ========================= COMMUNICATION CODE ===========================
ipcMain.on('check-provider-running-and-get-settings', (event, data) => {
    fs.readFile(path.join(__dirname, 'modules/Server-conf/Server-settings.json'), 'utf8', async (err, fileData) => {
        let jsonData = {};
        try {
            if (err) {
                jsonData = {
                    theme: 'L',
                    dashboardReloadTimeout: 5000,
                    trafficReloadInterval: 10000,
                }
                fs.writeFileSync(path.join(__dirname, 'modules/Server-conf/Server-settings.json'), JSON.stringify(jsonData));
            }
            else {
                jsonData = JSON.parse(fileData);
            }
            event.sender.send('check-provider-running-and-get-settings-result', { status: true, data: jsonData })
        }
        catch (parseError) { event.sender.send('check-provider-running-and-get-settings-result', { status: false, error: 'Server-settings.json file data parsing error : ' + parseError }); }
    });
})

ipcMain.on('save-blink-settings', (event, data) => {
    try {
        fs.writeFileSync(path.join(__dirname, 'modules/Server-conf/Server-settings.json'), JSON.stringify(data));
        mainLogger.warn(`Blink Server settings is successfully saved : ${JSON.stringify(data)}`);
        event.sender.send('save-blink-settings-result', { status: true });
        clearInterval(cpuRamInterval);
        cpuRamInterval = setInterval(() => {
            fiveSecondsIntervalFunc();
        }, data.dashboardReloadTimeout)
    } catch (err) {
        mainLogger.error(`Error while saving Blink server settings : ${err}`)
        event.sender.send('save-blink-settings-result', { status: false, error: 'Cannot save the settings file : ' + err })
    }
})

ipcMain.on('toggle-max-min', (event, data) => { if (appWindow.isMaximized()) { appWindow.unmaximize() } else { appWindow.maximize() } })

ipcMain.on('win-minimize', (event, data) => { appWindow.minimize() })

ipcMain.on('win-close', async (event, data) => {
    mainLogger.warn('Blink server is closed.');
    await stopAllRunningServers();
    app.quit();
})

ipcMain.on('open-a-url', (event, data) => { shell.openExternal(data.url) });

ipcMain.on('run-app-in-background', (event, data) => { appWindow.hide(); });

ipcMain.on('stop-all-running-servers', (event, data) => { stopAllRunningServers().then((data) => { event.sender.send('stop-all-running-servers-result', { status: true }); }); });

ipcMain.on('start-all-servers', (event, data) => {
    fs.readFile(path.join(__dirname, 'modules/Server-conf/servers-list.json'), 'utf8', (err, fileData) => {
        if (err) { event.sender.send('start-all-servers-result', { status: false, error: 'servers-list.json file data parsing error : ' + err }); return; }
        try {
            let jsonData = JSON.parse(fileData);
            forLoopPromiseForStartServer(jsonData).then((data) => {
                event.sender.send('start-all-servers-result', { status: true, data: data });
                mainLogger.warn('All stopped servers are started');
            });
        } catch (parseError) {
            event.sender.send('start-all-servers-result', { status: false, error: 'servers-list.json file data parsing error : ' + parseError });
            mainLogger.error('Exception while starting all servers : ' + parseError);
        }
    });
})

ipcMain.on('get-all-servers-list', (event, data) => {
    fs.readFile(path.join(__dirname, 'modules/Server-conf/servers-list.json'), 'utf8', (err, fileData) => {
        if (err) { event.sender.send('get-all-servers-list-result', { status: false, error: 'servers-list.json file is missing' }); return; }
        try {
            let jsonData = JSON.parse(fileData);
            event.sender.send('get-all-servers-list-result', { status: true, data: jsonData })
        } catch (parseError) { event.sender.send('get-all-servers-list-result', { status: false, error: 'servers-list.json file data parsing error' }) }
    });
});

ipcMain.on('add-new-project', (event, data) => {
    dialog.showOpenDialog({ properties: ['openDirectory'] }).then((result) => {
        if (result.canceled) { event.sender.send('add-new-project-result', { status: false, error: 'User canceled folder selection' }) }
        else {
            let folderPath = result.filePaths[0];

            fs.readdir(folderPath, (err, files) => {
                if (err) { event.sender.send('add-new-project-result', { status: false, error: 'Unable to read Directory : ' + err }) }

                let foundIndexFile = false;
                for (let file of files) {
                    if (file === 'index.html') {
                        foundIndexFile = true;
                        break;
                    }
                }
                if (foundIndexFile) {
                    fs.cp(folderPath, path.join(__dirname, `/modules/Server-all/Project${data.id}`), { recursive: true }, (err2) => {
                        if (err2) { event.sender.send('aadd-new-project-result', { status: false, error: 'Unable to copy directory : ' + err2 }) }
                        else {
                            fs.readFile(path.join(__dirname, 'modules/Server-conf/servers-list.json'), 'utf8', (err, serversList) => {
                                if (err) { event.sender.send('add-new-project-result', { status: false, error: 'servers-list.json file is missing' }); return; }
                                try {
                                    let jsonData = JSON.parse(serversList);
                                    let portUnused = true;
                                    for (let key of Object.keys(jsonData)) {
                                        if (jsonData[key].port === data.port) {
                                            portUnused = false;
                                            mainLogger.warn(`Project ${jsonData[key].name} is already using this port.`);
                                            break;
                                        }
                                    }
                                    if (portUnused) {
                                        jsonData[`${data.name + data.id}`] = data;
                                        fs.writeFileSync(path.join(__dirname, 'modules/Server-conf/servers-list.json'), JSON.stringify(jsonData));
                                        mainLogger.warn(`Successfully added new project ${data.name}`);
                                        event.sender.send('add-new-project-result', { status: true })
                                    } else { event.sender.send('add-new-project-result', { status: false, error: 'port is already in used !' }) }
                                } catch (parseError) {
                                    mainLogger.error('Exception while adding new project : ' + parseError);
                                    event.sender.send('add-new-project-result', { status: false, error: 'servers-list.json file data parsing error' + parseError })
                                }

                            });
                        }
                    })
                } else { event.sender.send('add-new-project-result', { status: false, error: 'index.html file is not present in the folder !' }) }
            })
        }
    });
})

ipcMain.on('start-a-server', (event, data) => {
    fs.readFile(path.join(__dirname, 'modules/Server-conf/servers-list.json'), 'utf8', (err, fileData) => {
        if (err) { event.sender.send('start-a-server-result', { status: false, error: 'servers-list.json file not found !' + err }) }
        else {
            try {
                let jsonData = JSON.parse(fileData);
                if (jsonData[`${data.name + data.id}`].is_Active) {
                    event.sender.send('start-a-server-result', { status: false, error: 'server already running' })
                } else {
                    createServer(data).then(() => {
                        jsonData[data.name + data.id].is_Active = true;
                        fs.writeFileSync(path.join(__dirname, 'modules/Server-conf/servers-list.json'), JSON.stringify(jsonData));
                        event.sender.send('start-a-server-result', { status: true })
                    }, (err) => { event.sender.send('start-a-server-result', { status: false, error: 'Server cannot be created! ' + err }) })

                }
            } catch (err) { event.sender.send('start-a-server-result', { status: false, error: 'unable to parse servers-list.json file data ! ' + err }) }
        }
    })
})
ipcMain.on('close-a-server', (event, data) => {
    fs.readFile(path.join(__dirname, 'modules/Server-conf/servers-list.json'), 'utf8', (err, fileData) => {
        if (err) { event.sender.send('close-a-server-result', { status: false, error: 'servers-list.json file not found !' + err }) }
        else {
            try {
                let jsonData = JSON.parse(fileData);
                if (!jsonData[`${data.name + data.id}`].is_Active) {
                    event.sender.send('close-a-server-result', { status: false, error: 'server already stopped' })
                } else {
                    stopServer(data).then(() => {
                        jsonData[data.name + data.id].is_Active = false;
                        fs.writeFileSync(path.join(__dirname, 'modules/Server-conf/servers-list.json'), JSON.stringify(jsonData));
                        event.sender.send('close-a-server-result', { status: true })
                    }, (err) => { event.sender.send('close-a-server-result', { status: false, error: 'Something went wrong server cannot be stopped!' }) })

                }
            } catch (err) { event.sender.send('close-a-server-result', { status: false, error: 'unable to parse servers-list.json file data !' + err }) }
        }
    })
});

ipcMain.on('restart-a-server', (event, data) => {
    fs.readFile(path.join(__dirname, 'modules/Server-conf/servers-list.json'), 'utf8', (err, fileData) => {
        if (err) { event.sender.send('restart-a-server-result', { status: false, error: 'servers-list.json file not found !' + err }) }
        else {
            try {
                let jsonData = JSON.parse(fileData);
                if (!jsonData[`${data.name + data.id}`].is_Active) {
                    event.sender.send('restart-a-server-result', { status: false, error: 'server already stopped' })
                } else {
                    stopServer(data).then(() => {
                        jsonData[data.name + data.id].is_Active = false;
                        fs.writeFileSync(path.join(__dirname, 'modules/Server-conf/servers-list.json'), JSON.stringify(jsonData));
                        createServer(data).then(() => {
                            jsonData[data.name + data.id].is_Active = true;
                            fs.writeFileSync(path.join(__dirname, 'modules/Server-conf/servers-list.json'), JSON.stringify(jsonData));
                            event.sender.send('restart-a-server-result', { status: true })
                        }, (err) => { event.sender.send('restart-a-server-result', { status: false, error: 'Something went wrong server cannot be created!' }) })
                    }, (err) => { event.sender.send('restart-a-server-result', { status: false, error: 'Something went wrong server cannot be stopped!' }) })
                }
            } catch (err) { event.sender.send('restart-a-server-result', { status: false, error: 'unable to parse servers-list.json file data !' + err }) }
        }
    })
})

ipcMain.on('save-a-edited-project', (event, data) => {
    fs.readFile(path.join(__dirname, 'modules/Server-conf/servers-list.json'), 'utf8', (err, fileData) => {
        if (err) { event.sender.send('save-a-edited-project-result', { status: false, error: 'servers-list.json file not found !' + err }) }
        else {
            try {
                let jsonData = JSON.parse(fileData);
                jsonData[`${data.name + data.id}`] = data;
                fs.writeFileSync(path.join(__dirname, 'modules/Server-conf/servers-list.json'), JSON.stringify(jsonData));
                mainLogger.warn(`Project ${data.name} data is successfully updated`)
                event.sender.send('save-a-edited-project-result', { status: true });
            } catch (err) {
                mainLogger.error(`Exception while updating project ${data.name} data`);
                event.sender.send('save-a-edited-project-result', { status: false, error: 'unable to parse servers-list.json file data !' + err });
            }
        }
    })
});

ipcMain.on('undeploye-a-project', (event, data) => {
    if (data.is_Active) { event.sender.send('undeploye-a-project-result', { status: false, error: "Can not undeploye a project when it's server is running" }) }
    else {
        undeployeServer(data).then(
            () => { event.sender.send('undeploye-a-project-result', { status: true }) },
            () => { event.sender.send('undeploye-a-project-result', { status: false, error: "Project can not be undeployed due to some error check console" }) })
    }
})

ipcMain.on('get-machine-info', (event, data) => {
    event.sender.send('get-machine-info-result', {
        status: true,
        data: {
            cpuInfo: os.cpus()[0],
            cpuAvlParalism: os.availableParallelism(),
            os: os.platform(),
            osArch: os.arch(),
            osType: os.type(),
            totalMem: Math.round((os.totalmem() / 1073741824) * 100) / 100,
        }
    })
})
ipcMain.on('get-cpu-ram-stats', (event, data) => { event.sender.send('get-cpu-ram-stats-result', { status: true, data: cpuRamStats }) })


let logFileData = [];
const forLoop = (data) => {
    return new Promise((resolve, reject) => {
        try {
            for (let line of data) {
                try {
                    logFileData.push(JSON.parse(line))
                } catch (err) { continue; }
            }
            resolve();
        } catch (err) { mainLogger.error('parsing error ' + err); reject(); }
    })
}
ipcMain.on('get-logs-from-file', (event, data) => {
    logFileData = [];
    fs.readFile(path.join(__dirname, `/modules/Server-logs/server.log`), 'utf-8', (err, fileData) => {
        if (err) {
            event.sender.send('get-logs-from-file-result', { status: false, error: 'Something went wrong : ' + err });
            mainLogger.error('error in reading' + err);
        }
        else {
            forLoop(fileData.split('\r\n')).then(() => {
                memoryTransport.getLogsAndClear();
                event.sender.send('get-logs-from-file-result', { status: true, data: logFileData });
            }, (err) => {
                event.sender.send('get-logs-from-file-result', { status: false, error: 'Something went wrong : ' + err });
                mainLogger.error('Cannot read log file.');
            })
        }
    })
})
ipcMain.on('get-logs-from-memory', (event, data) => {
    try {
        event.sender.send('get-logs-from-memory-result', { status: true, data: memoryTransport.getLogsAndClear() })
    } catch (err) { event.sender.send('get-logs-from-memory-result', { status: false, error: 'Something went wrong : ' + err }) }
})


const writeLogFile = (writer, jsonData) => { return new Promise((resolve, reject) => { jsonData.map((row) => { writer.write(`${row.level} : ${row.message}\n`) }); resolve(); }) }

ipcMain.on('save-as-logs-data', (event, data) => {
    let date = new Date();
    dialog.showSaveDialog({
        title: 'Save As',
        defaultPath: `BlinkServerLogs-${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`, // Default file name
        filters: [
            { name: 'Log Files', extensions: ['log'] } // Filter by file extension
        ]
    }).then(async (result) => {
        if (!result.canceled && result.filePath) {
            let writer = fs.createWriteStream(result.filePath)
            writeLogFile(writer, data).then(() => { writer.end(); })

            // fs.writeFileSync(result.filePath, JSON.stringify(data));
            mainLogger.warn('Successfylly saved logs on ' + result.filePath);
            event.sender.send('save-as-logs-data-result', { status: true });
        } else {
            event.sender.send('save-as-logs-data-result', { status: false, error: 'User canceled.' });
        }
    }).catch(err => {
        mainLogger.error('Exception while saving logs file : ' + err);
        event.sender.send('save-as-logs-data-result', { status: false, error: 'Error saving file:' + err });
    });
})

ipcMain.on('get-servers-traffic-Data', (event, data) => {
    let date = new Date();
    serversTraffic['time'] = `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
    serversTraffic['date'] = `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
    event.sender.send('get-servers-traffic-Data-result', serversTraffic);
    for (let trr of Object.keys(serversTraffic)) { if (trr !== 'time' && trr !== 'date' && serversTraffic[trr] !== -1) { serversTraffic[trr] = 0 } }
})

const copyMultiFilePromise = util.promisify(fs.copyFile);
const copyMultiFiles = (destDir, files) => {
    return Promise.all(files.map(f => {
        return copyMultiFilePromise(f, path.join(__dirname, destDir, (path.extname(f) === '.cert') ? 'server.cert' : 'server.key'));
    }));
}


ipcMain.on('get-security-keys', (event, data) => {
    fs.readdir(path.join(__dirname, `modules/Server-all/Project${data.id}`), (err, files) => {
        if (err) { mainLogger.error(`Error while reading directory /Project${data.id}`) }
        else if ((!files.includes('server.cert') && !files.includes('server.key')) || data.isUpdate) {
            dialog.showOpenDialog({
                title: 'Select .cert & .key file',
                properties: ['openFile', 'multiSelections'],
                filters: [{ name: 'security files', extensions: ['cert', 'key'] }]
            }).then(result => {
                if (result.canceled) { event.sender.send('get-security-keys-result', { status: false, error: 'Canceled selection' }); }
                else if (!result.canceled && result.filePaths.length === 2) {
                    let certValidation = false;
                    let keyValidation = false;
                    for (let file of result.filePaths) {
                        if (path.extname(file) === '.cert') { certValidation = true; }
                        else if (path.extname(file) === '.key') { keyValidation = true; }
                    }
                    if (certValidation && keyValidation) {
                        copyMultiFiles(`modules/Server-all/Project${data.id}/`, result.filePaths)
                            .then(() => {
                                mainLogger.warn(`Successfully added security files to ${data.name}`);
                                event.sender.send('get-security-keys-result', { status: true });
                            })
                            .catch((err) => { event.sender.send('get-security-keys-result', { status: false, error: 'Something went wrong !!' + err }); })
                    }
                    else { event.sender.send('get-security-keys-result', { status: false, error: 'User is not allowed to select other files other thant .cert and .key files' }); }
                }
                else if (result.filePaths.length < 2 || result.filePaths.length > 2) { event.sender.send('get-security-keys-result', { status: false, error: 'User has to select 2 files' }); }
                else { event.sender.send('get-security-keys-result', { status: false, error: 'Something went wrong !!' }); }
            }).catch(err => {
                mainLogger.error('Exception while reading security files : ' + err);
                event.sender.send('save-as-logs-data-result', { status: false, error: 'Exception while reading security files : ' + err });
            });
        } else { event.sender.send('save-as-logs-data-result', { status: false, error: 'Security files already exists' }); }
    })
})




// ipcMain.on
function encrypt(plainText) {
    const cipher = crypto.createCipheriv('aes-256-cbc', encData.key, encData.iv);
    let encrypted = cipher.update(plainText, 'utf8', 'hex');
    encrypted += cipher.final('hex'); // Complete the encryption

    return encrypted;
}
function decrypt(encryptedText) {
    const decipher = crypto.createDecipheriv('aes-256-cbc', encData.key, encData.iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8'); // Complete the decryption

    return decrypted;
}
ipcMain.on('export-dashboard-data', (event, data) => {
    let date = new Date();
    dialog.showSaveDialog({
        title: 'Save As',
        defaultPath: `BlinkServerDashboard-${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`, // Default file name
        filters: [
            { name: 'Blink Files', extensions: ['blink'] } // Filter by file extension
        ]
    }).then(async (result) => {
        if (!result.canceled && result.filePath) {
            let encryptedData = encrypt(JSON.stringify(data));
            fs.writeFileSync(result.filePath, encryptedData);
            mainLogger.warn('Dashboard data successfully exported at :=> ' + result.filePath);
            event.sender.send('export-dashboard-data-result', { status: true });
        } else {
            event.sender.send('export-dashboard-data-result', { status: false, error: 'User canceled.' });
        }
    }).catch(err => {
        mainLogger.error('Exception while exporting dashboard data : ' + err);
        event.sender.send('export-dashboard-data-result', { status: false, error: 'Error saving file:' + err });
    });
})