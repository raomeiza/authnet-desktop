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
let onboardWindow = null; // For onboarding window
let port; // Corrected type definition
let serialEnabledWindows = [];
let currentMainUrl = 'https://www.authnetworks.com'; // Store the current/last attempted URL
const defaultRouterIPs = ['192.168.1.1', '192.168.2.1', "172.31.0.1"];
let currentRouterIP = null; // Deprecated: No longer used for caching, detection is always fresh
// Resolve app icon path for both dev and packaged builds.
const getAppIconPath = () => {
    if (electron_1.app.isPackaged) {
        return path.join(process.resourcesPath, 'assets', 'icons', 'win', 'app-icon.ico');
    }
    return path.resolve(__dirname, '../../assets/icons/win/app-icon.ico');
};
// Helper function to get supported network ranges message
const getSupportedNetworkRanges = () => {
    const ranges = defaultRouterIPs.map(ip => ip.substring(0, ip.lastIndexOf('.')) + '.x');
    return ranges.slice(0, -1).join(', ') + (ranges.length > 1 ? ', or ' + ranges[ranges.length - 1] : '');
};
// Helper function to convert IP to numeric value for subnet calculations
function ipToNumber(ip) {
    return ip.split('.').reduce((sum, octet) => (sum << 8) + parseInt(octet, 10), 0) >>> 0;
}
// Helper function to check if an IP is in a subnet
function isIpInSubnet(ip, networkAddr, subnetMask) {
    const ipNum = ipToNumber(ip);
    const networkNum = ipToNumber(networkAddr);
    const maskNum = ipToNumber(subnetMask);
    return (ipNum & maskNum) === (networkNum & maskNum);
}
// Function to detect which router IP is accessible based on network configuration
function detectRouterIP() {
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
            // Check if device is connected to any of our target IP ranges
            if (networkInfo.ipAddress && networkInfo.subnetMask) {
                for (const routerIP of defaultRouterIPs) {
                    // For 172.31.0.1, use 255.255.252.0 subnet mask
                    const subnetMask = routerIP.startsWith('172.31.') ? '255.255.252.0' : '255.255.255.0';
                    if (isIpInSubnet(networkInfo.ipAddress, routerIP, subnetMask) &&
                        networkInfo.ipAddress !== routerIP) {
                        console.log(`Device IP ${networkInfo.ipAddress} indicates router IP should be: ${routerIP}`);
                        console.log(`Subnet mask used: ${subnetMask}`);
                        return routerIP; // Return directly, don't cache globally
                    }
                }
            }
            // If we reach here, device is not connected to any target network
            console.log(`Device IP ${networkInfo.ipAddress} is not in target ranges (${getSupportedNetworkRanges()})`);
            return null;
        }
        catch (error) {
            console.log('Router IP detection failed:', error);
            return null;
        }
    });
}
// Function to create the browser window
function createWindow() {
    return __awaiter(this, void 0, void 0, function* () {
        mainWindow = new electron_1.BrowserWindow({
            title: "Authnet Desktop",
            width: 1000,
            height: 800,
            minHeight: 800,
            minWidth: 800,
            icon: getAppIconPath(),
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
            currentMainUrl = 'https://www.authnetworks.com'; // Set initial URL
            // Load the main website (onboard page opened via createOnboardWindow)
            yield mainWindow.loadURL(currentMainUrl);
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
            icon: getAppIconPath(),
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
electron_1.ipcMain.on('create-onboard-window', (event_1, _a) => __awaiter(void 0, [event_1, _a], void 0, function* (event, { url, width, height, title }) {
    // In development mode, redirect to local file with query parameters preserved
    // In production mode, use the remote URL from the cloud
    let actualUrl = url;
    const isDevelopment = !electron_1.app.isPackaged; // true in dev, false in production
    if (isDevelopment && url && url.includes('/onboard-router.html')) {
        const localPath = path.join(__dirname, 'onboard-router.html');
        // Preserve query parameters from the original URL
        const urlObj = new URL(url);
        const queryParams = urlObj.search; // Gets the full query string including '?'
        actualUrl = `file://${localPath}${queryParams}`;
        console.log('[MAIN] [DEV MODE] Redirecting remote onboard URL to local file');
        console.log('[MAIN] Original URL:', url);
        console.log('[MAIN] Local URL with params:', actualUrl);
    }
    else if (!isDevelopment) {
        console.log('[MAIN] [PRODUCTION MODE] Using remote onboard URL:', url);
    }
    // Check if a window with the same URL already exists
    const existingWindow = serialEnabledWindows.find(win => (win.url === actualUrl && !win.window.isDestroyed()));
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
            icon: getAppIconPath(),
            webPreferences: {
                preload: path.join(__dirname, 'preload.js'),
                contextIsolation: true,
                nodeIntegration: false,
            },
            // frame: false, // Remove default frame
            // if title is provide use it else allow the html document to set the title
            title: title ? title : undefined
        });
        // Disable the default menu if not in development mode
        if (!isDevelopment)
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
        // Skip cookie injection for file:// URLs
        if (!actualUrl.startsWith('file://')) {
            yield injectElectronCookie(newWindow, actualUrl);
        }
        // set the window as the onboarding window
        onboardWindow = newWindow;
        console.log('[MAIN] Loading onboard window URL:', actualUrl);
        // Load the URL in the new window
        yield newWindow.loadURL(actualUrl);
        console.log('[MAIN] Onboard window URL loaded successfully');
        // Open DevTools only in development mode
        if (isDevelopment) {
            newWindow.webContents.openDevTools();
        }
        // Store the new window and its URL
        serialEnabledWindows.push({ window: newWindow, url: actualUrl });
        // Bring the window to the front
        newWindow.setAlwaysOnTop(true); // Bring to front
        setTimeout(() => {
            newWindow.setAlwaysOnTop(false); // Disable always on top after a short delay
        }, 100);
        newWindow.moveTop(); // Ensure the window is on top
        // alert the main window that a new window has been created
        mainWindow.webContents.send('new-window', actualUrl);
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
        // Get the detected router IP (always fresh detection)
        const routerIP = yield detectRouterIP(); // Always detect fresh instead of using cached
        console.log(`Probing OpenWrt at: ${routerIP}`);
        // Now probe the router itself
        const response = yield fetch(`http://${routerIP}/cgi-bin/luci`, {
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
                const apiResponse = yield fetch(`http://${routerIP}/cgi-bin/luci/rpc/uci?session=00000000000000000000000000000000`, {
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
            // Check if we're in any of the default OpenWrt IP ranges
            let isInOpenWrtRange = false;
            let expectedRouterIP = '';
            if (networkInfo.ipAddress) {
                for (const routerIP of defaultRouterIPs) {
                    const ipRange = routerIP.substring(0, routerIP.lastIndexOf('.'));
                    if (networkInfo.ipAddress.startsWith(ipRange + '.') &&
                        networkInfo.ipAddress !== routerIP) {
                        isInOpenWrtRange = true;
                        expectedRouterIP = routerIP;
                        break;
                    }
                }
            }
            // Check if gateway matches the expected router IP for this range
            const hasOpenWrtGateway = networkInfo.gateway === expectedRouterIP;
            // Check if subnet mask indicates direct connection
            const hasDirectSubnet = networkInfo.subnetMask === '255.255.255.0' ||
                networkInfo.subnetMask === '/24';
            const isDirectlyConnected = isInOpenWrtRange && hasOpenWrtGateway && hasDirectSubnet;
            let reason = '';
            if (!isInOpenWrtRange) {
                const ranges = defaultRouterIPs.map(ip => ip.substring(0, ip.lastIndexOf('.')) + '.x').join(' or ');
                reason = `IP address ${networkInfo.ipAddress} not in default OpenWrt ranges (${ranges})`;
            }
            else if (!hasOpenWrtGateway) {
                reason = `Gateway ${networkInfo.gateway} is not expected OpenWrt gateway (${expectedRouterIP})`;
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
    // Find active network adapter with IP
    const adapterSections = ipconfigOutput.split(/\r?\n\r?\n/);
    for (const section of adapterSections) {
        const ipMatch = section.match(/IPv4 Address[.\s]*:\s*([0-9.]+)/);
        const subnetMatch = section.match(/Subnet Mask[.\s]*:\s*([0-9.]+)/);
        // Only process sections that have both IP and subnet mask
        if (ipMatch && subnetMatch) {
            networkInfo.ipAddress = ipMatch[1];
            networkInfo.subnetMask = subnetMatch[1];
            networkInfo.dhcpEnabled = section.includes('DHCP Enabled. . . . . . . . . . . : Yes');
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
    // Find interface with IP in target ranges
    const interfaces = ifconfigOutput.split(/\n(?=[a-z])/);
    for (const iface of interfaces) {
        const ipMatch = iface.match(/inet\s+([0-9.]+)\s+netmask\s+(0x[a-f0-9]+)/);
        if (ipMatch) {
            // Check if IP is in any of our target ranges
            const ip = ipMatch[1];
            for (const routerIP of defaultRouterIPs) {
                const ipRange = routerIP.substring(0, routerIP.lastIndexOf('.'));
                if (ip.startsWith(ipRange + '.')) {
                    networkInfo.ipAddress = ip;
                    // Convert hex netmask to decimal
                    const hexMask = ipMatch[2];
                    networkInfo.subnetMask = hexMask === '0xffffff00' ? '255.255.255.0' : hexMask;
                    break;
                }
            }
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
    // Find interface with IP in target ranges
    const ipMatches = ipOutput.match(/inet\s+([0-9.]+\/[0-9]+)/g);
    if (ipMatches) {
        for (const match of ipMatches) {
            const ipMatch = match.match(/inet\s+([0-9.]+\/[0-9]+)/);
            if (ipMatch) {
                const [ip, cidr] = ipMatch[1].split('/');
                // Check if IP is in any of our target ranges
                for (const routerIP of defaultRouterIPs) {
                    const ipRange = routerIP.substring(0, routerIP.lastIndexOf('.'));
                    if (ip.startsWith(ipRange + '.')) {
                        networkInfo.ipAddress = ip;
                        networkInfo.subnetMask = `/${cidr}`;
                        break;
                    }
                }
            }
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
function establishSSHConnection(host, username) {
    console.log('[MAIN] ssh-connect IPC handler called with:', { host, username });
    username = username || 'root';
    return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
        // Clean up any existing connection
        cleanupSshConnection();
        let connectionHost = host || null;
        // If no host provided, detect the router IP based on device network (always fresh detection)
        if (!connectionHost) {
            console.log('[MAIN] No host specified, performing fresh router IP detection based on current device network...');
            connectionHost = yield detectRouterIP(); // Always detect fresh instead of using cached
            console.log('[MAIN] Detected router IP:', connectionHost);
            if (!connectionHost) {
                resolve({
                    success: false,
                    error: `Device is not connected to a supported OpenWrt network (${getSupportedNetworkRanges()})`,
                    timestamp: new Date().toISOString(),
                    requiresReset: false
                });
                return;
            }
        }
        console.log(`SSH connecting to: ${connectionHost}`);
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
                host: connectionHost,
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
            if (onboardWindow) {
                onboardWindow.webContents.send('ssh-connection-status', sshConnectionStatus);
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
        }).on('close', () => __awaiter(this, void 0, void 0, function* () {
            console.log('SSH Connection :: closed');
            // Check if this is an expected disconnection during IP change
            if (deploymentState.expectingReconnect) {
                console.log('Expected SSH close during step with reconnect_on_sshClose flag');
                // Don't cleanup connection or send error notification
                // The executeNextDeploymentStep will handle reconnection
                return;
            }
            // Check if we should attempt automatic reconnection
            const currentStep = deploymentState.currentStep;
            const isLastStep = deploymentState.currentStepIndex === deploymentState.stepSummaries.length - 1;
            if (currentStep && currentStep.reconnect_on_sshClose && !isLastStep && !deploymentState.isAttemptingReconnect) {
                console.log('SSH disconnected during step with reconnect_on_sshClose flag. Attempting automatic reconnection...');
                deploymentState.isAttemptingReconnect = true;
                // Wait for the specified timeout or default 3 seconds
                const waitTime = currentStep.timeout || 3000;
                console.log(`Waiting ${waitTime}ms before attempting reconnection...`);
                yield new Promise(resolve => setTimeout(resolve, waitTime));
                // Attempt to reestablish connection
                const reconnectResult = yield establishSSHConnection();
                deploymentState.isAttemptingReconnect = false;
                if (reconnectResult.success) {
                    console.log('Successfully reestablished SSH connection. Continuing deployment...');
                    // Connection restored, execution will continue normally
                    return;
                }
                else {
                    console.error('Failed to reestablish SSH connection:', reconnectResult.error);
                    // Fall through to normal cleanup and notification
                }
            }
            // Normal unexpected disconnection - cleanup and notify
            cleanupSshConnection();
            // Notify renderer of disconnection
            if (onboardWindow) {
                onboardWindow.webContents.send('ssh-connection-status', sshConnectionStatus);
            }
        })).connect({
            host: connectionHost,
            port: 22,
            username,
            readyTimeout: 5000,
            keepaliveInterval: 5000,
            keepaliveCountMax: 3
        });
    }));
}
// Establish persistent SSH connection
electron_1.ipcMain.handle('ssh-connect', (event_1, ...args_1) => __awaiter(void 0, [event_1, ...args_1], void 0, function* (event, { host, username = 'root' } = {}) {
    return establishSSHConnection(host, username);
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
                if (onboardWindow) {
                    onboardWindow.webContents.send('ssh-command-output', {
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
                if (onboardWindow) {
                    onboardWindow.webContents.send('ssh-command-output', {
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
electron_1.ipcMain.handle('ssh-to-router', (event_1, _a) => __awaiter(void 0, [event_1, _a], void 0, function* (event, { host, username = 'root', command = 'uname -a' }) {
    return new Promise((resolve) => __awaiter(void 0, void 0, void 0, function* () {
        let connectionHost = host;
        // If no host provided, detect the router IP based on device network (always fresh detection)
        if (!connectionHost) {
            console.log('SSH to router - no host specified, performing fresh router IP detection based on current device network...');
            connectionHost = yield detectRouterIP(); // Always detect fresh instead of using cached
            if (!connectionHost) {
                resolve({
                    success: false,
                    error: `Device is not connected to a supported OpenWrt network (${getSupportedNetworkRanges()})`,
                    output: '',
                    timestamp: new Date().toISOString(),
                    requiresReset: false
                });
                return;
            }
        }
        console.log(`SSH to router: ${connectionHost}`);
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
            host: connectionHost,
            port: 22,
            username,
            // No password - default OpenWrt allows root login without password
            readyTimeout: 5000,
            keepaliveInterval: 1000
        });
    }));
}));
// Test SSH connection (just check if we can connect to default OpenWrt)
electron_1.ipcMain.handle('test-ssh-connection', (event_1, _a) => __awaiter(void 0, [event_1, _a], void 0, function* (event, { host, username = 'root' }) {
    return new Promise((resolve) => __awaiter(void 0, void 0, void 0, function* () {
        let connectionHost = host;
        // If no host provided, detect the router IP based on device network (always fresh detection)
        if (!connectionHost) {
            console.log('Testing SSH - no host specified, performing fresh router IP detection based on current device network...');
            connectionHost = yield detectRouterIP(); // Always detect fresh instead of using cached
            if (!connectionHost) {
                resolve({
                    success: false,
                    error: `Device is not connected to a supported OpenWrt network (${getSupportedNetworkRanges()})`,
                    timestamp: new Date().toISOString(),
                    requiresReset: false
                });
                return;
            }
        }
        console.log(`Testing SSH connection to: ${connectionHost}`);
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
                message: `SSH connection successful - Default OpenWrt configuration detected at ${connectionHost}`,
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
            host: connectionHost,
            port: 22,
            username,
            // No password - default OpenWrt allows root login without password
            readyTimeout: 3000
        });
    }));
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
// Handle open external URL in default browser
electron_1.ipcMain.handle('open-external', (event, url) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield electron_1.shell.openExternal(url);
        return { success: true };
    }
    catch (error) {
        console.error('Failed to open external URL:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error)
        };
    }
}));
// API Integration for Automated Router Onboarding
const API_BASE_URL = 'https://api.authnetworks.com';
// Check for IP conflicts on the router and attempt to resolve them via SSH.
function checkAndResolveIpConflict() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const reconnectTimeout = 5000;
        const reconnectRetries = 3;
        try {
            // If device is already on an adopted 172.31 network, skip conflict resolution.
            try {
                const probe = yield checkDirectOpenWrtConnection();
                const gw = ((_a = probe === null || probe === void 0 ? void 0 : probe.details) === null || _a === void 0 ? void 0 : _a.gateway) || null;
                if (gw && typeof gw === 'string' && gw.startsWith('172.31')) {
                    console.log('[MAIN] Detected adopted network gateway', gw, '— skipping IP conflict check');
                    return { success: true, output: `skipped for gateway ${gw}` };
                }
            }
            catch (probeErr) {
                console.warn('[MAIN] Network probe failed, proceeding with IP check:', probeErr);
            }
            // Ensure SSH connection to router (use default root, no password)
            const conn = yield establishSSHConnection();
            if (!conn.success) {
                return { success: false, error: conn.error || 'SSH connect failed' };
            }
            const script = `
        CURRENT_LAN_IP=$(uci get network.lan.ipaddr 2>/dev/null || echo "192.168.1.1")
        UPSTREAM_GW=$(ip route show default 2>/dev/null | awk '/default/ {print $3}' | head -n1)
        if [ -z "$UPSTREAM_GW" ]; then
          UPSTREAM_GW=$(uci get network.wan.gateway 2>/dev/null || echo "")
        fi
        if [ -z "$UPSTREAM_GW" ]; then
          UPSTREAM_GW=$(route -n 2>/dev/null | awk '/^0.0.0.0/ {print $2}' | head -n1)
        fi
        CURRENT_SUBNET=$(echo "$CURRENT_LAN_IP" | cut -d. -f1-3)
        UPSTREAM_SUBNET=$(echo "$UPSTREAM_GW" | cut -d. -f1-3)
        CONFLICT=0
        if [ -n "$UPSTREAM_GW" ] && [ "$CURRENT_SUBNET" = "$UPSTREAM_SUBNET" ]; then
          CONFLICT=1
        fi
        STATUS_FILE="/tmp/check_ip_conflict_status"
        if [ $CONFLICT -eq 1 ]; then
          SAFE_IP=""
          if [ "$CURRENT_SUBNET" != "192.168.2" ] && [ "$UPSTREAM_SUBNET" != "192.168.2" ]; then
            SAFE_IP="192.168.2.1"
          elif [ "$CURRENT_SUBNET" != "192.168.100" ] && [ "$UPSTREAM_SUBNET" != "192.168.100" ]; then
            SAFE_IP="192.168.100.1"
          elif [ "$CURRENT_SUBNET" != "10.42.0" ] && [ "$UPSTREAM_SUBNET" != "10.42.0" ]; then
            SAFE_IP="10.42.0.1"
          else
            SAFE_IP="192.168.50.1"
          fi
          uci set network.lan.ipaddr="$SAFE_IP"
          uci set network.lan.netmask="255.255.255.0"
          uci commit network
          echo "step completed successfully" > $STATUS_FILE
          echo "step completed successfully"
          /etc/init.d/network restart
        else
          echo "step completed successfully" > $STATUS_FILE
          echo "step completed successfully"
        fi
        exit 0
      `;
            const result = yield executeSSHCommand(script, 30000);
            const output = result.output || '';
            if (!result.success) {
                return {
                    success: false,
                    error: result.error || 'command failed',
                    output,
                };
            }
            // If network was restarted on the router, attempt to reconnect a few times
            if (output.includes('Applying network changes') || output.includes('restart')) {
                for (let i = 0; i < reconnectRetries; i++) {
                    yield new Promise((r) => setTimeout(r, reconnectTimeout));
                    const reConn = yield establishSSHConnection();
                    if (reConn.success) {
                        return { success: true, output };
                    }
                }
                // If we couldn't reconnect, still treat the step as completed because router likely applied the change
                return { success: true, output };
            }
            // Check for success marker
            if (output.includes('step completed successfully')) {
                return { success: true, output };
            }
            return { success: false, error: 'unexpected output', output };
        }
        catch (error) {
            return { success: false, error: (error === null || error === void 0 ? void 0 : error.message) || String(error) };
        }
    });
}
let deploymentState = {
    isRunning: false,
    authToken: '',
    sessionId: '',
    businessId: '',
    stepSummaries: [],
    currentStepIndex: 0,
    isPaused: false,
    error: null,
    wifiName: undefined,
    expectingReconnect: false,
    pendingReconnectIP: null,
    currentStep: null,
    isAttemptingReconnect: false
};
// Internal API helper functions
function apiCall(endpoint_1, authToken_1) {
    return __awaiter(this, arguments, void 0, function* (endpoint, authToken, body = {}) {
        console.log(`[MAIN] API Call to ${endpoint} with body:`, body);
        try {
            const response = yield fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': authToken
                },
                body: JSON.stringify(body)
            });
            const data = yield response.json();
            if (!response.ok) {
                throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
            }
            return { success: true, data };
        }
        catch (error) {
            console.error(`API call to ${endpoint} failed:`, error);
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    });
}
// Start automated deployment process
electron_1.ipcMain.handle('start-automated-deployment', (event_1, _a) => __awaiter(void 0, [event_1, _a], void 0, function* (event, { authToken, businessId, wifiName, realmId }) {
    console.log('[MAIN] Starting automated deployment with params:', { businessId, wifiName, realmId });
    try {
        // Check if SSH is connected
        if (!sshConnection || !sshConnectionStatus.connected) {
            return {
                success: false,
                error: 'SSH connection required before starting deployment'
            };
        }
        // Check if deployment is already running
        if (deploymentState.isRunning) {
            return {
                success: false,
                error: 'Deployment is already running'
            };
        }
        // Before hitting the API, ensure there's no LAN vs upstream IP subnet conflict
        try {
            const ipCheckResult = yield checkAndResolveIpConflict();
            console.log('[MAIN] IP conflict check result:', ipCheckResult);
            if (!ipCheckResult.success) {
                return { success: false, error: `IP conflict resolution failed: ${ipCheckResult.error || 'unknown'}` };
            }
        }
        catch (err) {
            console.error('[MAIN] IP conflict resolution error:', err);
            return { success: false, error: `IP conflict resolution failed: ${(err === null || err === void 0 ? void 0 : err.message) || err}` };
        }
        // Initialize deployment session with API server
        const initPayload = { businessId, realmId, wifiName: wifiName === null || wifiName === void 0 ? void 0 : wifiName.trim() };
        const initResult = yield apiCall('/onboard/initialize', authToken, initPayload);
        if (!initResult.success) {
            return {
                success: false,
                error: initResult.error || 'Failed to initialize deployment with API server'
            };
        }
        const { sessionId, stepSummaries, wifiName: configuredWifiName } = initResult.data;
        // Set up deployment state
        deploymentState = {
            isRunning: true,
            authToken,
            sessionId,
            businessId,
            stepSummaries,
            currentStepIndex: 0,
            isPaused: false,
            error: null,
            wifiName: configuredWifiName || wifiName, // Store the WiFi name
            expectingReconnect: false,
            pendingReconnectIP: null,
            currentStep: null,
            isAttemptingReconnect: false
        };
        // Notify UI of deployment start
        if (onboardWindow) {
            onboardWindow.webContents.send('deployment-status', {
                type: 'started',
                sessionId,
                totalSteps: stepSummaries.length,
                currentStep: 0,
                wifiName: configuredWifiName
            });
        }
        console.log(`Deployment initialized with WiFi name: ${configuredWifiName || 'default'}`);
        // Start executing steps
        executeNextDeploymentStep();
        return {
            success: true,
            data: { sessionId, totalSteps: stepSummaries.length, wifiName: configuredWifiName }
        };
    }
    catch (error) {
        console.error('Start deployment failed:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error)
        };
    }
}));
// Execute next deployment step
function executeNextDeploymentStep() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e;
        if (!deploymentState.isRunning || deploymentState.isPaused) {
            return;
        }
        const { authToken, sessionId, stepSummaries, currentStepIndex } = deploymentState;
        // Check if we've completed all steps
        if (currentStepIndex >= stepSummaries.length) {
            deploymentState.isRunning = false;
            if (onboardWindow) {
                onboardWindow.webContents.send('deployment-status', {
                    type: 'completed',
                    totalSteps: stepSummaries.length
                });
            }
            return;
        }
        const currentStepSummary = stepSummaries[currentStepIndex];
        const isFirstStep = currentStepIndex === 0;
        // Notify UI of step start
        if (onboardWindow) {
            onboardWindow.webContents.send('deployment-status', {
                type: 'step-started',
                currentStep: currentStepIndex + 1,
                totalSteps: stepSummaries.length,
                stepTitle: currentStepSummary.title
            });
        }
        try {
            // Get the full step details from API
            const stepResult = yield apiCall('/onboard/get-next-step', authToken, {
                sessionId,
                currentStepId: isFirstStep ? null : (_a = stepSummaries[currentStepIndex - 1]) === null || _a === void 0 ? void 0 : _a.id,
                routerInfo: null
            });
            if (!stepResult.success) {
                throw new Error(stepResult.error || 'Failed to get next step from API');
            }
            const step = stepResult.data.step;
            console.log(`Executing step ${currentStepIndex + 1}: ${step.title}`);
            console.log('Command:', step.command);
            // Store current step in deployment state for SSH handlers
            deploymentState.currentStep = step;
            // Notify UI of command execution
            if (onboardWindow) {
                onboardWindow.webContents.send('deployment-status', {
                    type: 'executing-command',
                    currentStep: currentStepIndex + 1,
                    // command: step.command98lk,
                    command: step.description
                });
            }
            // Execute the command on the router via SSH
            const commandResult = yield executeSSHCommand(step.command, step.timeout || 300000);
            if (!commandResult.success) {
                throw new Error(`Command execution failed: ${commandResult.error}`);
            }
            // Check if this step requires SSH reconnection (e.g., after IP change)
            if (step.reconnect_on_sshClose) {
                deploymentState.expectingReconnect = true;
                deploymentState.pendingReconnectIP = step.new_ip || null;
                const targetIP = step.new_ip || sshConnectionStatus.host;
                const reconnectTimeout = step.reconnect_timeout || 10000;
                const maxRetries = step.reconnect_retries || 3;
                console.log(`Step requires SSH reconnection to: ${targetIP}`);
                console.log(`Waiting ${reconnectTimeout}ms for network to stabilize...`);
                // Notify UI that we're waiting for network restart
                if (onboardWindow) {
                    onboardWindow.webContents.send('deployment-status', {
                        type: 'network-restart',
                        currentStep: currentStepIndex + 1,
                        message: 'Waiting for router network to restart...'
                    });
                }
                // Wait for network to stabilize
                yield new Promise(resolve => setTimeout(resolve, reconnectTimeout));
                // Attempt reconnection with retries
                let reconnected = false;
                for (let attempt = 1; attempt <= maxRetries && !reconnected; attempt++) {
                    console.log(`Reconnection attempt ${attempt}/${maxRetries} to ${targetIP}`);
                    // Notify UI of reconnection attempt
                    if (onboardWindow) {
                        onboardWindow.webContents.send('deployment-status', {
                            type: 'reconnecting',
                            currentStep: currentStepIndex + 1,
                            attempt,
                            maxRetries,
                            targetIP
                        });
                    }
                    // Clean up old connection before reconnecting
                    cleanupSshConnection();
                    // Create new SSH connection
                    sshConnection = new ssh2_1.Client();
                    const reconnectResult = yield new Promise((resolve) => {
                        const timeout = setTimeout(() => {
                            resolve({
                                success: false,
                                error: 'Reconnection timeout (10 seconds)'
                            });
                        }, 10000);
                        sshConnection.on('ready', () => {
                            clearTimeout(timeout);
                            console.log('SSH Reconnection :: ready');
                            sshConnectionStatus = {
                                connected: true,
                                host: targetIP,
                                username: sshConnectionStatus.username || 'root',
                                lastActivity: new Date().toISOString(),
                                error: ''
                            };
                            resolve({
                                success: true,
                                message: 'SSH reconnection successful'
                            });
                            // Notify renderer of reconnection success
                            if (onboardWindow) {
                                onboardWindow.webContents.send('ssh-connection-status', sshConnectionStatus);
                            }
                        }).on('error', (err) => {
                            clearTimeout(timeout);
                            console.log('SSH Reconnection :: error :: ' + err.message);
                            resolve({
                                success: false,
                                error: err.message
                            });
                        }).on('close', () => {
                            console.log('SSH Reconnection :: closed');
                            // Check if still expecting reconnect (not yet successful)
                            if (deploymentState.expectingReconnect) {
                                console.log('Reconnection closed before ready event');
                                return;
                            }
                            cleanupSshConnection();
                            if (onboardWindow) {
                                onboardWindow.webContents.send('ssh-connection-status', sshConnectionStatus);
                            }
                        }).connect({
                            host: targetIP,
                            port: 22,
                            username: sshConnectionStatus.username || 'root',
                            readyTimeout: 5000,
                            keepaliveInterval: 5000,
                            keepaliveCountMax: 3
                        });
                    });
                    if (reconnectResult.success) {
                        reconnected = true;
                        deploymentState.expectingReconnect = false;
                        deploymentState.pendingReconnectIP = null;
                        console.log(`Successfully reconnected to ${targetIP}`);
                        // Notify UI of successful reconnection
                        if (onboardWindow) {
                            onboardWindow.webContents.send('deployment-status', {
                                type: 'reconnected',
                                currentStep: currentStepIndex + 1,
                                targetIP
                            });
                        }
                        break;
                    }
                    // Wait before next retry
                    if (attempt < maxRetries) {
                        console.log(`Reconnection failed: ${reconnectResult.error}. Retrying in 3 seconds...`);
                        yield new Promise(resolve => setTimeout(resolve, 3000));
                    }
                }
                if (!reconnected) {
                    deploymentState.expectingReconnect = false;
                    deploymentState.pendingReconnectIP = null;
                    throw new Error(`Failed to reconnect to ${targetIP} after ${maxRetries} attempts`);
                }
            }
            // Check if this is the last step (reboot step)
            const isLastStep = currentStepIndex === stepSummaries.length - 1;
            if (isLastStep) {
                // This is the final step (reboot) - don't run test or send results to API
                console.log(`Final step (reboot) executed. Deployment complete!`);
                // Notify UI of successful completion with WiFi name
                if (onboardWindow) {
                    onboardWindow.webContents.send('deployment-status', {
                        type: 'completed-with-reboot',
                        wifiName: deploymentState.wifiName || 'New Network',
                        message: 'Router onboarding completed successfully! The router is rebooting to apply all changes.'
                    });
                }
                // Mark deployment as complete
                deploymentState.isRunning = false;
                deploymentState.currentStepIndex++;
                return;
            }
            // For non-final steps, execute the test command to verify the step
            const testResult = yield executeSSHCommand(step.test, 3000);
            // Submit the test result to the API for validation
            const validationResult = yield apiCall('/onboard/execute-step', authToken, {
                sessionId,
                stepId: step.id,
                testResult: {
                    exitCode: testResult.exitCode || (testResult.success ? 0 : 1),
                    stdout: testResult.output || '',
                    stderr: testResult.error || '',
                    retryCount: 0
                }
            });
            if (!validationResult.success || !validationResult.data.validation.success) {
                const errorMsg = ((_c = (_b = validationResult.data) === null || _b === void 0 ? void 0 : _b.validation) === null || _c === void 0 ? void 0 : _c.message) || validationResult.error || 'Step validation failed';
                if ((_e = (_d = validationResult.data) === null || _d === void 0 ? void 0 : _d.validation) === null || _e === void 0 ? void 0 : _e.shouldRetry) {
                    console.log(`Step failed but retryable: ${errorMsg}`);
                    // Notify UI of retry
                    if (onboardWindow) {
                        onboardWindow.webContents.send('deployment-status', {
                            type: 'step-retrying',
                            currentStep: currentStepIndex + 1,
                            error: errorMsg
                        });
                    }
                    // Retry the same step after a delay
                    setTimeout(() => executeNextDeploymentStep(), 2000);
                    return;
                }
                else {
                    throw new Error(errorMsg);
                }
            }
            // Step completed successfully
            console.log(`Step ${currentStepIndex + 1} completed successfully`);
            // Clear current step
            deploymentState.currentStep = null;
            // Notify UI of step completion
            if (onboardWindow) {
                onboardWindow.webContents.send('deployment-status', {
                    type: 'step-completed',
                    currentStep: currentStepIndex + 1,
                    totalSteps: stepSummaries.length
                });
            }
            // Move to next step
            deploymentState.currentStepIndex++;
            // Continue with next step
            setTimeout(() => executeNextDeploymentStep(), 1000);
        }
        catch (error) {
            console.error(`Deployment step ${currentStepIndex + 1} failed:`, error);
            deploymentState.error = error instanceof Error ? error.message : String(error);
            deploymentState.isRunning = false;
            deploymentState.currentStep = null;
            // Notify UI of deployment failure
            if (onboardWindow) {
                onboardWindow.webContents.send('deployment-status', {
                    type: 'failed',
                    currentStep: currentStepIndex + 1,
                    error: deploymentState.error
                });
            }
        }
    });
}
// Helper function to execute SSH commands with proper error handling
function executeSSHCommand(command_1, commandTimeout_1) {
    return __awaiter(this, arguments, void 0, function* (command, commandTimeout, retryCount = 0) {
        return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
            if (!sshConnection || !sshConnectionStatus.connected) {
                resolve({
                    success: false,
                    error: 'No active SSH connection',
                    output: '',
                    timestamp: new Date().toISOString()
                });
                return;
            }
            let output = '';
            let errorOutput = '';
            let commandResolved = false;
            const timeout = setTimeout(() => {
                if (!commandResolved) {
                    commandResolved = true;
                    resolve({
                        success: false,
                        error: 'Command execution timeout',
                        output: output.trim(),
                        timestamp: new Date().toISOString()
                    });
                }
            }, commandTimeout);
            sshConnection.exec(command, (err, stream) => {
                if (err) {
                    clearTimeout(timeout);
                    if (!commandResolved) {
                        commandResolved = true;
                        resolve({
                            success: false,
                            error: err.message,
                            output: '',
                            timestamp: new Date().toISOString()
                        });
                    }
                    return;
                }
                stream.on('close', (code, signal) => __awaiter(this, void 0, void 0, function* () {
                    clearTimeout(timeout);
                    // if we are running in development mode (app is not packaged), log detailed info
                    if (!electron_1.app.isPackaged) {
                        console.log(`SSH Command :: close :: code: ${code}, signal: ${signal}`);
                    }
                    // Check if connection was lost (code is undefined) and this step supports reconnection
                    const currentStep = deploymentState.currentStep;
                    const isLastStep = deploymentState.currentStepIndex === deploymentState.stepSummaries.length - 1;
                    const connectionLost = code === undefined || code === null;
                    if (connectionLost && currentStep && currentStep.reconnect_on_sshClose && !isLastStep && retryCount < 3) {
                        if (!electron_1.app.isPackaged) {
                            console.log('Detected connection loss during command execution on a step that supports reconnection.');
                        }
                        // Wait for SSH reconnection handler to complete (it waits for timeout + reconnection)
                        const maxWaitTime = (currentStep.timeout || 3000) + 15000; // Wait time + 15s for reconnection
                        const startWait = Date.now();
                        // Poll for connection restoration
                        while (Date.now() - startWait < maxWaitTime) {
                            yield new Promise(resolve => setTimeout(resolve, 1000));
                            // Check if connection is restored
                            if (sshConnection && sshConnectionStatus.connected && !deploymentState.isAttemptingReconnect) {
                                if (!electron_1.app.isPackaged) {
                                    console.log(`Connection restored. Retrying command (attempt ${retryCount + 1})...`);
                                }
                                // Retry the command
                                const retryResult = yield executeSSHCommand(command, commandTimeout, retryCount + 1);
                                if (!commandResolved) {
                                    commandResolved = true;
                                    resolve(retryResult);
                                }
                                return;
                            }
                        }
                        // If we get here, reconnection failed or timed out
                        console.log('Reconnection timeout or failed. Command execution failed.');
                        if (!commandResolved) {
                            commandResolved = true;
                            resolve({
                                success: false,
                                error: 'SSH connection lost and reconnection failed',
                                output: output.trim(),
                                timestamp: new Date().toISOString()
                            });
                        }
                        return;
                    }
                    // Normal command completion
                    sshConnectionStatus.lastActivity = new Date().toISOString();
                    if (!commandResolved) {
                        commandResolved = true;
                        resolve({
                            success: code === 0,
                            output: output.trim(),
                            error: errorOutput.trim() || (code !== 0 ? `Command exited with code ${code}` : ''),
                            exitCode: code,
                            command,
                            timestamp: new Date().toISOString()
                        });
                    }
                })).on('data', (data) => {
                    const dataStr = data.toString();
                    console.log('SSH STDOUT: ' + dataStr);
                    output += dataStr;
                    // Send real-time output to renderer
                    if (onboardWindow) {
                        onboardWindow.webContents.send('ssh-command-output', {
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
                    if (onboardWindow) {
                        onboardWindow.webContents.send('ssh-command-output', {
                            type: 'stderr',
                            data: dataStr,
                            timestamp: new Date().toISOString()
                        });
                    }
                });
            });
        }));
    });
}
// Pause deployment
electron_1.ipcMain.handle('pause-deployment', () => __awaiter(void 0, void 0, void 0, function* () {
    if (deploymentState.isRunning) {
        deploymentState.isPaused = true;
        if (onboardWindow) {
            onboardWindow.webContents.send('deployment-status', {
                type: 'paused',
                currentStep: deploymentState.currentStepIndex + 1
            });
        }
        return { success: true };
    }
    return { success: false, error: 'No deployment running' };
}));
// Resume deployment
electron_1.ipcMain.handle('resume-deployment', () => __awaiter(void 0, void 0, void 0, function* () {
    if (deploymentState.isRunning && deploymentState.isPaused) {
        deploymentState.isPaused = false;
        if (onboardWindow) {
            onboardWindow.webContents.send('deployment-status', {
                type: 'resumed',
                currentStep: deploymentState.currentStepIndex + 1
            });
        }
        // Continue execution
        executeNextDeploymentStep();
        return { success: true };
    }
    return { success: false, error: 'No paused deployment to resume' };
}));
// Stop deployment
electron_1.ipcMain.handle('stop-deployment', () => __awaiter(void 0, void 0, void 0, function* () {
    if (deploymentState.isRunning) {
        deploymentState.isRunning = false;
        deploymentState.isPaused = false;
        deploymentState.error = 'Deployment stopped by user';
        if (onboardWindow) {
            onboardWindow.webContents.send('deployment-status', {
                type: 'stopped',
                currentStep: deploymentState.currentStepIndex + 1
            });
        }
        return { success: true };
    }
    return { success: false, error: 'No deployment running' };
}));
// Retry current deployment step
electron_1.ipcMain.handle('retry-deployment-step', () => __awaiter(void 0, void 0, void 0, function* () {
    if (deploymentState.isRunning && deploymentState.error) {
        deploymentState.error = null;
        deploymentState.isPaused = false;
        if (onboardWindow) {
            onboardWindow.webContents.send('deployment-status', {
                type: 'step-retrying',
                currentStep: deploymentState.currentStepIndex + 1
            });
        }
        // Retry current step
        executeNextDeploymentStep();
        return { success: true };
    }
    return { success: false, error: 'No failed step to retry' };
}));
// Get deployment status
electron_1.ipcMain.handle('get-deployment-status', () => __awaiter(void 0, void 0, void 0, function* () {
    return {
        success: true,
        data: {
            isRunning: deploymentState.isRunning,
            isPaused: deploymentState.isPaused,
            currentStep: deploymentState.currentStepIndex + 1,
            totalSteps: deploymentState.stepSummaries.length,
            sessionId: deploymentState.sessionId,
            error: deploymentState.error
        }
    };
}));
// Legacy API endpoints (kept for backward compatibility, but marked as deprecated)
// Initialize deployment session with API server
electron_1.ipcMain.handle('api-initialize-deployment', (event_1, _a) => __awaiter(void 0, [event_1, _a], void 0, function* (event, { authToken, businessId }) {
    console.warn('api-initialize-deployment is deprecated. Use start-automated-deployment instead.');
    return yield apiCall('/onboard/initialize', authToken, { businessId });
}));
// Get next step from API server
electron_1.ipcMain.handle('api-get-next-step', (event_1, _a) => __awaiter(void 0, [event_1, _a], void 0, function* (event, { authToken, sessionId, currentStepId, routerInfo }) {
    console.warn('api-get-next-step is deprecated. Deployment steps are now handled automatically.');
    return yield apiCall('/onboard/get-next-step', authToken, { sessionId, currentStepId, routerInfo });
}));
// Submit step execution result to API server
electron_1.ipcMain.handle('api-execute-step', (event_1, _a) => __awaiter(void 0, [event_1, _a], void 0, function* (event, { authToken, sessionId, stepId, testResult }) {
    console.warn('api-execute-step is deprecated. Deployment steps are now handled automatically.');
    return yield apiCall('/onboard/execute-step', authToken, { sessionId, stepId, testResult });
}));
