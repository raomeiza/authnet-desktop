import { contextBridge, ipcRenderer } from 'electron';

function openNewWindow(url: any, width: any, height: any, title?: string) {
  ipcRenderer.send('create-new-window', { url, width, height, title });
}

contextBridge.exposeInMainWorld('electronAPI', {
  createNewWindow: openNewWindow,
  closeWindow: (url?: string) => ipcRenderer.send('close-window', url),
  probeOpenWrt: () => ipcRenderer.invoke('probe-openwrt'),
  retryConnection: (url: string) => ipcRenderer.send('retry-connection', url),
  openSettings: () => ipcRenderer.send('open-settings'),
  exitApp: () => ipcRenderer.send('exit-app'),
  getCurrentUrl: () => ipcRenderer.invoke('get-current-url'),
  checkInternetConnectivity: () => ipcRenderer.invoke('check-internet-connectivity'),
  
  // Legacy SSH methods
  sshToRouter: (options?: { host?: string; username?: string; command?: string }) => 
    ipcRenderer.invoke('ssh-to-router', options || {}),
  testSshConnection: (options?: { host?: string; username?: string }) => 
    ipcRenderer.invoke('test-ssh-connection', options || {}),
  
  // New persistent SSH methods
  sshConnect: (options?: { host?: string; username?: string }) => 
    ipcRenderer.invoke('ssh-connect', {}),
  sshExecuteCommand: (options: { command: string }) => 
    ipcRenderer.invoke('ssh-execute-command', options),
  sshGetStatus: () => ipcRenderer.invoke('ssh-get-status'),
  sshDisconnect: () => ipcRenderer.invoke('ssh-disconnect'),
  
  // SSH event listeners
  onSshConnectionStatus: (callback: (status: any) => void) => {
    ipcRenderer.on('ssh-connection-status', (event, status) => callback(status));
  },
  onSshCommandOutput: (callback: (output: any) => void) => {
    ipcRenderer.on('ssh-command-output', (event, output) => callback(output));
  },
  
  // Remove SSH event listeners
  removeAllSshListeners: () => {
    ipcRenderer.removeAllListeners('ssh-connection-status');
    ipcRenderer.removeAllListeners('ssh-command-output');
  },

  // Automated Deployment Control
  startAutomatedDeployment: (authToken: string, businessId: string) => 
    ipcRenderer.invoke('start-automated-deployment', { authToken, businessId }),
  pauseDeployment: () => ipcRenderer.invoke('pause-deployment'),
  resumeDeployment: () => ipcRenderer.invoke('resume-deployment'),
  stopDeployment: () => ipcRenderer.invoke('stop-deployment'),
  retryDeploymentStep: () => ipcRenderer.invoke('retry-deployment-step'),
  getDeploymentStatus: () => ipcRenderer.invoke('get-deployment-status'),
  
  // Deployment event listeners
  onDeploymentStatus: (callback: (status: any) => void) => {
    ipcRenderer.on('deployment-status', (event, status) => callback(status));
  },
  removeDeploymentListeners: () => {
    ipcRenderer.removeAllListeners('deployment-status');
  },

  // Legacy API Integration (deprecated - use automated deployment instead)
  apiInitializeDeployment: (authToken: string, businessId: string) => 
    ipcRenderer.invoke('api-initialize-deployment', { authToken, businessId }),
  apiGetNextStep: (authToken: string, sessionId: string, currentStepId?: string, routerInfo?: any) => 
    ipcRenderer.invoke('api-get-next-step', { authToken, sessionId, currentStepId, routerInfo }),
  apiExecuteStep: (authToken: string, sessionId: string, stepId: string, testResult: any) => 
    ipcRenderer.invoke('api-execute-step', { authToken, sessionId, stepId, testResult })
});
