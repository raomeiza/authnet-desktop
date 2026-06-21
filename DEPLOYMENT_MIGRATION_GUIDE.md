# Automated Deployment System - Migration Guide

## Overview

The Authnet Desktop application has been redesigned to move API server command execution from the frontend to the main Electron process. This provides better security, reliability, and centralized control over the deployment process.

## Key Changes

### 1. **Centralized Command Execution**
- All API server commands now execute in the main Electron process (`main.ts`)
- SSH commands are executed by the main process, not the frontend
- Real-time progress updates are sent to the UI via IPC events

### 2. **New Deployment Control System**
The application now provides high-level deployment controls:

#### **Main Controls (Available to UI)**
- `startAutomatedDeployment(authToken, businessId)` - Start a new deployment
- `pauseDeployment()` - Pause the current deployment
- `resumeDeployment()` - Resume a paused deployment  
- `stopDeployment()` - Stop the current deployment
- `retryDeploymentStep()` - Retry the current failed step
- `getDeploymentStatus()` - Get current deployment status

#### **SSH Connection Controls (Available to UI)**
- `sshConnect({ host, username })` - Establish SSH connection
- `sshDisconnect()` - Close SSH connection
- `sshGetStatus()` - Get SSH connection status

### 3. **Event-Driven UI Updates**
The UI receives real-time updates via these events:
- `deployment-status` - Deployment progress and status changes
- `ssh-connection-status` - SSH connection state changes
- `ssh-command-output` - Real-time command output (for debugging)

## New Architecture

```
┌─────────────────┐    IPC Events    ┌──────────────────┐
│                 │ ──────────────── │                  │
│   Frontend UI   │                  │  Main Process    │
│                 │ ──────────────── │                  │
└─────────────────┘                  └──────────────────┘
        │                                       │
        │ User Controls:                        │ Automated:
        │ - Start Deployment                    │ - API Calls
        │ - Pause/Resume                        │ - SSH Commands  
        │ - Stop/Retry                          │ - Step Execution
        │ - SSH Connect/Disconnect              │ - Progress Tracking
        │                                       │
        └─── Status Updates ←─────────────────────
```

## Migration Steps

### 1. **Update Frontend Code**

**Old Way (Frontend manages everything):**
```javascript
// ❌ OLD - Frontend directly manages API calls and SSH
const initResult = await window.electronAPI.apiInitializeDeployment(authToken, businessId);
const stepResult = await window.electronAPI.apiGetNextStep(authToken, sessionId);
const commandResult = await window.electronAPI.sshExecuteCommand({ command: step.command });
const validationResult = await window.electronAPI.apiExecuteStep(authToken, sessionId, stepId, testResult);
```

**New Way (Frontend controls deployment, main process executes):**
```javascript
// ✅ NEW - Frontend controls deployment, main process handles execution
await window.electronAPI.startAutomatedDeployment(authToken, businessId);

// Listen for progress updates
window.electronAPI.onDeploymentStatus((status) => {
    switch (status.type) {
        case 'step-started':
            updateUI(`Executing: ${status.stepTitle}`);
            break;
        case 'step-completed':
            updateUI(`Completed: Step ${status.currentStep}`);
            break;
        case 'completed':
            updateUI('🎉 Deployment finished!');
            break;
        case 'failed':
            updateUI(`❌ Failed: ${status.error}`);
            break;
    }
});
```

### 2. **Available Deployment Events**

The UI will receive these event types via `onDeploymentStatus`:

- `started` - Deployment has begun
- `step-started` - A new step is starting
- `executing-command` - Currently executing a command
- `step-completed` - A step finished successfully
- `step-retrying` - A step is being retried
- `completed` - All steps completed successfully
- `failed` - Deployment failed
- `paused` - Deployment was paused
- `resumed` - Deployment was resumed
- `stopped` - Deployment was stopped by user

### 3. **Error Handling**

The new system provides better error handling:
- Automatic retries for transient failures
- Detailed error reporting
- User can manually retry failed steps
- SSH connection monitoring and recovery

### 4. **Sample UI Implementation**

See `onboard-router-automated.html` for a complete example of how to:
- Control SSH connections
- Start and manage deployments
- Display real-time progress
- Handle all deployment states
- Show deployment history

## Benefits

### **For Users**
- ✅ More reliable deployments
- ✅ Better error handling and recovery
- ✅ Clear progress tracking
- ✅ Easy pause/resume/retry controls

### **For Developers**
- ✅ Cleaner separation of concerns
- ✅ Better security (API tokens in main process)
- ✅ Easier testing and debugging
- ✅ Consistent state management

### **For Operations**
- ✅ Centralized logging
- ✅ Better monitoring capabilities
- ✅ Automated retry logic
- ✅ Graceful error recovery

## Backward Compatibility

The old API methods are still available but marked as deprecated:
- `apiInitializeDeployment()` - Use `startAutomatedDeployment()` instead
- `apiGetNextStep()` - Now handled automatically
- `apiExecuteStep()` - Now handled automatically

These will be removed in a future version.

## Implementation Details

### **Main Process (`main.ts`)**
- Manages deployment state
- Executes API calls to server
- Runs SSH commands
- Handles retries and error recovery
- Sends progress updates to UI

### **Preload Script (`preload.ts`)**
- Exposes new deployment control functions
- Sets up event listeners for status updates
- Maintains backward compatibility

### **Frontend (`onboard-router-automated.html`)**
- Provides deployment controls
- Displays real-time progress
- Handles user interactions
- Shows deployment history

## Testing

To test the new system:

1. **Start the application**
2. **Connect SSH** - Click "Connect" to establish SSH connection to router
3. **Enter credentials** - Provide auth token and business ID
4. **Start deployment** - Click "Start Deployment"
5. **Monitor progress** - Watch real-time progress and step execution
6. **Test controls** - Try pause/resume/stop during deployment

## Build Notes

Windows packaging has two build modes:

- `npm run build:app` - safe default for this workstation. It packages without executable resource editing, so it avoids the Windows symlink privilege error from `winCodeSign`.
- `npm run build:app:full` - full packaging path. Use this when Windows Developer Mode is enabled or the terminal is elevated, so `electron-builder` can unpack `winCodeSign` and stamp the executable icon.

If a build was interrupted or the cache looks stale, clear the builder cache before retrying:

```powershell
Remove-Item -Recurse -Force "$env:LOCALAPPDATA\electron-builder\Cache\winCodeSign"
```

If Windows still shows an old icon after a successful build, uninstall the old app or clear the pinned shortcut before reinstalling. Windows can cache executable icons aggressively.

## Troubleshooting

### **Common Issues**

1. **SSH Connection Failed**
   - Check router is accessible at 192.168.1.1
   - Ensure default OpenWrt configuration (no password)
   - Try the "Retry Connection" feature

2. **Deployment Won't Start**
   - Verify SSH is connected first
   - Check auth token and business ID are valid
   - Check network connectivity to API server

3. **Step Failures**
   - Use "Retry Step" button for transient failures
   - Check SSH connection stability
   - Review step command in deployment history

### **Debugging**

Enable detailed logging by checking the Electron developer console:
- All SSH commands and outputs are logged
- API calls and responses are logged
- Deployment state changes are logged

## Future Enhancements

Planned improvements include:
- Deployment templates and presets
- Offline deployment support
- Advanced retry strategies
- Deployment rollback capabilities
- Multi-router batch deployments
