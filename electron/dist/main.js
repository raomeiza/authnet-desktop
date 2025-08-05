"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
const util_1 = require("util");
const ssh2_1 = require("ssh2");
// SSH Connection Management
let sshConnection = null;
let sshConnectionStatus = {
    connected: false,
    host: '',
    username: '',
    lastActivity: '',
    error: ''
};
let mainWindow;
let port; // Corrected type definition
let serialEnabledWindows = [];
let currentMainUrl = 'https://www.authnet.tech'; // Store the current/last attempted URL
// Function to create the browser window
function createWindow() {
    return __awaiter(this, void 0, void 0, function* () {
        mainWindow = new electron_1.BrowserWindow({
            title: "Authnet Desktop",
            width: 1000,
            height: 800,
            minHeight: 800,
            minWidth: 800,
            webPreferences: {
                preload: path.join(__dirname, 'preload.js'), // Corrected path
                nodeIntegration: false,
                contextIsolation: true // Required for serial communication
            }
        });
        // disable the default menu
        mainWindow.setMenu(null);
        // Handle load failures
        mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
            console.log(`Failed to load URL: ${validatedURL} with error: ${errorDescription}`);
            loadErrorPage(mainWindow, validatedURL, errorDescription);
        });
        // Handle certificate errors
        mainWindow.webContents.on('certificate-error', (event, url, error, certificate, callback) => {
            console.log(`Certificate error for ${url}: ${error}`);
            loadErrorPage(mainWindow, url, `Certificate Error: ${error}`);
            callback(false);
        });
        // Track navigation to update current URL
        mainWindow.webContents.on('will-navigate', (event, navigationUrl) => __awaiter(this, void 0, void 0, function* () {
            currentMainUrl = navigationUrl;
            console.log(`Navigating to: ${navigationUrl}`);
            // Re-inject cookies on navigation to ensure they're always present
            yield injectElectronCookie(mainWindow, navigationUrl);
        }));
        // Track successful page loads to update current URL
        mainWindow.webContents.on('did-navigate', (event, navigationUrl) => {
            currentMainUrl = navigationUrl;
            console.log(`Successfully navigated to: ${navigationUrl}`);
        });
        try {
            const errorPagePath = path.join(__dirname, 'onboard-router.html');
            const pageUrl = `file://${errorPagePath}`;
            // currentMainUrl = 'https://www.authnet.tech'; // Set initial URL
            // // Inject Electron identification cookie before loading the page
            // await injectElectronCookie(mainWindow, currentMainUrl);
            // await mainWindow.loadURL(currentMainUrl);
            yield mainWindow.loadURL(pageUrl);
            serialEnabledWindows.push({ window: mainWindow, url: currentMainUrl });
        }
        catch (error) {
            console.log('Initial load failed:', error);
            loadErrorPage(mainWindow, currentMainUrl, 'Connection failed');
        }
    });
}
// Function to load error page
function loadErrorPage(window, failedUrl, errorMessage) {
    const errorPagePath = path.join(__dirname, 'error-page.html');
    const errorPageUrl = `file://${errorPagePath}?url=${encodeURIComponent(failedUrl)}&error=${encodeURIComponent(errorMessage)}`;
    window.loadURL(errorPageUrl);
}
// Function to inject Electron identification cookie
function injectElectronCookie(window, url) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const urlObj = new URL(url);
            const domain = urlObj.hostname;
            // Set multiple cookies to identify Electron client
            const cookies = [
                {
                    url: url,
                    name: 'electron-client',
                    value: 'true',
                    domain: domain,
                    path: '/',
                    secure: urlObj.protocol === 'https:',
                    httpOnly: false, // Allow client-side access if needed
                    expirationDate: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60) // 1 year
                },
                {
                    url: url,
                    name: 'electron-version',
                    value: process.versions.electron || 'unknown',
                    domain: domain,
                    path: '/',
                    secure: urlObj.protocol === 'https:',
                    httpOnly: false,
                    expirationDate: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60)
                },
                {
                    url: url,
                    name: 'client-platform',
                    value: process.platform,
                    domain: domain,
                    path: '/',
                    secure: urlObj.protocol === 'https:',
                    httpOnly: false,
                    expirationDate: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60)
                }
            ];
            // Inject each cookie
            for (const cookie of cookies) {
                yield window.webContents.session.cookies.set(cookie);
            }
            console.log(`Injected Electron cookies for domain: ${domain}`);
        }
        catch (error) {
            console.log('Failed to inject Electron cookies:', error);
        }
    });
}
// create a flag to track wether we are connected to the serial port
let connected = false;
// Function to list serial ports and find the one matching the ESP32
electron_1.app.whenReady().then(() => {
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0)
            createWindow();
    });
    createWindow();
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin')
        electron_1.app.quit();
});
electron_1.ipcMain.on('create-new-window', (event_1, _a) => __awaiter(void 0, [event_1, _a], void 0, function* (event, { url, width, height, title }) {
    // Check if a window with the same URL already exists
    const existingWindow = serialEnabledWindows.find(win => (win.url === url && !win.window.isDestroyed()));
    if (existingWindow) {
        // Restore, show, and focus on the existing window
        if (existingWindow.window.isMinimized()) {
            existingWindow.window.restore();
        }
        existingWindow.window.show();
        existingWindow.window.focus();
        existingWindow.window.setAlwaysOnTop(true); // Bring to front
        setTimeout(() => {
            existingWindow.window.setAlwaysOnTop(false); // Disable always on top after a short delay
        }, 100);
        existingWindow.window.moveTop(); // Ensure the window is on top
    }
    else {
        // Create a new window
        const newWindow = new electron_1.BrowserWindow({
            width,
            height,
            webPreferences: {
                preload: path.join(__dirname, 'preload.js'),
                contextIsolation: true,
                nodeIntegration: false,
            },
            // frame: false, // Remove default frame
            // if title is provide use it else allow the html document to set the title
            title: title ? title : undefined
        });
        // Disable the default menu
        // Menu.setApplicationMenu(Menu.buildFromTemplate([]));
        newWindow.setMenu(null);
        // Handle load failures for new windows
        newWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
            console.log(`New window failed to load URL: ${validatedURL} with error: ${errorDescription}`);
            loadErrorPage(newWindow, validatedURL, errorDescription);
        });
        // Handle certificate errors for new windows
        newWindow.webContents.on('certificate-error', (event, url, error, certificate, callback) => {
            console.log(`New window certificate error for ${url}: ${error}`);
            loadErrorPage(newWindow, url, `Certificate Error: ${error}`);
            callback(false);
        });
        // Inject Electron cookies for new windows before loading
        yield injectElectronCookie(newWindow, url);
        newWindow.loadURL(url);
        // Store the new window and its URL
        serialEnabledWindows.push({ window: newWindow, url });
        // Bring the window to the front
        newWindow.setAlwaysOnTop(true); // Bring to front
        setTimeout(() => {
            newWindow.setAlwaysOnTop(false); // Disable always on top after a short delay
        }, 100);
        newWindow.moveTop(); // Ensure the window is on top
        // alert the main window that a new window has been created
        mainWindow.webContents.send('new-window', url);
        // Handle window close event to remove it from the list
        newWindow.on('closed', () => {
            const index = serialEnabledWindows.findIndex(win => win.window === newWindow);
            if (index !== -1) {
                serialEnabledWindows.splice(index, 1);
            }
        });
        // Send user data to the new window
        newWindow.webContents.on('did-finish-load', () => {
        });
        // Allow communication with Electron protocols
        newWindow.webContents.on('ipc-message', (event, channel, ...args) => {
            if (channel === 'some-channel') {
                // Handle the message
            }
        });
    }
}));
// lets create a function to close windows given a url
electron_1.ipcMain.on('close-window', (event, url) => {
    if (url === undefined) {
        // the window that triggered the event is the one to be closed
        event.sender.close();
        return;
    }
    const window = serialEnabledWindows.find(win => win.url === url);
    if (window) {
        window.window.close();
        // remove the window from the list
        const index = serialEnabledWindows.findIndex(win => win.url === url);
        if (index !== -1) {
            serialEnabledWindows.splice(index, 1);
        }
        // send a message to the main window that the window has been closed
        mainWindow.webContents.send('window-closed', url);
    }
    else {
    }
});
electron_1.ipcMain.handle('probe-openwrt', () => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // First, check if we're directly connected to a default OpenWrt network
        const networkCheck = yield checkDirectOpenWrtConnection();
        if (!networkCheck.isDirectlyConnected) {
            console.log('Not directly connected to default OpenWrt network:', networkCheck.reason);
            return {
                success: false,
                reason: 'not_directly_connected',
                details: networkCheck
            };
        }
        console.log('Direct OpenWrt network connection confirmed:', networkCheck);
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        // Now probe the router itself
        const response = yield fetch('http://192.168.1.1/cgi-bin/luci', {
            method: 'GET',
            signal: controller.signal,
        });
        clearTimeout(timeout);
        // Extract headers for OpenWrt detection
        const responseHeaders = {};
        response.headers.forEach((value, key) => {
            responseHeaders[key.toLowerCase()] = value;
        });
        // Check for OpenWrt-specific headers that indicate LuCI
        const hasLuciHeaders = responseHeaders['x-luci-login-required'] === 'yes' ||
            ((_a = responseHeaders['server']) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes('luci')) ||
            responseHeaders['x-luci-type'] !== undefined;
        // Accept 200 (normal), 403 (login required), 401 (unauthorized) as valid OpenWrt responses
        const validOpenWrtStatuses = [200, 401, 403];
        if (!validOpenWrtStatuses.includes(response.status)) {
            // If we have LuCI headers but unexpected status, it's still likely OpenWrt
            if (!hasLuciHeaders) {
                return {
                    success: false,
                    reason: 'router_not_accessible',
                    details: {
                        status: response.status,
                        statusText: response.statusText,
                        headers: responseHeaders
                    }
                };
            }
        }
        // Get the response text to analyze content (even for 403/401 responses)
        const htmlContent = yield response.text();
        // Check for OpenWrt-specific indicators in the HTML content
        const openwrtIndicators = [
            'LuCI', // LuCI web interface
            'OpenWrt', // Direct OpenWrt mention
            '/luci-static/', // LuCI static resources path
            'luci.main', // LuCI JavaScript modules
            'uci_', // UCI (Unified Configuration Interface) references
            'openwrt', // OpenWrt in various cases
            'cbi-', // Configuration Binding Interface
            '/cgi-bin/luci', // LuCI CGI path
            'StaticJavaScript', // LuCI's JavaScript loader
            'XHR.poll', // LuCI's polling mechanism
            'luci-theme', // LuCI theme references
            'ubus', // OpenWrt's micro bus system
            'rpcd', // OpenWrt's RPC daemon
            'luci-login', // LuCI login form
            'luci-app-', // LuCI applications
            'x-luci-' // LuCI headers in content
        ];
        // Check for anti-indicators (signs it's NOT OpenWrt)
        const antiIndicators = [
            'Starlink', // Starlink router
            'starlink', // Starlink (lowercase)
            'SpaceX', // SpaceX/Starlink
            'Tesla', // Tesla router interfaces
            'NETGEAR', // Netgear routers
            'Linksys', // Linksys routers
            'TP-Link', // TP-Link routers
            'D-Link', // D-Link routers
            'ASUS', // ASUS routers
            'Mikrotik', // Mikrotik routers
            'Fritz!Box', // AVM Fritz!Box
            'Ubiquiti', // Ubiquiti devices
            'UniFi' // Ubiquiti UniFi
        ];
        // Start with header-based detection
        let isOpenWrt = hasLuciHeaders;
        let detectionMethod = hasLuciHeaders ? 'headers' : 'content_analysis';
        let foundIndicators = [];
        // If we already detected via headers, we're confident it's OpenWrt
        if (hasLuciHeaders) {
            console.log('OpenWrt detected via LuCI headers');
            foundIndicators = ['x-luci-login-required header']; // Indicate header detection
        }
        else {
            // Fall back to content analysis
            console.log('No LuCI headers found, performing content analysis');
            // Check for anti-indicators first (if found, definitely not OpenWrt)
            const hasAntiIndicators = antiIndicators.some(indicator => htmlContent.toLowerCase().includes(indicator.toLowerCase()));
            if (hasAntiIndicators) {
                console.log('Non-OpenWrt device detected based on content analysis');
                return {
                    success: false,
                    reason: 'not_openwrt_router',
                    details: {
                        networkCheck,
                        antiIndicators: antiIndicators.filter(indicator => htmlContent.toLowerCase().includes(indicator.toLowerCase())),
                        responseStatus: response.status,
                        headers: responseHeaders
                    }
                };
            }
            // Count OpenWrt indicators
            foundIndicators = openwrtIndicators.filter(indicator => htmlContent.toLowerCase().includes(indicator.toLowerCase()));
            // Require at least 2 strong indicators to confirm OpenWrt via content
            isOpenWrt = foundIndicators.length >= 2;
            if (isOpenWrt) {
                detectionMethod = 'content_analysis';
                console.log(`OpenWrt detected via content analysis: ${foundIndicators.length} indicators found`);
            }
        }
        // Additional verification: Try to access OpenWrt-specific API endpoint (only if not already confirmed via headers)
        if (isOpenWrt && !hasLuciHeaders) {
            try {
                const apiController = new AbortController();
                const apiTimeout = setTimeout(() => apiController.abort(), 2000);
                const apiResponse = yield fetch('http://192.168.1.1/cgi-bin/luci/rpc/uci?session=00000000000000000000000000000000', {
                    method: 'GET',
                    signal: apiController.signal,
                });
                clearTimeout(apiTimeout);
                // If we get any response (even 403/401), it's likely OpenWrt
                // Other routers typically don't have this endpoint
                const apiExists = apiResponse.status !== 404;
                console.log(`OpenWrt UCI API check: ${apiExists} (status: ${apiResponse.status})`);
                // If API doesn't exist, reduce confidence for content-based detection
                if (!apiExists) {
                    isOpenWrt = foundIndicators.length >= 3; // Require more indicators
                }
            }
            catch (apiError) {
                console.log('UCI API check failed:', apiError);
                // Network error doesn't disqualify, but requires more indicators for content-based detection
                isOpenWrt = foundIndicators.length >= 3;
            }
        }
        console.log(`OpenWrt probe result: ${isOpenWrt} (method: ${detectionMethod})`);
        console.log(`Found ${foundIndicators.length} indicators:`, foundIndicators.slice(0, 5)); // Show first 5
        return {
            success: isOpenWrt,
            reason: isOpenWrt ? 'openwrt_detected' : 'insufficient_openwrt_indicators',
            details: {
                networkCheck,
                foundIndicators,
                indicatorCount: foundIndicators.length,
                detectionMethod,
                responseStatus: response.status,
                hasLuciHeaders,
                headers: hasLuciHeaders ? responseHeaders : undefined
            }
        };
    }
    catch (error) {
        console.log('OpenWrt probe failed:', error);
        return {
            success: false,
            reason: 'probe_failed',
            details: { error: error instanceof Error ? error.message : String(error) }
        };
    }
}));
// Function to check if PC is directly connected to default OpenWrt network
function checkDirectOpenWrtConnection() {
    return __awaiter(this, void 0, void 0, function* () {
        const { exec } = require('child_process');
        const { promisify } = require('util');
        const execAsync = promisify(exec);
        try {
            let networkInfo = {};
            if (process.platform === 'win32') {
                // Windows: Get IP configuration
                const { stdout: ipconfigOutput } = yield execAsync('ipconfig /all');
                const { stdout: routeOutput } = yield execAsync('route print 0.0.0.0');
                networkInfo = parseWindowsNetworkInfo(ipconfigOutput, routeOutput);
            }
            else if (process.platform === 'darwin') {
                // macOS: Get network information
                const { stdout: ifconfigOutput } = yield execAsync('ifconfig');
                const { stdout: routeOutput } = yield execAsync('route get default');
                networkInfo = parseMacOSNetworkInfo(ifconfigOutput, routeOutput);
            }
            else {
                // Linux: Get network information
                const { stdout: ipOutput } = yield execAsync('ip addr show');
                const { stdout: routeOutput } = yield execAsync('ip route show default');
                networkInfo = parseLinuxNetworkInfo(ipOutput, routeOutput);
            }
            // Check if we're in the default OpenWrt IP range
            const isInOpenWrtRange = networkInfo.ipAddress &&
                (networkInfo.ipAddress.startsWith('192.168.1.') &&
                    networkInfo.ipAddress !== '192.168.1.1'); // Not the router itself
            // Check if gateway is default OpenWrt gateway
            const hasOpenWrtGateway = networkInfo.gateway === '192.168.1.1';
            // Check if subnet mask indicates direct connection
            const hasDirectSubnet = networkInfo.subnetMask === '255.255.255.0' ||
                networkInfo.subnetMask === '/24';
            const isDirectlyConnected = isInOpenWrtRange && hasOpenWrtGateway && hasDirectSubnet;
            let reason = '';
            if (!isInOpenWrtRange) {
                reason = `IP address ${networkInfo.ipAddress} not in default OpenWrt range (192.168.1.x)`;
            }
            else if (!hasOpenWrtGateway) {
                reason = `Gateway ${networkInfo.gateway} is not default OpenWrt gateway (192.168.1.1)`;
            }
            else if (!hasDirectSubnet) {
                reason = `Subnet mask ${networkInfo.subnetMask} indicates non-standard network configuration`;
            }
            else {
                reason = 'Direct connection to default OpenWrt network confirmed';
            }
            return {
                isDirectlyConnected,
                reason,
                details: networkInfo
            };
        }
        catch (error) {
            return {
                isDirectlyConnected: false,
                reason: `Failed to check network configuration: ${error instanceof Error ? error.message : String(error)}`,
                details: { error: error instanceof Error ? error.message : String(error) }
            };
        }
    });
}
// Windows network info parser
function parseWindowsNetworkInfo(ipconfigOutput, routeOutput) {
    const networkInfo = {};
    // Find active network adapter with IP in 192.168.1.x range
    const adapterSections = ipconfigOutput.split(/\r?\n\r?\n/);
    for (const section of adapterSections) {
        const ipMatch = section.match(/IPv4 Address[.\s]*:\s*([0-9.]+)/);
        const subnetMatch = section.match(/Subnet Mask[.\s]*:\s*([0-9.]+)/);
        const dhcpMatch = section.match(/DHCP Enabled[.\s]*:\s*(Yes|No)/);
        if (ipMatch && ipMatch[1].startsWith('192.168.1.')) {
            networkInfo.ipAddress = ipMatch[1];
            networkInfo.subnetMask = subnetMatch ? subnetMatch[1] : null;
            networkInfo.dhcpEnabled = dhcpMatch ? dhcpMatch[1] === 'Yes' : false;
            break;
        }
    }
    // Extract default gateway
    const gatewayMatch = routeOutput.match(/0\.0\.0\.0\s+0\.0\.0\.0\s+([0-9.]+)/);
    networkInfo.gateway = gatewayMatch ? gatewayMatch[1] : null;
    return networkInfo;
}
// macOS network info parser
function parseMacOSNetworkInfo(ifconfigOutput, routeOutput) {
    const networkInfo = {};
    // Find interface with IP in 192.168.1.x range
    const interfaces = ifconfigOutput.split(/\n(?=[a-z])/);
    for (const iface of interfaces) {
        const ipMatch = iface.match(/inet\s+([0-9.]+)\s+netmask\s+(0x[a-f0-9]+)/);
        if (ipMatch && ipMatch[1].startsWith('192.168.1.')) {
            networkInfo.ipAddress = ipMatch[1];
            // Convert hex netmask to decimal
            const hexMask = ipMatch[2];
            networkInfo.subnetMask = hexMask === '0xffffff00' ? '255.255.255.0' : hexMask;
            break;
        }
    }
    // Extract default gateway
    const gatewayMatch = routeOutput.match(/gateway:\s*([0-9.]+)/);
    networkInfo.gateway = gatewayMatch ? gatewayMatch[1] : null;
    return networkInfo;
}
// Linux network info parser
function parseLinuxNetworkInfo(ipOutput, routeOutput) {
    const networkInfo = {};
    // Find interface with IP in 192.168.1.x range
    const ipMatch = ipOutput.match(/inet\s+([0-9.]+\/[0-9]+)/);
    if (ipMatch) {
        const [ip, cidr] = ipMatch[1].split('/');
        if (ip.startsWith('192.168.1.')) {
            networkInfo.ipAddress = ip;
            networkInfo.subnetMask = `/${cidr}`;
        }
    }
    // Extract default gateway
    const gatewayMatch = routeOutput.match(/default\s+via\s+([0-9.]+)/);
    networkInfo.gateway = gatewayMatch ? gatewayMatch[1] : null;
    return networkInfo;
}
// Helper function to execute shell commands
const execAsync = (0, util_1.promisify)(child_process_1.exec);
// Check internet connectivity using nslookup
electron_1.ipcMain.handle('check-internet-connectivity', () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const targets = ['google.com', '8.8.8.8', 'cloudflare.com'];
        const results = [];
        for (const target of targets) {
            try {
                const { stdout, stderr } = yield execAsync(`nslookup ${target}`, { timeout: 5000 });
                const success = !stderr && stdout.includes('Address:');
                results.push({
                    target,
                    success,
                    output: success ? stdout : stderr || 'Timeout or no response'
                });
            }
            catch (error) {
                results.push({
                    target,
                    success: false,
                    output: error.message || 'Command failed'
                });
            }
        }
        const overallSuccess = results.some(r => r.success);
        return {
            online: overallSuccess,
            results,
            timestamp: new Date().toISOString()
        };
    }
    catch (error) {
        return {
            online: false,
            results: [],
            error: error.message,
            timestamp: new Date().toISOString()
        };
    }
}));
// SSH Connection Management Functions
function cleanupSshConnection() {
    if (sshConnection) {
        sshConnection.end();
        sshConnection = null;
    }
    sshConnectionStatus = {
        connected: false,
        host: '',
        username: '',
        lastActivity: '',
        error: ''
    };
}
// Establish persistent SSH connection
electron_1.ipcMain.handle('ssh-connect', (event_1, _a) => __awaiter(void 0, [event_1, _a], void 0, function* (event, { host = '192.168.1.1', username = 'root' }) {
    return new Promise((resolve) => {
        // Clean up any existing connection
        cleanupSshConnection();
        sshConnection = new ssh2_1.Client();
        const timeout = setTimeout(() => {
            cleanupSshConnection();
            resolve({
                success: false,
                error: 'Connection timeout (10 seconds)',
                timestamp: new Date().toISOString(),
                requiresReset: true
            });
        }, 10000);
        sshConnection.on('ready', () => {
            clearTimeout(timeout);
            console.log('SSH Connection :: ready and persistent');
            sshConnectionStatus = {
                connected: true,
                host,
                username,
                lastActivity: new Date().toISOString(),
                error: ''
            };
            resolve({
                success: true,
                message: 'SSH connection established successfully',
                connectionInfo: sshConnectionStatus,
                timestamp: new Date().toISOString()
            });
            // Notify renderer of connection status
            if (mainWindow) {
                mainWindow.webContents.send('ssh-connection-status', sshConnectionStatus);
            }
        }).on('error', (err) => {
            clearTimeout(timeout);
            console.log('SSH Connection :: error :: ' + err.message);
            const needsReset = err.message.includes('Authentication failure') ||
                err.message.includes('password') ||
                err.message.includes('auth') ||
                err.message.includes('login');
            sshConnectionStatus.error = err.message;
            resolve({
                success: false,
                error: err.message,
                timestamp: new Date().toISOString(),
                requiresReset: needsReset
            });
        }).on('close', () => {
            console.log('SSH Connection :: closed');
            cleanupSshConnection();
            // Notify renderer of disconnection
            if (mainWindow) {
                mainWindow.webContents.send('ssh-connection-status', sshConnectionStatus);
            }
        }).connect({
            host,
            port: 22,
            username,
            readyTimeout: 5000,
            keepaliveInterval: 5000,
            keepaliveCountMax: 3
        });
    });
}));
// Execute command on existing SSH connection
electron_1.ipcMain.handle('ssh-execute-command', (event_1, _a) => __awaiter(void 0, [event_1, _a], void 0, function* (event, { command }) {
    return new Promise((resolve) => {
        if (!sshConnection || !sshConnectionStatus.connected) {
            resolve({
                success: false,
                error: 'No active SSH connection. Please connect first.',
                output: '',
                timestamp: new Date().toISOString()
            });
            return;
        }
        let output = '';
        let errorOutput = '';
        const timeout = setTimeout(() => {
            resolve({
                success: false,
                error: 'Command execution timeout (30 seconds)',
                output: output.trim(),
                timestamp: new Date().toISOString()
            });
        }, 30000);
        sshConnection.exec(command, (err, stream) => {
            if (err) {
                clearTimeout(timeout);
                resolve({
                    success: false,
                    error: err.message,
                    output: '',
                    timestamp: new Date().toISOString()
                });
                return;
            }
            stream.on('close', (code, signal) => {
                clearTimeout(timeout);
                console.log(`SSH Command :: close :: code: ${code}, signal: ${signal}`);
                sshConnectionStatus.lastActivity = new Date().toISOString();
                resolve({
                    success: code === 0,
                    output: output.trim(),
                    error: errorOutput.trim() || (code !== 0 ? `Command exited with code ${code}` : ''),
                    exitCode: code,
                    command,
                    timestamp: new Date().toISOString()
                });
            }).on('data', (data) => {
                const dataStr = data.toString();
                console.log('SSH STDOUT: ' + dataStr);
                output += dataStr;
                // Send real-time output to renderer
                if (mainWindow) {
                    mainWindow.webContents.send('ssh-command-output', {
                        type: 'stdout',
                        data: dataStr,
                        timestamp: new Date().toISOString()
                    });
                }
            }).stderr.on('data', (data) => {
                const dataStr = data.toString();
                console.log('SSH STDERR: ' + dataStr);
                errorOutput += dataStr;
                // Send real-time error output to renderer
                if (mainWindow) {
                    mainWindow.webContents.send('ssh-command-output', {
                        type: 'stderr',
                        data: dataStr,
                        timestamp: new Date().toISOString()
                    });
                }
            });
        });
    });
}));
// Get SSH connection status
electron_1.ipcMain.handle('ssh-get-status', () => __awaiter(void 0, void 0, void 0, function* () {
    return Object.assign(Object.assign({}, sshConnectionStatus), { timestamp: new Date().toISOString() });
}));
// Close SSH connection
electron_1.ipcMain.handle('ssh-disconnect', () => __awaiter(void 0, void 0, void 0, function* () {
    if (sshConnection) {
        cleanupSshConnection();
        return {
            success: true,
            message: 'SSH connection closed',
            timestamp: new Date().toISOString()
        };
    }
    else {
        return {
            success: false,
            message: 'No active SSH connection',
            timestamp: new Date().toISOString()
        };
    }
}));
// Legacy SSH functions for backward compatibility
// SSH into router function (for default OpenWrt - no password required)
electron_1.ipcMain.handle('ssh-to-router', (event_1, _a) => __awaiter(void 0, [event_1, _a], void 0, function* (event, { host = '192.168.1.1', username = 'root', command = 'uname -a' }) {
    return new Promise((resolve) => {
        const conn = new ssh2_1.Client();
        let output = '';
        let errorOutput = '';
        const timeout = setTimeout(() => {
            conn.end();
            resolve({
                success: false,
                error: 'Connection timeout (10 seconds)',
                output: '',
                timestamp: new Date().toISOString(),
                requiresReset: true
            });
        }, 10000);
        conn.on('ready', () => {
            clearTimeout(timeout);
            console.log('SSH Client :: ready');
            conn.exec(command, (err, stream) => {
                if (err) {
                    conn.end();
                    resolve({
                        success: false,
                        error: err.message,
                        output: '',
                        timestamp: new Date().toISOString(),
                        requiresReset: false
                    });
                    return;
                }
                stream.on('close', (code, signal) => {
                    console.log('SSH Stream :: close :: code: ' + code + ', signal: ' + signal);
                    conn.end();
                    resolve({
                        success: code === 0,
                        output: output.trim(),
                        error: errorOutput.trim() || (code !== 0 ? `Command exited with code ${code}` : ''),
                        exitCode: code,
                        timestamp: new Date().toISOString(),
                        requiresReset: false
                    });
                }).on('data', (data) => {
                    console.log('SSH STDOUT: ' + data);
                    output += data.toString();
                }).stderr.on('data', (data) => {
                    console.log('SSH STDERR: ' + data);
                    errorOutput += data.toString();
                });
            });
        }).on('error', (err) => {
            clearTimeout(timeout);
            console.log('SSH Connection :: error :: ' + err.message);
            // Determine if this error suggests router needs reset
            const needsReset = err.message.includes('Authentication failure') ||
                err.message.includes('password') ||
                err.message.includes('auth') ||
                err.message.includes('login');
            resolve({
                success: false,
                error: err.message,
                output: '',
                timestamp: new Date().toISOString(),
                requiresReset: needsReset
            });
        }).connect({
            host,
            port: 22,
            username,
            // No password - default OpenWrt allows root login without password
            readyTimeout: 5000,
            keepaliveInterval: 1000
        });
    });
}));
// Test SSH connection (just check if we can connect to default OpenWrt)
electron_1.ipcMain.handle('test-ssh-connection', (event_1, _a) => __awaiter(void 0, [event_1, _a], void 0, function* (event, { host = '192.168.1.1', username = 'root' }) {
    return new Promise((resolve) => {
        const conn = new ssh2_1.Client();
        const timeout = setTimeout(() => {
            conn.end();
            resolve({
                success: false,
                error: 'Connection timeout (5 seconds)',
                timestamp: new Date().toISOString(),
                requiresReset: true
            });
        }, 5000);
        conn.on('ready', () => {
            clearTimeout(timeout);
            console.log('SSH Test :: ready');
            conn.end();
            resolve({
                success: true,
                message: 'SSH connection successful - Default OpenWrt configuration detected',
                timestamp: new Date().toISOString(),
                requiresReset: false
            });
        }).on('error', (err) => {
            clearTimeout(timeout);
            console.log('SSH Test :: error :: ' + err.message);
            // Determine if this error suggests router needs reset
            const needsReset = err.message.includes('Authentication failure') ||
                err.message.includes('password') ||
                err.message.includes('auth') ||
                err.message.includes('login') ||
                err.message.includes('Connection refused');
            resolve({
                success: false,
                error: err.message,
                timestamp: new Date().toISOString(),
                requiresReset: needsReset
            });
        }).connect({
            host,
            port: 22,
            username,
            // No password - default OpenWrt allows root login without password
            readyTimeout: 3000
        });
    });
}));
// Handle retry connection
electron_1.ipcMain.on('retry-connection', (event, url) => __awaiter(void 0, void 0, void 0, function* () {
    const sender = event.sender;
    // Find which window sent the request
    if (sender === (mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.webContents)) {
        // 
        console.log(`Retrying main window connection to: ${url}`);
        // Re-inject cookies before retry
        yield injectElectronCookie(mainWindow, url);
        mainWindow.loadURL(url).catch(error => {
            console.log('Main window retry connection failed:', error);
            loadErrorPage(mainWindow, url, 'Connection failed');
        });
    }
    else {
        // Find the window in serialEnabledWindows
        const windowInfo = serialEnabledWindows.find(win => win.window.webContents === sender);
        if (windowInfo) {
            const url = windowInfo.url;
            console.log(`Retrying window connection to: ${url}`);
            // Re-inject cookies before retry
            yield injectElectronCookie(windowInfo.window, url);
            windowInfo.window.loadURL(url).catch(error => {
                console.log('Window retry connection failed:', error);
                loadErrorPage(windowInfo.window, url, 'Connection failed');
            });
        }
    }
}));
// Handle getting current URL for any window
electron_1.ipcMain.handle('get-current-url', (event) => {
    const sender = event.sender;
    if (sender === (mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.webContents)) {
        return currentMainUrl;
    }
    else {
        const windowInfo = serialEnabledWindows.find(win => win.window.webContents === sender);
        return windowInfo ? windowInfo.url : '';
    }
});
// Handle open settings
electron_1.ipcMain.on('open-settings', () => {
    // Create a simple settings dialog
    electron_1.dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'Settings',
        message: 'Settings',
        detail: 'Network settings and configuration options will be available in future versions.',
        buttons: ['OK']
    });
});
// Handle exit app
electron_1.ipcMain.on('exit-app', () => {
    electron_1.app.quit();
});
// API Integration for Automated Router Onboarding
const API_BASE_URL = 'https://api.authnet.tech';
// Initialize deployment session with API server
electron_1.ipcMain.handle('api-initialize-deployment', (event_1, _a) => __awaiter(void 0, [event_1, _a], void 0, function* (event, { authToken, businessId }) {
    try {
        const response = yield fetch(`${API_BASE_URL}/onboard/initialize`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': authToken
            },
            body: JSON.stringify({ businessId })
        });
        const data = yield response.json();
        if (!response.ok) {
            throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
        }
        return {
            success: true,
            data
        };
    }
    catch (error) {
        console.error('API Initialize deployment failed:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error)
        };
    }
}));
// Get next step from API server
electron_1.ipcMain.handle('api-get-next-step', (event_1, _a) => __awaiter(void 0, [event_1, _a], void 0, function* (event, { authToken, sessionId, currentStepId, routerInfo }) {
    try {
        const response = yield fetch(`${API_BASE_URL}/onboard/get-next-step`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': authToken
            },
            body: JSON.stringify({
                sessionId,
                currentStepId,
                routerInfo
            })
        });
        const data = yield response.json();
        if (!response.ok) {
            throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
        }
        return {
            success: true,
            data
        };
    }
    catch (error) {
        console.error('API Get next step failed:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error)
        };
    }
}));
// Submit step execution result to API server
electron_1.ipcMain.handle('api-execute-step', (event_1, _a) => __awaiter(void 0, [event_1, _a], void 0, function* (event, { authToken, sessionId, stepId, testResult }) {
    try {
        const response = yield fetch(`${API_BASE_URL}/onboard/execute-step`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': authToken
            },
            body: JSON.stringify({
                sessionId,
                stepId,
                testResult
            })
        });
        const data = yield response.json();
        if (!response.ok) {
            throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
        }
        return {
            success: true,
            data
        };
    }
    catch (error) {
        console.error('API Execute step failed:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error)
        };
    }
}));
