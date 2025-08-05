"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
function openNewWindow(url, width, height, title) {
    electron_1.ipcRenderer.send('create-new-window', { url, width, height, title });
}
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    createNewWindow: openNewWindow,
    closeWindow: (url) => electron_1.ipcRenderer.send('close-window', url),
    probeOpenWrt: () => electron_1.ipcRenderer.invoke('probe-openwrt'),
    retryConnection: (url) => electron_1.ipcRenderer.send('retry-connection', url),
    openSettings: () => electron_1.ipcRenderer.send('open-settings'),
    exitApp: () => electron_1.ipcRenderer.send('exit-app'),
    getCurrentUrl: () => electron_1.ipcRenderer.invoke('get-current-url'),
    checkInternetConnectivity: () => electron_1.ipcRenderer.invoke('check-internet-connectivity'),
    // Legacy SSH methods
    sshToRouter: (options) => electron_1.ipcRenderer.invoke('ssh-to-router', options || {}),
    testSshConnection: (options) => electron_1.ipcRenderer.invoke('test-ssh-connection', options || {}),
    // New persistent SSH methods
    sshConnect: (options) => electron_1.ipcRenderer.invoke('ssh-connect', options || {}),
    sshExecuteCommand: (options) => electron_1.ipcRenderer.invoke('ssh-execute-command', options),
    sshGetStatus: () => electron_1.ipcRenderer.invoke('ssh-get-status'),
    sshDisconnect: () => electron_1.ipcRenderer.invoke('ssh-disconnect'),
    // SSH event listeners
    onSshConnectionStatus: (callback) => {
        electron_1.ipcRenderer.on('ssh-connection-status', (event, status) => callback(status));
    },
    onSshCommandOutput: (callback) => {
        electron_1.ipcRenderer.on('ssh-command-output', (event, output) => callback(output));
    },
    // Remove SSH event listeners
    removeAllSshListeners: () => {
        electron_1.ipcRenderer.removeAllListeners('ssh-connection-status');
        electron_1.ipcRenderer.removeAllListeners('ssh-command-output');
    },
    // API Integration for Automated Router Onboarding
    apiInitializeDeployment: (authToken, businessId) => electron_1.ipcRenderer.invoke('api-initialize-deployment', { authToken, businessId }),
    apiGetNextStep: (authToken, sessionId, currentStepId, routerInfo) => electron_1.ipcRenderer.invoke('api-get-next-step', { authToken, sessionId, currentStepId, routerInfo }),
    apiExecuteStep: (authToken, sessionId, stepId, testResult) => electron_1.ipcRenderer.invoke('api-execute-step', { authToken, sessionId, stepId, testResult })
});
