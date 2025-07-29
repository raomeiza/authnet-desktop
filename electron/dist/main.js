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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = __importStar(require("path"));
const fs_1 = __importDefault(require("fs"));
const serialport_1 = require("serialport");
const stream_1 = require("stream");
const database_1 = require("./database");
const server_1 = __importStar(require("./server"));
const isdev_1 = __importDefault(require("./isdev"));
let mainWindow;
let port; // Corrected type definition
let database;
let user;
// create a flag for fingerprint login
let fingerprintLoginIn = null;
let fingerPrintTakingAttendance = {
    inUse: false,
    courseCode: null,
    course: null,
    date: null
};
let serialEnabledWindows = [];
let scanner = {
    inUse: false,
    window: null,
    timestamp: null
};
let resetScanner = setInterval(() => {
    if (scanner.inUse && scanner.timestamp && Date.now() - scanner.timestamp > 500000) {
        scanner.inUse = false;
        scanner.window = null;
        scanner.timestamp = null;
    }
});
// create a holder for the user whose fingerprint is being enrolled
let fingerPrintEnrollingUser = null;
// Function to create the browser window
function createWindow() {
    return __awaiter(this, void 0, void 0, function* () {
        database = new database_1.Database();
        const staffCount = yield database.staff().count();
        mainWindow = new electron_1.BrowserWindow({
            title: "Biometric Attendance System",
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
        // // Disable the default menu
        // Menu.setApplicationMenu(Menu.buildFromTemplate([]));
        mainWindow.loadURL('http://localhost:' + server_1.port + '?count=' + staffCount); // Assuming React dev server is running on serverPort 3000
        serialEnabledWindows.push({ window: mainWindow, url: 'http://localhost:' + port });
        // wait for 200 milisec and send the availability of the scanner to the main window
        setTimeout(() => {
            mainWindow.webContents.send('scanner-available', connected);
        }, process.env.NODE_ENV === 'production' ? 1000 : 2000);
    });
}
// create a flag to track wether we are connected to the serial port
let connected = false;
// Function to list serial ports and find the one matching the ESP32
function findESP32Port() {
    return __awaiter(this, void 0, void 0, function* () {
        const ports = yield serialport_1.SerialPort.list();
        let esp32Port;
        for (const portInfo of ports) {
            let testPort;
            try {
                // Try to open a connection on each port
                testPort = new serialport_1.SerialPort({ path: portInfo.path, baudRate: 57600, autoOpen: false });
                yield new Promise((resolve, reject) => {
                    testPort.open((err) => {
                        if (err) {
                            reject(err);
                            return;
                        }
                        // Send the "details" command to the device
                        testPort.write('details\n', (writeErr) => {
                            if (writeErr) {
                                reject(writeErr);
                                return;
                            }
                            // Read the response from the device
                            testPort.once('data', (data) => {
                                var _a;
                                try {
                                    const response = JSON.parse(data.toString().trim());
                                    if ((_a = response.result) === null || _a === void 0 ? void 0 : _a.capacity) { // Adjust this condition based on the expected response
                                        // If the response is as expected, assume it's the ESP32
                                        esp32Port = portInfo.path;
                                        resolve();
                                    }
                                    else {
                                        reject(new Error('Unexpected response'));
                                    }
                                }
                                catch (parseErr) {
                                    const response = data.toString().trim();
                                    if (response.includes('details') && response.includes('result')) {
                                        esp32Port = portInfo.path;
                                        resolve();
                                    }
                                    else {
                                        reject(new Error('Unexpected response'));
                                    }
                                }
                            });
                            // Timeout handling
                            setTimeout(() => {
                                reject(new Error('Timeout waiting for response'));
                            }, 500); // 2 seconds timeout
                        });
                    });
                });
                // If we found the ESP32 port, break out of the loop
                if (esp32Port) {
                    break;
                }
            }
            catch (err) {
                console.error(`Error testing port ${portInfo.path}:`, err);
            }
            finally {
                if (testPort && testPort.isOpen) {
                    yield new Promise((resolve) => {
                        testPort.close((closeErr) => {
                            if (closeErr) {
                                console.error(`Error closing port ${portInfo.path}:`, closeErr);
                            }
                            resolve();
                        });
                    });
                }
            }
        }
        if (!esp32Port) {
            console.error('ESP32 not found. Please check the connection.');
        }
        else {
            console.log(`ESP32 found on port: ${esp32Port}`);
        }
        return esp32Port;
    });
}
// Custom parser using Transform stream
class LineTransform extends stream_1.Transform {
    constructor(options) {
        super(options);
        this._buffer = '';
    }
    _transform(chunk, encoding, callback) {
        this._buffer += chunk.toString();
        const lines = this._buffer.split('\r\n');
        this._buffer = lines.pop() || '';
        lines.forEach((line) => this.push(line));
        callback();
    }
    _flush(callback) {
        this.push(this._buffer);
        this._buffer = '';
        callback();
    }
}
// Initialize the serial port connection
function setupSerialConnection() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const esp32Port = yield findESP32Port();
            if (!esp32Port) {
                console.error('No ESP32 port found!');
                return;
            }
            //@ts-ignore
            port = new serialport_1.SerialPort({ path: esp32Port, baudRate: 57600 });
            //@ts-ignore
            const parser = port.pipe(new LineTransform()); // Use custom parser
            port.on('open', () => {
                // Set the connected flag to false
                connected = true;
                // for each of the windows that are open, send a message to the window that the scanner is connected
                serialEnabledWindows.forEach(win => {
                    win.window.webContents.send('scanner-available', true);
                });
            });
            port.on('error', (err) => {
                console.error('Serial port error:', err);
            });
            port.on('close', () => {
                // Set the connected flag to false
                connected = false;
                if (scanner.inUse && scanner.window) {
                    scanner.window.send('serial-data', { error: 'Fingerprint scanner disconnected.' });
                }
                // for each of the windows that are open, send a message to the window that the scanner is disconnected
                serialEnabledWindows.forEach(win => {
                    win.window.webContents.send('scanner-available', false);
                });
                scanner = {
                    inUse: false,
                    window: null,
                    timestamp: null
                };
            });
            // Listen for data from the ESP32
            parser.on('data', (data) => __awaiter(this, void 0, void 0, function* () {
                var _a, _b, _c, _d, _e;
                try {
                    const jsonData = JSON.parse(data.toString().trim());
                    try {
                        if (jsonData.command === 'enroll' && jsonData.event === 'result' && fingerPrintEnrollingUser) {
                            // check if the fingerprint is being enrolled for the first time
                            if (fingerPrintEnrollingUser.fid1 === null) {
                                fingerPrintEnrollingUser.fid1 = jsonData.result.id;
                                // tell the user that we have enrolled the first fingerprint and we will need the other finger. it should be different from the first one
                                if (scanner.window) {
                                    scanner.window.send('serial-data', { message: 'First finger enrolled successfully' });
                                    yield new Promise(resolve => setTimeout(resolve, 2000)); // wait for 2 seconds
                                    if (!scanner.window) {
                                        return;
                                    }
                                    scanner.inUse = true;
                                    scanner.window.send('serial-data', { message: 'Please place a different finger on the scanner.' });
                                    scanner.timestamp = Date.now();
                                    port.write("enroll\n");
                                }
                                return;
                            }
                            else {
                                fingerPrintEnrollingUser.fid2 = jsonData.result.id;
                                // save the user to the database
                                if (fingerPrintEnrollingUser.fid1 !== null && fingerPrintEnrollingUser.fid2 !== null) {
                                    try {
                                        const result = yield database.fingerprint().enroll(fingerPrintEnrollingUser.id, fingerPrintEnrollingUser.fid1, fingerPrintEnrollingUser.fid2);
                                    }
                                    catch (err) {
                                        console.error('Failed to save fingerprint 1:', err);
                                        // the usual problem is id already exists in this sqlite table but we have to verify that
                                        if (err.message.includes('UNIQUE constraint failed: fingerprint.id')) {
                                            // if the id matches an email, lets check the staff database to verify if the user exists
                                            try {
                                                if (fingerPrintEnrollingUser.preventDuplicate) {
                                                    let user = fingerPrintEnrollingUser.id.includes('@') ?
                                                        yield database.staff().findByEmail(fingerPrintEnrollingUser.id) :
                                                        yield database.student().findByMatricNumber(fingerPrintEnrollingUser.id);
                                                    //@ts-ignore
                                                    if ((user === null || user === void 0 ? void 0 : user.email) === fingerPrintEnrollingUser.id || (user === null || user === void 0 ? void 0 : user.matric) === fingerPrintEnrollingUser.id) {
                                                        //@ts-ignore
                                                        let message = user.level ? `Student with matric number ${user.matric} already enrolled as ${user.fullName}` : `Staff with email ${user.email} already enrolled as ${user.fullName}`;
                                                        if (scanner.window) {
                                                            scanner.window.send('serial-data', { command: 'enroll', event: 'error', message });
                                                        }
                                                        // release the scanner
                                                        scanner.inUse = false;
                                                        scanner.timestamp = null;
                                                        return;
                                                    }
                                                }
                                                // remove the old data from the fingerprint table
                                                const removed = yield database.fingerprint().remove(fingerPrintEnrollingUser.id);
                                                if (removed) {
                                                    // try to save the fingerprint data again
                                                    // try {
                                                    const result = yield database.fingerprint().enroll(fingerPrintEnrollingUser.id, fingerPrintEnrollingUser.fid1, fingerPrintEnrollingUser.fid2);
                                                    if (scanner.window) {
                                                        scanner.window.send('serial-data', jsonData);
                                                    }
                                                    return;
                                                }
                                                else {
                                                    console.error('Failed to remove fingerprint data:', removed);
                                                    throw new Error('Error removing old fingerprint data');
                                                }
                                            }
                                            catch (err) {
                                                console.error('Failed to find user or resolve fingerprint issue:', err);
                                                // for each fingerprint enrolled, delete the fingerprint from the scanner
                                                port.write("delete " + fingerPrintEnrollingUser.fid1 + "\n");
                                                port.write("delete " + fingerPrintEnrollingUser.fid2 + "\n");
                                                if (scanner.window) {
                                                    scanner.window.send('serial-data', { error: 'Error saving fingerprint.' });
                                                }
                                            }
                                            if (scanner.window) {
                                                scanner.window.send('serial-data', { error: 'Fingerprint already enrolled.' });
                                            }
                                        }
                                        else {
                                            // for each fingerprint enrolled, delete the fingerprint from the scanner
                                            port.write("delete " + fingerPrintEnrollingUser.fid1 + "\n");
                                            port.write("delete " + fingerPrintEnrollingUser.fid2 + "\n");
                                            if (scanner.window) {
                                                scanner.window.send('serial-data', { error: 'Error saving fingerprint.' });
                                            }
                                        }
                                    }
                                }
                                // reset the fingerPrintEnrollingUser object
                                fingerPrintEnrollingUser = null;
                                if (scanner.inUse) {
                                    scanner.window && scanner.window.send('serial-data', jsonData);
                                    scanner = {
                                        inUse: false,
                                        window: null,
                                        timestamp: null
                                    };
                                }
                            }
                        }
                        else if (jsonData.command === "enroll" && jsonData.event === "error") {
                            // check if fingerprint have already stored any of the persons finger
                            if (fingerPrintEnrollingUser && fingerPrintEnrollingUser.fid1) {
                                port.write("delete " + fingerPrintEnrollingUser.fid1 + "\n");
                                scanner.window && scanner.window.send("serial-data", jsonData);
                                fingerPrintEnrollingUser = null;
                                scanner = {
                                    inUse: false,
                                    window: null,
                                    timestamp: null
                                };
                                return;
                            }
                            else {
                                fingerPrintEnrollingUser = null;
                                if (scanner.inUse && scanner.window) {
                                    scanner.window.send('serial-data', jsonData);
                                    scanner = {
                                        inUse: false,
                                        window: null,
                                        timestamp: null
                                    };
                                }
                            }
                        }
                        else if (jsonData.event === "result" || jsonData.event === "error") {
                            if (((_a = jsonData.result) === null || _a === void 0 ? void 0 : _a.score) && ((_b = jsonData.result) === null || _b === void 0 ? void 0 : _b.score) < 75) {
                                if (scanner.inUse && scanner.window) {
                                    scanner.window.send('serial-data', { command: jsonData.command, event: 'error', message: 'Fingerprint not properly scanned. Please try again.', error: { message: 'Fingerprint not properly scanned. Please try again.' } });
                                }
                                return;
                            }
                            // ----------- finger print login handling starts ----------------
                            if (jsonData.command === 'search' && fingerprintLoginIn) {
                                fingerprintLoginIn = false;
                                if (jsonData.result && (jsonData.result.id || jsonData.result.id === 0)) { // check if the result is a valid fingerprint id
                                    try {
                                        const result = yield database.staff().findByFid(jsonData.result.id);
                                        if (result) {
                                            user = result;
                                            scanner.window ? scanner.window.send('staff-fingerprint-login-response', { result })
                                                : console.log('No window to send response to');
                                        }
                                        else {
                                            scanner.window ? scanner.window.send('staff-fingerprint-login-response', { error: 'Staff not found' })
                                                : console.log('No window to send response to');
                                        }
                                    }
                                    catch (error) {
                                        console.error('Failed to find staff:', error);
                                        scanner.window ? scanner.window.send('staff-fingerprint-login-response', { error })
                                            : console.log('No window to send response to');
                                    }
                                }
                                else {
                                    scanner.window && scanner.window.send('staff-fingerprint-login-response', { error: jsonData });
                                }
                                fingerprintLoginIn = null;
                                scanner = {
                                    inUse: false,
                                    window: null,
                                    timestamp: null
                                };
                                return;
                            }
                            else if (jsonData.command === 'search' && fingerPrintTakingAttendance.inUse && ((_c = fingerPrintTakingAttendance.courseCode) === null || _c === void 0 ? void 0 : _c.endsWith('_EXAM'))) {
                                if (jsonData.result && jsonData.result.id) {
                                    try {
                                        const student = yield database.student().findByFid(jsonData.result.id);
                                        if (student) {
                                            // Get the actual course code (remove _EXAM suffix)
                                            const actualCourseCode = fingerPrintTakingAttendance.courseCode.replace('_EXAM', '');
                                            // Check if the student is enrolled in the course
                                            const courseStudents = JSON.parse(((_d = fingerPrintTakingAttendance.course) === null || _d === void 0 ? void 0 : _d.students) || '[]');
                                            if (!courseStudents.map((s) => s.trim()).includes(student.matric.trim())) {
                                                scanner.window ? scanner.window.send('mark-exam-attendance-response', {
                                                    error: `Student with matric number ${student.matric} is not enrolled in this course`
                                                }) : console.log('No window to send response to');
                                                return;
                                            }
                                            // Get all attendance records for this course
                                            const allAttendance = yield database.studentAttendance().getByCourseCode(actualCourseCode);
                                            // Group attendance by date to count total classes
                                            const classesByDate = allAttendance.reduce((acc, attendance) => {
                                                if (!acc[attendance.date]) {
                                                    acc[attendance.date] = [];
                                                }
                                                acc[attendance.date].push(attendance);
                                                return acc;
                                            }, {});
                                            // Count total unique class dates
                                            const totalClasses = Object.keys(classesByDate).length;
                                            // Count how many classes this student attended
                                            const studentAttendance = allAttendance.filter((attendance) => attendance.studentMatric === student.matric);
                                            const attendedClasses = studentAttendance.length;
                                            // Calculate attendance percentage
                                            const attendancePercentage = totalClasses > 0 ? (attendedClasses / totalClasses) * 100 : 0;
                                            // Check if student meets 70% attendance requirement
                                            const isEligible = attendancePercentage >= 70;
                                            scanner.window ? scanner.window.send('mark-exam-attendance-response', Object.assign({}, (isEligible ? {
                                                result: {
                                                    student: {
                                                        matric: student.matric,
                                                        fullName: student.fullName,
                                                        level: student.level
                                                    },
                                                    attendance: {
                                                        totalClasses,
                                                        attendedClasses,
                                                        attendancePercentage: Math.round(attendancePercentage * 100) / 100, // Round to 2 decimal places
                                                        isEligible,
                                                        requirement: 70
                                                    },
                                                    message: `${student.fullName} is eligible for exam with ${Math.round(attendancePercentage * 100) / 100}% attendance (${attendedClasses}/${totalClasses} classes)`
                                                }
                                            }
                                                : { error: {
                                                        message: `${student.fullName} is NOT eligible for exam. Only ${Math.round(attendancePercentage * 100) / 100}% attendance (${attendedClasses}/${totalClasses} classes). Minimum required: 70%`
                                                    },
                                                }))) : console.log('No window to send response to');
                                        }
                                        else {
                                            scanner.window ? scanner.window.send('mark-exam-attendance-response', {
                                                error: 'Student not found'
                                            }) : console.log('No window to send response to');
                                        }
                                    }
                                    catch (error) {
                                        console.error('Error checking exam attendance eligibility:', error);
                                        scanner.window ? scanner.window.send('mark-exam-attendance-response', { error })
                                            : console.log('No window to send response to');
                                    }
                                }
                                else {
                                    scanner.window && scanner.window.send('mark-exam-attendance-response', { error: jsonData });
                                }
                                return;
                            }
                            else if (jsonData.command === 'search' && fingerPrintTakingAttendance.inUse) {
                                if (jsonData.result && jsonData.result.id) {
                                    try {
                                        const student = yield database.student().findByFid(jsonData.result.id);
                                        if (student) {
                                            // Check if the student is enrolled in the course
                                            const courseStudents = JSON.parse(((_e = fingerPrintTakingAttendance.course) === null || _e === void 0 ? void 0 : _e.students) || '[]');
                                            if (!courseStudents.map((s) => s.trim()).includes(student.matric.trim())) {
                                                scanner.window ? scanner.window.send('mark-attendance-response', {
                                                    error: `Student with matric number ${student.matric} is not enrolled in this course`
                                                }) : console.log('No window to send response to');
                                                return;
                                            }
                                            // Check if attendance is already marked for this student today
                                            const existingAttendance = yield database.studentAttendance().getByCourseCodeAndDate(fingerPrintTakingAttendance.courseCode, fingerPrintTakingAttendance.date);
                                            const alreadyMarked = existingAttendance.some((attendance) => attendance.studentMatric === student.matric);
                                            if (alreadyMarked) {
                                                scanner.window ? scanner.window.send('mark-attendance-response', {
                                                    error: `Student with matric number ${student.matric} already marked present`
                                                }) : console.log('No window to send response to');
                                                return;
                                            }
                                            // Mark attendance for the student
                                            const attendanceRecord = {
                                                studentMatric: student.matric,
                                                courseCode: fingerPrintTakingAttendance.courseCode,
                                                date: fingerPrintTakingAttendance.date,
                                                timestamp: new Date(),
                                                mode: 'bio',
                                                createdAt: new Date()
                                            };
                                            const result = yield database.studentAttendance().markAttendance(attendanceRecord);
                                            scanner.window ? scanner.window.send('mark-attendance-response', {
                                                result: {
                                                    data: result,
                                                    message: `Attendance marked for ${student.fullName} with matric number ${student.matric}`
                                                }
                                            }) : console.log('No window to send response to');
                                        }
                                        else {
                                            scanner.window ? scanner.window.send('mark-attendance-response', {
                                                error: 'Student not found'
                                            }) : console.log('No window to send response to');
                                        }
                                    }
                                    catch (error) {
                                        console.error('Error marking attendance:', error);
                                        scanner.window ? scanner.window.send('mark-attendance-response', { error })
                                            : console.log('No window to send response to');
                                    }
                                }
                                else {
                                    scanner.window && scanner.window.send('mark-attendance-response', { error: jsonData });
                                }
                                return;
                            }
                            // ----------- finger print login handling ends ----------------
                            if (scanner.inUse && scanner.window) {
                                scanner.window.send('serial-data', jsonData);
                                scanner = {
                                    inUse: false,
                                    window: null,
                                    timestamp: null
                                };
                            }
                        }
                        else {
                            if (scanner.inUse && scanner.window) {
                                scanner.window.send('serial-data', jsonData);
                            }
                        }
                    }
                    catch (err) {
                        if (scanner.inUse && scanner.window) {
                            scanner.window.send('serial-data', { error: 'Error saving fingerprint.' });
                        }
                    }
                }
                catch (err) {
                    console.error('Failed to parse JSON:', data.toString().trim(), err);
                }
            }));
        }
        catch (err) {
            console.error('Failed to setup serial connection:', err);
        }
    });
}
electron_1.app.whenReady().then(() => {
    setupSerialConnection().catch((err) => console.error('Unhandled error in setupSerialConnection:', err));
    createWindow();
    if (!isdev_1.default)
        (0, server_1.default)();
    // Polling for new devices (workaround for continuous monitoring)
    setInterval(() => __awaiter(void 0, void 0, void 0, function* () {
        // if connected, do nothing
        if (connected)
            return;
        setupSerialConnection().catch((err) => console.error('Unhandled error in setupSerialConnection:', err));
    }), 5000);
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0)
            createWindow();
    });
});
electron_1.app.on('window-all-closed', () => {
    database && database.close();
    if (process.platform !== 'darwin')
        electron_1.app.quit();
});
// Send commands from renderer process to serial port
electron_1.ipcMain.on('serial-send', (event, command, commandId, preventDuplicate = true) => {
    if (scanner.inUse) {
        // send error message to the window that sent the command
        event.sender.send('serial-data', { event: "error", message: "Scanner in use", error: { message: 'Scanner is currently in use. Please try again later.' } });
        return;
    }
    if (command === 'enroll' && !commandId) {
        event.sender.send('serial-data', { event: "error", message: "Unique identifier of user required", error: { message: 'unique email or matric number of the user is required for enroll command.' } });
        return;
    }
    if (port && port.isOpen) {
        scanner = {
            inUse: true,
            //@ts-ignore
            window: event.sender,
            timestamp: Date.now()
        };
        if (command === 'enroll' && commandId) {
            // initialize the fingerPrintEnrollingUser object
            fingerPrintEnrollingUser = {
                id: commandId,
                preventDuplicate,
                fid1: null,
                fid2: null
            };
        }
        port.write(`${command}\n`); // Send command over serial
    }
    else {
        // attempt to reconnect
        setupSerialConnection()
            .then(() => {
            port.write(`${command}\n`); // Send command over serial
            scanner = {
                inUse: true,
                //@ts-ignore
                window: event.sender,
                timestamp: Date.now()
            };
            if (command === 'enroll' && commandId) {
                // initialize the fingerPrintEnrollingUser object
                fingerPrintEnrollingUser = {
                    id: commandId,
                    fid1: 0,
                    fid2: 0
                };
            }
        })
            .catch((err) => console.error('Failed to reconnect:', err));
    }
});
electron_1.ipcMain.on('create-new-window', (event, { url, width, height, title }) => {
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
            newWindow.webContents.send('scanner-available', connected);
            newWindow.webContents.send('user-data', user);
        });
        // Allow communication with Electron protocols
        newWindow.webContents.on('ipc-message', (event, channel, ...args) => {
            if (channel === 'some-channel') {
                // Handle the message
            }
        });
    }
});
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
// create a listener for handling student form submission from the react app
electron_1.ipcMain.on('enroll-student', (event, student) => __awaiter(void 0, void 0, void 0, function* () {
    let stuFid = fingerPrintEnrollingUser;
    if (!(stuFid === null || stuFid === void 0 ? void 0 : stuFid.id)) {
        try {
            stuFid = yield database.fingerprint().find(student.matric);
        }
        catch (err) {
            // send error message to the window that sent the command
            event.sender.send('serial-data', { error: 'Error fetching fingerprint data' });
            console.error('Failed to find fingerprint:', err);
        }
    }
    if ((stuFid === null || stuFid === void 0 ? void 0 : stuFid.fid1) === null || (stuFid === null || stuFid === void 0 ? void 0 : stuFid.fid2) === null) {
        // send error message to the window that sent the command
        event.sender.send('serial-data', { error: 'Fingerprint not found' });
        return;
    }
    if (stuFid) {
        student.fid1 = stuFid.fid1;
        student.fid2 = stuFid.fid2;
    }
    else {
        event.sender.send('serial-data', { error: 'Fingerprint not found' });
        return;
    }
    student.createdAt = new Date();
    try {
        // Perform the enrollment logic here
        const result = yield database.student().enroll(student); // Example function
        event.reply('enroll-student-response', { result });
        // send the new student to main window
        mainWindow.webContents.send('new-student', result);
        // remove the old data from the fingerprint table
        yield database.fingerprint().remove(student.matric);
    }
    catch (error) {
        event.reply('enroll-student-response', { error });
    }
}));
// create a listener for handling staff form submission from the react app
electron_1.ipcMain.on('enroll-staff', (event, staff) => __awaiter(void 0, void 0, void 0, function* () {
    let staffFID = fingerPrintEnrollingUser;
    if (!(staffFID === null || staffFID === void 0 ? void 0 : staffFID.id)) {
        try {
            staffFID = yield database.fingerprint().find(staff.email);
        }
        catch (err) {
            // send error message to the window that sent the command
            event.reply('enroll-staff-response', { error: err });
        }
    }
    if ((staffFID === null || staffFID === void 0 ? void 0 : staffFID.fid1) === null || (staffFID === null || staffFID === void 0 ? void 0 : staffFID.fid2) === null) {
        // send error message to the window that sent the command
        event.reply('enroll-staff-response', { message: 'Fingerprint not found' });
        // remove the old data from the fingerprint table
        const removed = yield database.fingerprint().remove(staff.email);
        return;
    }
    if (staffFID) {
        staff.fid1 = staffFID.fid1;
        staff.fid2 = staffFID.fid2;
    }
    else {
        event.reply('enroll-staff-response', { error: 'Fingerprint data is null' });
        return;
    }
    staff.createdAt = new Date();
    staff.password = staff.password || 'biometricAttendanceSystemPassword';
    try {
        // Perform the enrollment logic here
        const result = yield database.staff().enroll(staff);
        // remove the old data from the fingerprint table
        const removed = yield database.fingerprint().remove(staff.email);
        event.reply('enroll-staff-response', { result });
        // send the new staff to main window
        mainWindow.webContents.send('new-staff', result);
    }
    catch (error) {
        event.reply('enroll-staff-response', { error });
    }
}));
electron_1.ipcMain.on('create-course', (event, course) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        course.createdBy = user.email;
        const result = yield database.course().create(course);
        event.reply('create-course-response', { result });
        // send the new course to main window
        mainWindow.webContents.send('new-course', result);
    }
    catch (error) {
        event.reply('create-course-response', { error });
    }
}));
//lets create a listener for fetching all courses
electron_1.ipcMain.on('get-courses', (event) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield database.course().getAll();
        event.reply('get-courses-response', { result });
    }
    catch (error) {
        event.reply('get-courses-response', { error });
    }
}));
//lets create a listener for fetching all students
electron_1.ipcMain.on('get-students', (event) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield database.student().getAll();
        event.reply('get-students-response', { result });
    }
    catch (error) {
        event.reply('get-students-response', { error });
    }
}));
// lets create a listener for fetching all staff
electron_1.ipcMain.on('get-staff', (event) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield database.staff().getAll();
        event.reply('get-staff-response', { result });
    }
    catch (error) {
        event.reply('get-staff-response', { error });
    }
}));
// lets create a listener for staff login
electron_1.ipcMain.on('staff-login', (event, payload, url) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield database.staff().login(payload.email, payload.password);
        event.reply('staff-login-response', { result });
        user = result;
    }
    catch (error) {
        event.reply('staff-login-response', { error });
    }
}));
// lets create a listener for staff fingerprint login
electron_1.ipcMain.on('staff-fingerprint-login', (event) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        fingerprintLoginIn = true;
        // send the search command to the scanner
        port.write("search\n");
        scanner = {
            inUse: true,
            //@ts-ignore
            window: event.sender,
            timestamp: Date.now()
        };
        // the rest is handled by the serial data event
    }
    catch (error) {
        event.reply('staff-fingerprint-login-response', { error });
    }
}));
// create a listener for geting the connect state of the scanner
electron_1.ipcMain.on('get-scanner-state', (event) => {
    event.reply('scanner-state-response', { result: { connected, inUse: scanner.inUse } });
});
// create a listener to get the count of staffs
electron_1.ipcMain.on('get-staff-count', (event) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield database.staff().count();
        event.reply('get-staff-count-response', { result });
    }
    catch (error) {
        event.reply('get-staff-count-response', { error });
    }
}));
// create a listener for fetching all students from a level
electron_1.ipcMain.on('get-students-from-level', (event, level) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let result = yield database.student().getByLevel(level);
        event.reply('get-students-from-level-response', { result });
    }
    catch (error) {
        event.reply('get-students-from-level-response', { error });
    }
}));
// create a listener for fetching all the attenddances of a course
electron_1.ipcMain.on('get-course-attendance', (event, course) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let result = yield database.studentAttendance().getByCourseCode(course);
        event.reply('get-course-attendance-response' + course.trim().replace(' ', '-'), { result });
    }
    catch (error) {
        event.reply('get-course-attendance-response' + course.trim().replace(' ', '-'), { error });
    }
}));
// create a listener for fetching student by matric
electron_1.ipcMain.on('get-student-by-matric', (event, matric) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let result = yield database.student().findByMatricNumber(matric);
        event.reply('get-student-by-matric-response', { result });
    }
    catch (error) {
        event.reply('get-student-by-matric-response', { error });
    }
}));
// lets create a listener for getting a course by course code
electron_1.ipcMain.on('get-course', (event, courseCode) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let result = yield database.course().getByCourseCode(courseCode);
        event.reply('get-course-response', { result });
    }
    catch (error) {
        event.reply('get-course-response', { error });
    }
}));
// create a listener for fetching course by level
electron_1.ipcMain.on('get-courses-by-level', (event, level) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let result = yield database.course().getByLevel(level);
        event.reply('get-courses-by-level-response', { result });
    }
    catch (error) {
        event.reply('get-courses-by-level-response', { error });
    }
}));
// create a listener for marking attendance
electron_1.ipcMain.on('mark-attendance', (event, courseCode, date) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (fingerPrintTakingAttendance.inUse) {
            if (fingerPrintTakingAttendance.courseCode === courseCode) {
                // @ts-ignore
                scanner.window = event.sender;
                // send search command to the scanner
                port.write("search\n");
                return;
            }
            else {
                event.reply('mark-attendance-response', { error: `Attendance already being taken for ${fingerPrintTakingAttendance.courseCode}. Please stop the current attendance process before starting a new one.` });
                return;
            }
        }
        date = date || new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
        let course = yield database.course().getByCourseCode(courseCode);
        if (!course || !course.students) {
            event.reply('mark-attendance-response', { error: 'Course not found or no students enrolled in the course' });
            return;
        }
        // @ts-ignore
        scanner = {
            inUse: true,
            //@ts-ignore
            window: event.sender,
            timestamp: Date.now()
        };
        fingerPrintTakingAttendance = {
            inUse: true,
            courseCode,
            course,
            date
        };
        // send search command to the scanner
        port.write("search\n");
    }
    catch (error) {
        event.reply('mark-attendance-response', { error });
    }
}));
// create a listener for stopping attendance
electron_1.ipcMain.on('stop-marking-attendance', (event) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const wasExamAttendance = (_a = fingerPrintTakingAttendance.courseCode) === null || _a === void 0 ? void 0 : _a.endsWith('_EXAM');
        fingerPrintTakingAttendance = {
            inUse: false,
            courseCode: null,
            course: null,
            date: null
        };
        // Reset scanner state
        scanner = {
            inUse: false,
            window: null,
            timestamp: null
        };
        const message = wasExamAttendance ? 'Exam attendance checking stopped' : 'Attendance stopped';
        event.reply('stop-marking-attendance-response', { message });
    }
    catch (error) {
        event.reply('stop-marking-attendance-response', { error });
    }
}));
// create a listener for updateting students of a course
electron_1.ipcMain.on('update-course-students', (event, courseCode, students) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let result = yield database.course().updateStudents(courseCode, students);
        // if we have an ongoing attendance and its this course, update the students
        if (fingerPrintTakingAttendance.inUse && fingerPrintTakingAttendance.courseCode === courseCode) {
            fingerPrintTakingAttendance.course.students = students;
        }
        event.reply('update-course-students-response', { result });
    }
    catch (error) {
        event.reply('update-course-students-response', { error });
    }
}));
// create a listener for updating a course
electron_1.ipcMain.on('update-course', (event, courseCode, courseData) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let result = yield database.course().updateCourse(courseCode, courseData);
        event.reply('update-course-response', { result });
        // send the updated course to main window
        mainWindow.webContents.send('updated-course', result);
    }
    catch (error) {
        event.reply('update-course-response', { error });
    }
}));
// create a listener for deleting a course provided the course code
electron_1.ipcMain.on('delete-course', (event, courseCode) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let result = yield database.course().remove(courseCode);
        event.reply('delete-course-response', { result });
    }
    catch (error) {
        event.reply('delete-course-response', { error });
    }
}));
// create a exporting students to csv listener. it should get the data from the database and trigger a download
electron_1.ipcMain.on('export-students-to-csv', (event) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let csv = yield database.student().exportToCSV();
        // Show save dialog
        const { filePath } = yield electron_1.dialog.showSaveDialog({
            title: 'Save CSV',
            defaultPath: path.join(__dirname, 'students.csv'),
            filters: [
                { name: 'CSV Files', extensions: ['csv'] }
            ]
        });
        if (filePath) {
            // Write the CSV file
            fs_1.default.writeFileSync(filePath, csv);
            event.reply('export-students-to-csv-response', { success: true });
        }
        else {
            event.reply('export-students-to-csv-response', { error: 'Save dialog was canceled' });
        }
    }
    catch (error) {
        event.reply('export-students-to-csv-response', { error });
    }
}));
// create a exporting courses to csv listener. it should get the data from the database and trigger a download
electron_1.ipcMain.on('export-courses-to-csv', (event) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let csv = yield database.course().exportToCSV();
        // Show save dialog
        const { filePath } = yield electron_1.dialog.showSaveDialog({
            title: 'Save CSV',
            defaultPath: path.join(__dirname, 'courses.csv'),
            filters: [
                { name: 'CSV Files', extensions: ['csv'] }
            ]
        });
        if (filePath) {
            // Write the CSV file
            fs_1.default.writeFileSync(filePath, csv);
            event.reply('export-courses-to-csv-response', { success: true });
        }
        else {
            event.reply('export-courses-to-csv-response', { error: 'Save dialog was canceled' });
        }
    }
    catch (error) {
        event.reply('export-courses-to-csv-response', { error });
    }
}));
// create a exporting attendance to csv listener. it should get the data from the database and trigger a download
electron_1.ipcMain.on('export-attendance-to-csv', (event) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let csv = yield database.studentAttendance().exportToCSV();
        // Show save dialog
        const { filePath } = yield electron_1.dialog.showSaveDialog({
            title: 'Save CSV',
            defaultPath: path.join(__dirname, 'attendance.csv'),
            filters: [
                { name: 'CSV Files', extensions: ['csv'] }
            ]
        });
        if (filePath) {
            // Write the CSV file
            fs_1.default.writeFileSync(filePath, csv);
            event.reply('export-attendance-to-csv-response', { success: true });
        }
        else {
            event.reply('export-attendance-to-csv-response', { error: 'Save dialog was canceled' });
        }
    }
    catch (error) {
        event.reply('export-attendance-to-csv-response', { error });
    }
}));
// create a listener for fetching all staffs
electron_1.ipcMain.on('get-staffs', (event) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield database.staff().getAll();
        event.reply('get-staffs-response', { result });
    }
    catch (error) {
        event.reply('get-staffs-response', { error });
    }
}));
// create a listener for marking manual attendance
electron_1.ipcMain.on('mark-manual-attendance', (event, studentMatric, courseCode, date) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        date = date || new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
        // Check if student exists
        const student = yield database.student().findByMatricNumber(studentMatric);
        if (!student) {
            event.reply('mark-manual-attendance-response', { error: 'Student not found' });
            return;
        }
        // Check if course exists
        const course = yield database.course().getByCourseCode(courseCode);
        if (!course) {
            event.reply('mark-manual-attendance-response', { error: 'Course not found' });
            return;
        }
        // Check if student is enrolled in the course
        const courseStudents = JSON.parse(course.students || '[]');
        if (!courseStudents.includes(studentMatric)) {
            event.reply('mark-manual-attendance-response', { error: 'Student is not enrolled in this course' });
            return;
        }
        // Check if attendance is already marked
        const existingAttendance = yield database.studentAttendance().getByCourseCodeAndDate(courseCode, date);
        const alreadyMarked = existingAttendance.some((attendance) => attendance.studentMatric === studentMatric);
        if (alreadyMarked) {
            event.reply('mark-manual-attendance-response', { error: 'Attendance already marked for this student today' });
            return;
        }
        // Mark attendance
        const attendanceRecord = {
            studentMatric,
            courseCode,
            date,
            timestamp: new Date(),
            mode: 'manual',
            createdAt: new Date()
        };
        const result = yield database.studentAttendance().markAttendance(attendanceRecord);
        event.reply('mark-manual-attendance-response', { result });
    }
    catch (error) {
        event.reply('mark-manual-attendance-response', { error });
    }
}));
// create a listener for getting attendance statistics
electron_1.ipcMain.on('get-attendance-stats', (event, courseCode, date) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield database.studentAttendance().getAttendanceStats(courseCode, date);
        event.reply('get-attendance-stats-response', { result });
    }
    catch (error) {
        event.reply('get-attendance-stats-response', { error });
    }
}));
// create a listener for getting student attendance by matric and course
electron_1.ipcMain.on('get-student-attendance', (event, studentMatric, courseCode) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let result;
        if (courseCode) {
            result = yield database.studentAttendance().getByStudentMatricAndCourse(studentMatric, courseCode);
        }
        else {
            result = yield database.studentAttendance().getByStudentMatric(studentMatric);
        }
        event.reply('get-student-attendance-response', { result });
    }
    catch (error) {
        event.reply('get-student-attendance-response', { error });
    }
}));
// create a listener for deleting student
electron_1.ipcMain.on('delete-student', (event, studentMatric) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const res = yield database.student().deleteByMatric(studentMatric);
        event.reply('delete-student-response', { result: true });
    }
    catch (error) {
        event.reply('delete-student-response', { error });
    }
}));
// create a listener for deleting staff
electron_1.ipcMain.on('delete-staff', (event, staffId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield database.staff().deleteById(staffId);
        event.reply('delete-staff-response', { result: true });
    }
    catch (error) {
        event.reply('delete-staff-response', { error });
    }
}));
// create a listener for updating a student
electron_1.ipcMain.on('update-student', (event, studentMatric, studentData) => __awaiter(void 0, void 0, void 0, function* () {
    let stuFid = fingerPrintEnrollingUser;
    if (!studentData.fid1 && !studentData.fid2) {
        if (!(stuFid === null || stuFid === void 0 ? void 0 : stuFid.id)) {
            try {
                stuFid = yield database.fingerprint().find(studentData.matric);
            }
            catch (err) {
                // send error message to the window that sent the command
                event.reply('serial-data', { error: 'Error fetching fingerprint data' });
                console.error('Failed to find fingerprint:', err);
            }
        }
        if ((stuFid === null || stuFid === void 0 ? void 0 : stuFid.fid1) === null || (stuFid === null || stuFid === void 0 ? void 0 : stuFid.fid2) === null) {
            // send error message to the window that sent the command
            event.reply('serial-data', { error: 'Fingerprint not found' });
            return;
        }
        if (stuFid) {
            studentData.fid1 = stuFid.fid1;
            studentData.fid2 = stuFid.fid2;
        }
        else {
            event.reply('serial-data', { error: 'Fingerprint not found' });
            return;
        }
    }
    studentData.createdAt = new Date();
    try {
        const result = yield database.student().updateStudentData(studentMatric, studentData);
        // delete the old fingerprint data
        yield database.fingerprint().remove(studentMatric);
        event.reply('update-student-response', { result });
    }
    catch (error) {
        event.reply('update-student-response', { error });
    }
}));
// create a listener for updating staff
electron_1.ipcMain.on('update-staff', (event, staffEmail, staffData) => __awaiter(void 0, void 0, void 0, function* () {
    let staffFID = fingerPrintEnrollingUser;
    if (!staffData.fid1 && !staffData.fid2) {
        if (!(staffFID === null || staffFID === void 0 ? void 0 : staffFID.id)) {
            try {
                staffFID = yield database.fingerprint().find(staffData.email);
            }
            catch (err) {
                // send error message to the window that sent the command
                event.reply('serial-data', { error: 'Error fetching fingerprint data' });
                console.error('Failed to find fingerprint:', err);
            }
        }
        if ((staffFID === null || staffFID === void 0 ? void 0 : staffFID.fid1) === null || (staffFID === null || staffFID === void 0 ? void 0 : staffFID.fid2) === null) {
            // send error message to the window that sent the command
            event.reply('serial-data', { error: 'Fingerprint not found' });
            return;
        }
        if (staffFID) {
            staffData.fid1 = staffFID.fid1;
            staffData.fid2 = staffFID.fid2;
        }
        else {
            event.reply('serial-data', { error: 'Fingerprint not found' });
            return;
        }
    }
    staffData.createdAt = new Date();
    try {
        const result = yield database.staff().updateStaffData(staffEmail, staffData);
        // delete the old fingerprint data
        yield database.fingerprint().remove(staffEmail);
        event.reply('update-staff-response', { result });
    }
    catch (error) {
        event.reply('update-staff-response', { error });
    }
}));
// create a listener for deleting student attendance
// ipcMain.on('delete-student-attendance', async (event: { reply: (arg0: string, arg1: { result?: boolean; error?: unknown; }) => void; }, studentMatric: string, courseCode: string, date: string) => {
//   try {
//     const result = await database.studentAttendance().deleteByStudentMatricAndCourse(studentMatric, courseCode, date);
//     event.reply('delete-student-attendance-response', { result });
//   } catch (error) {
//     event.reply('delete-student-attendance-response', { error });
//   }
// });
// create a deleting a student fids given their matric number
electron_1.ipcMain.on('delete-student-fids', (event, studentMatric) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // First, get the student data to retrieve their FIDs
        const student = yield database.student().findByMatricNumber(studentMatric);
        if (!student) {
            event.reply('delete-student-fids-response', { error: 'Student not found' });
            return;
        }
        // Check if student has enrolled fingerprints
        if (!student.fid1 && !student.fid2) {
            event.reply('delete-student-fids-response', { error: 'Student has no enrolled fingerprints' });
            return;
        }
        // Check if scanner is available and not in use
        if (!connected) {
            event.reply('delete-student-fids-response', { error: 'Fingerprint scanner is not connected' });
            return;
        }
        if (scanner.inUse) {
            event.reply('delete-student-fids-response', { error: 'Scanner is currently in use. Please try again later.' });
            return;
        }
        // Set scanner as in use for this operation
        scanner.inUse = true;
        scanner.timestamp = Date.now();
        let deletionPromises = [];
        let deletedFids = [];
        // Delete FID1 from scanner if it exists
        if (student.fid1 !== null && student.fid1 !== undefined) {
            deletionPromises.push(new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error(`Timeout deleting FID1 (${student.fid1}) from scanner`));
                }, 5000);
                const dataHandler = (data) => {
                    var _a;
                    try {
                        const response = JSON.parse(data.toString().trim());
                        if (response.command === 'delete' && ((_a = response.result) === null || _a === void 0 ? void 0 : _a.id) === student.fid1) {
                            clearTimeout(timeout);
                            port.removeListener('data', dataHandler);
                            deletedFids.push(student.fid1);
                            resolve(true);
                        }
                    }
                    catch (err) {
                        // Ignore parsing errors for other data
                    }
                };
                port.on('data', dataHandler);
                port.write(`delete ${student.fid1}\n`);
            }));
        }
        // Delete FID2 from scanner if it exists
        if (student.fid2 !== null && student.fid2 !== undefined) {
            deletionPromises.push(new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error(`Timeout deleting FID2 (${student.fid2}) from scanner`));
                }, 5000);
                const dataHandler = (data) => {
                    var _a;
                    try {
                        const response = JSON.parse(data.toString().trim());
                        if (response.command === 'delete' && ((_a = response.result) === null || _a === void 0 ? void 0 : _a.id) === student.fid2) {
                            clearTimeout(timeout);
                            port.removeListener('data', dataHandler);
                            deletedFids.push(student.fid2);
                            resolve(true);
                        }
                    }
                    catch (err) {
                        // Ignore parsing errors for other data
                    }
                };
                port.on('data', dataHandler);
                port.write(`delete ${student.fid2}\n`);
            }));
        }
        // Wait for all deletions to complete (with some delay between commands)
        if (deletionPromises.length > 0) {
            yield new Promise(resolve => setTimeout(resolve, 100)); // Small delay between commands
            yield Promise.allSettled(deletionPromises);
        }
        // Clear the FIDs from the database regardless of scanner deletion success
        const result = yield database.student().clearFids(studentMatric);
        // Release scanner
        scanner.inUse = false;
        scanner.timestamp = null;
        event.reply('delete-student-fids-response', {
            result: true
        });
    }
    catch (error) {
        // Make sure to release scanner on error
        scanner.inUse = false;
        scanner.timestamp = null;
        console.error('Error deleting student FIDs:', error);
        event.reply('delete-student-fids-response', {
            error: error instanceof Error ? error.message : String(error)
        });
    }
}));
// create a listener for deleting staff fids given their email
electron_1.ipcMain.on('delete-staff-fids', (event, staffEmail) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // First, get the staff data to retrieve their FIDs
        const staff = yield database.staff().findByEmail(staffEmail);
        if (!staff) {
            event.reply('delete-staff-fids-response', { error: 'Staff not found' });
            return;
        }
        // Check if staff has enrolled fingerprints
        if (!staff.fid1 && !staff.fid2) {
            event.reply('delete-staff-fids-response', { error: 'Staff has no enrolled fingerprints' });
            return;
        }
        // Check if scanner is available and not in use
        if (!connected) {
            event.reply('delete-staff-fids-response', { error: 'Fingerprint scanner is not connected' });
            return;
        }
        if (scanner.inUse) {
            event.reply('delete-staff-fids-response', { error: 'Scanner is currently in use. Please try again later.' });
            return;
        }
        // Set scanner as in use for this operation
        scanner.inUse = true;
        scanner.timestamp = Date.now();
        let deletionPromises = [];
        let deletedFids = [];
        // Delete FID1 from scanner if it exists
        if (staff.fid1 !== null && staff.fid1 !== undefined) {
            deletionPromises.push(new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error(`Timeout deleting FID1 (${staff.fid1}) from scanner`));
                }, 5000);
                const dataHandler = (data) => {
                    var _a;
                    try {
                        const response = JSON.parse(data.toString().trim());
                        if (response.command === 'delete' && ((_a = response.result) === null || _a === void 0 ? void 0 : _a.id) === staff.fid1) {
                            clearTimeout(timeout);
                            port.removeListener('data', dataHandler);
                            deletedFids.push(staff.fid1);
                            resolve(true);
                        }
                    }
                    catch (err) {
                        // Ignore parsing errors for other data
                    }
                };
                port.on('data', dataHandler);
                port.write(`delete ${staff.fid1}\n`);
            }));
        }
        // Delete FID2 from scanner if it exists
        if (staff.fid2 !== null && staff.fid2 !== undefined) {
            deletionPromises.push(new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error(`Timeout deleting FID2 (${staff.fid2}) from scanner`));
                }, 5000);
                const dataHandler = (data) => {
                    var _a;
                    try {
                        const response = JSON.parse(data.toString().trim());
                        if (response.command === 'delete' && ((_a = response.result) === null || _a === void 0 ? void 0 : _a.id) === staff.fid2) {
                            clearTimeout(timeout);
                            port.removeListener('data', dataHandler);
                            deletedFids.push(staff.fid2);
                            resolve(true);
                        }
                    }
                    catch (err) {
                        // Ignore parsing errors for other data
                    }
                };
                port.on('data', dataHandler);
                port.write(`delete ${staff.fid2}\n`);
            }));
        }
        // Wait for all deletions to complete (with some delay between commands)
        if (deletionPromises.length > 0) {
            yield new Promise(resolve => setTimeout(resolve, 100)); // Small delay between commands
            yield Promise.allSettled(deletionPromises);
        }
        // Clear the FIDs from the database regardless of scanner deletion success
        const result = yield database.staff().clearFids(staffEmail);
        // Release scanner
        scanner.inUse = false;
        scanner.timestamp = null;
        event.reply('delete-staff-fids-response', {
            result: true
        });
    }
    catch (error) {
        // Make sure to release scanner on error
        scanner.inUse = false;
        scanner.timestamp = null;
        console.error('Error deleting staff FIDs:', error);
        event.reply('delete-staff-fids-response', {
            error: error instanceof Error ? error.message : String(error)
        });
    }
}));
// lets create a listener for clearing the fingerprint scanner. the staff must provid their passowrd and must be the logged in user
// lets create a listener for clearing the fingerprint scanner. the staff must provide their password and must be the logged in user
electron_1.ipcMain.on('clear-fingerprint-scanner', (event, password) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!password) {
            event.reply('clear-fingerprint-scanner-response', { error: 'Password is required' });
            return;
        }
        // verify password
        const verified = database.staff().verifyPassword(user.email, password);
        if (!verified) {
            event.reply('clear-fingerprint-scanner-response', { error: 'Incorrect password' });
            return;
        }
        if (!connected) {
            event.reply('clear-fingerprint-scanner-response', { error: 'Fingerprint scanner is not connected' });
            return;
        }
        if (scanner.inUse) {
            event.reply('clear-fingerprint-scanner-response', { error: 'Scanner is currently in use. Please try again later.' });
            return;
        }
        // Set scanner as in use for this operation
        scanner.inUse = true;
        scanner.timestamp = Date.now();
        let responseBuffer = '';
        let timeout;
        const dataHandler = (data) => {
            responseBuffer += data.toString();
            // Try to parse JSON - it might be complete now
            try {
                const response = JSON.parse(responseBuffer.trim());
                // Check if this is the clear response we're waiting for
                if (response.event === 'message' && response.message === 'Database emptied successfully.') {
                    clearTimeout(timeout);
                    port.removeListener('data', dataHandler);
                    // Clear the fingerprint data from the database if needed
                    // database.fingerprint().clearAll();
                    event.reply('clear-fingerprint-scanner-response', { result: true });
                    // Release scanner
                    scanner.inUse = false;
                    scanner.timestamp = null;
                }
                else if (response.event === 'error' || response.error) {
                    clearTimeout(timeout);
                    port.removeListener('data', dataHandler);
                    event.reply('clear-fingerprint-scanner-response', {
                        error: response.message || response.error || 'Failed to clear fingerprint scanner'
                    });
                    // Release scanner
                    scanner.inUse = false;
                    scanner.timestamp = null;
                }
            }
            catch (parseError) {
                // JSON is not complete yet, continue collecting data
                console.log('JSON not complete yet, waiting for more data...');
            }
        };
        // Set up timeout
        timeout = setTimeout(() => {
            port.removeListener('data', dataHandler);
            console.log('Timeout waiting for clear response');
            event.reply('clear-fingerprint-scanner-response', { error: 'Timeout waiting for clear response' });
            scanner.inUse = false;
            scanner.timestamp = null;
        }, 15000); // 15 second timeout for clear operation
        // Listen for data
        port.on('data', dataHandler);
        // Send clear command to the scanner
        port.write("clear\n");
    }
    catch (error) {
        // Make sure to release scanner on error
        scanner.inUse = false;
        scanner.timestamp = null;
        event.reply('clear-fingerprint-scanner-response', {
            error: error instanceof Error ? error.message : String(error)
        });
    }
}));
// lets create a listener for deletin an fid from the scanner
electron_1.ipcMain.on('delete-fid', (event, fid) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!connected) {
            event.reply('delete-fid-response', { error: 'Fingerprint scanner is not connected' });
            return;
        }
        if (scanner.inUse) {
            event.reply('delete-fid-response', { error: 'Scanner is currently in use. Please try again later.' });
            return;
        }
        // Set scanner as in use for this operation
        scanner.inUse = true;
        scanner.timestamp = Date.now();
        let responseBuffer = '';
        let timeout;
        const dataHandler = (data) => {
            responseBuffer += data.toString();
            // Try to parse JSON - it might be complete now
            try {
                const response = JSON.parse(responseBuffer.trim());
                // Check if this is the delete response we're waiting for
                if (response.command === 'delete' && response.event === 'result') {
                    clearTimeout(timeout);
                    port.removeListener('data', dataHandler);
                    if (response.result && response.result.id === fid) {
                        event.reply('delete-fid-response', { result: true });
                    }
                    else {
                        event.reply('delete-fid-response', { error: 'Failed to delete fingerprint' });
                    }
                    // Release scanner
                    scanner.inUse = false;
                    scanner.timestamp = null;
                }
            }
            catch (parseError) {
                // JSON is not complete yet, continue collecting data
                console.log('JSON not complete yet, waiting for more data...');
            }
        };
        // Set up timeout
        timeout = setTimeout(() => {
            port.removeListener('data', dataHandler);
            event.reply('delete-fid-response', { error: 'Timeout waiting for delete response' });
            scanner.inUse = false;
            scanner.timestamp = null;
        }, 10000); // 10 second timeout
        // Listen for data
        port.on('data', dataHandler);
        // Send delete command to the scanner
        port.write(`delete ${fid}\n`);
    }
    catch (error) {
        // Make sure to release scanner on error
        scanner.inUse = false;
        scanner.timestamp = null;
        console.error('Error deleting fingerprint:', error);
        event.reply('delete-fid-response', {
            error: error instanceof Error ? error.message : String(error)
        });
    }
}));
// lets create a listener for getting staff by id
electron_1.ipcMain.on('get-staff-by-id', (event, staffId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const staff = yield database.staff().findById(staffId);
        if (!staff) {
            event.reply('get-staff-by-id-response', { error: 'Staff not found' });
            return;
        }
        event.reply('get-staff-by-id-response', { result: staff });
    }
    catch (error) {
        console.error('Error getting staff by id:', error);
        event.reply('get-staff-by-id-response', { error: error instanceof Error ? error.message : String(error) });
    }
}));
// Database export listener
electron_1.ipcMain.on('export-database', (event) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Show save dialog for export location
        const { filePath } = yield electron_1.dialog.showSaveDialog({
            title: 'Export Database',
            defaultPath: path.join(__dirname, `database-backup-${new Date().toISOString().split('T')[0]}.json`),
            filters: [
                { name: 'JSON Files', extensions: ['json'] },
                { name: 'All Files', extensions: ['*'] }
            ]
        });
        if (filePath) {
            // Export database to the selected file
            const exportedFilePath = yield database.ldb().exportToFile(filePath);
            event.reply('export-database-response', {
                success: true,
                filePath: exportedFilePath
            });
        }
        else {
            event.reply('export-database-response', {
                error: 'Export dialog was canceled'
            });
        }
    }
    catch (error) {
        console.error('Error exporting database:', error);
        event.reply('export-database-response', {
            error: error instanceof Error ? error.message : String(error)
        });
    }
}));
// Database import listener
electron_1.ipcMain.on('import-database', (event) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Show open dialog for import file selection
        const { filePaths } = yield electron_1.dialog.showOpenDialog({
            title: 'Import Database',
            filters: [
                { name: 'JSON Files', extensions: ['json'] },
                { name: 'All Files', extensions: ['*'] }
            ],
            properties: ['openFile']
        });
        if (filePaths && filePaths.length > 0) {
            const filePath = filePaths[0];
            // Show confirmation dialog as this is a destructive operation
            const confirmResult = yield electron_1.dialog.showMessageBox({
                type: 'warning',
                title: 'Confirm Database Import',
                message: 'Are you sure you want to import this database?',
                detail: 'This operation will only proceed if the current database is empty. All existing data would be replaced if the database is cleared first.',
                buttons: ['Cancel', 'Import'],
                defaultId: 0,
                cancelId: 0
            });
            if (confirmResult.response === 1) { // User clicked Import
                // Import database from the selected file
                const result = yield database.ldb().importFromFile(filePath);
                if (result) {
                    event.reply('import-database-response', {
                        success: true
                    });
                    // Notify all windows that database has been updated
                    serialEnabledWindows.forEach(win => {
                        win.window.webContents.send('database-imported');
                    });
                    // restart the application to apply changes
                    electron_1.app.relaunch();
                    electron_1.app.exit();
                }
                else {
                    event.reply('import-database-response', {
                        error: 'Import failed'
                    });
                }
            }
            else {
                event.reply('import-database-response', {
                    error: 'Import canceled by user'
                });
            }
        }
        else {
            event.reply('import-database-response', {
                error: 'Import dialog was canceled'
            });
        }
    }
    catch (error) {
        console.error('Error importing database:', error);
        event.reply('import-database-response', {
            error: error instanceof Error ? error.message : String(error)
        });
    }
}));
// Database clear listener
electron_1.ipcMain.on('clear-database', (event, password) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!password) {
            event.reply('clear-database-response', { error: 'Password is required' });
            return;
        }
        // Verify password
        const verified = yield database.staff().verifyPassword(user.email, password);
        if (!verified) {
            event.reply('clear-database-response', { error: 'Incorrect password' });
            return;
        }
        // Show final confirmation dialog as this is a very destructive operation
        const confirmResult = yield electron_1.dialog.showMessageBox({
            type: 'error',
            title: 'Confirm Database Clear',
            message: 'Are you absolutely sure you want to clear the entire database?',
            detail: 'This action will permanently delete ALL data including students, staff, courses, attendance records, and fingerprint data. This action cannot be undone!',
            buttons: ['Cancel', 'Clear Database'],
            defaultId: 0,
            cancelId: 0
        });
        if (confirmResult.response === 1) { // User clicked Clear Database
            // Clear the database
            const result = yield database.ldb().clear();
            if (result) {
                // Reset application state
                user = {};
                fingerPrintEnrollingUser = null;
                fingerPrintTakingAttendance = {
                    inUse: false,
                    courseCode: null,
                    course: null,
                    date: null
                };
                event.reply('clear-database-response', {
                    success: true
                });
                // Notify all windows that database has been cleared
                serialEnabledWindows.forEach(win => {
                    win.window.webContents.send('database-cleared');
                });
            }
            else {
                event.reply('clear-database-response', {
                    error: 'Clear operation failed'
                });
            }
            // close the app
            electron_1.app.quit();
        }
        else {
            event.reply('clear-database-response', {
                error: 'Clear operation canceled by user'
            });
        }
    }
    catch (error) {
        console.error('Error clearing database:', error);
        event.reply('clear-database-response', {
            error: error instanceof Error ? error.message : String(error)
        });
    }
}));
// Get database statistics listener (useful for checking if database is empty)
electron_1.ipcMain.on('get-database-stats', (event) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const stats = {
            students: yield database.student().count(),
            staff: yield database.staff().count(),
            courses: yield database.course().count(),
            attendanceRecords: (yield database.studentAttendance().get()).length,
        };
        event.reply('get-database-stats-response', { result: stats });
    }
    catch (error) {
        console.error('Error getting database stats:', error);
        event.reply('get-database-stats-response', {
            error: error instanceof Error ? error.message : String(error)
        });
    }
}));
// Database backup with automatic filename listener
electron_1.ipcMain.on('backup-database', (event) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const defaultPath = path.join(__dirname, `backup-${timestamp}.json`);
        // Show save dialog with auto-generated filename
        const { filePath } = yield electron_1.dialog.showSaveDialog({
            title: 'Backup Database',
            defaultPath,
            filters: [
                { name: 'JSON Files', extensions: ['json'] },
                { name: 'All Files', extensions: ['*'] }
            ]
        });
        if (filePath) {
            // Export database to the selected file
            const exportedFilePath = yield database.ldb().exportToFile(filePath);
            event.reply('backup-database-response', {
                success: true,
                filePath: exportedFilePath
            });
        }
        else {
            event.reply('backup-database-response', {
                error: 'Backup dialog was canceled'
            });
        }
    }
    catch (error) {
        console.error('Error backing up database:', error);
        event.reply('backup-database-response', {
            error: error instanceof Error ? error.message : String(error)
        });
    }
}));
// Restore database from backup (clear + import)
electron_1.ipcMain.on('restore-database', (event, password) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!password) {
            event.reply('restore-database-response', { error: 'Password is required' });
            return;
        }
        // Verify password
        const verified = yield database.staff().verifyPassword(user.email, password);
        if (!verified) {
            event.reply('restore-database-response', { error: 'Incorrect password' });
            return;
        }
        // Show file selection dialog
        const { filePaths } = yield electron_1.dialog.showOpenDialog({
            title: 'Restore Database from Backup',
            filters: [
                { name: 'JSON Files', extensions: ['json'] },
                { name: 'All Files', extensions: ['*'] }
            ],
            properties: ['openFile']
        });
        if (filePaths && filePaths.length > 0) {
            const filePath = filePaths[0];
            // Show final confirmation dialog
            const confirmResult = yield electron_1.dialog.showMessageBox({
                type: 'warning',
                title: 'Confirm Database Restore',
                message: 'Are you sure you want to restore from this backup?',
                detail: 'This will clear all current data and replace it with the backup data. This action cannot be undone!',
                buttons: ['Cancel', 'Restore'],
                defaultId: 0,
                cancelId: 0
            });
            if (confirmResult.response === 1) { // User clicked Restore
                // Clear the database first
                yield database.ldb().clear();
                // Then import the backup
                const result = yield database.ldb().importFromFile(filePath);
                if (result) {
                    // Reset application state
                    user = {};
                    fingerPrintEnrollingUser = null;
                    fingerPrintTakingAttendance = {
                        inUse: false,
                        courseCode: null,
                        course: null,
                        date: null
                    };
                    event.reply('restore-database-response', {
                        success: true
                    });
                    // Notify all windows that database has been restored
                    serialEnabledWindows.forEach(win => {
                        win.window.webContents.send('database-restored');
                    });
                }
                else {
                    event.reply('restore-database-response', {
                        error: 'Restore operation failed'
                    });
                }
            }
            else {
                event.reply('restore-database-response', {
                    error: 'Restore operation canceled by user'
                });
            }
        }
        else {
            event.reply('restore-database-response', {
                error: 'Restore dialog was canceled'
            });
        }
    }
    catch (error) {
        console.error('Error restoring database:', error);
        event.reply('restore-database-response', {
            error: error instanceof Error ? error.message : String(error)
        });
    }
}));
// create a listener for marking exam attendance
// create a listener for marking exam attendance
electron_1.ipcMain.on('mark-exam-attendance', (event, courseCode, date) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (fingerPrintTakingAttendance.inUse) {
            if (fingerPrintTakingAttendance.courseCode === courseCode + '_EXAM') {
                // @ts-ignore
                scanner.window = event.sender;
                // send search command to the scanner
                port.write("search\n");
                return;
            }
            else {
                event.reply('mark-exam-attendance-response', { error: `Exam attendance already being taken for ${fingerPrintTakingAttendance.courseCode}. Please stop the current process before starting a new one.` });
                return;
            }
        }
        date = date || new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
        let course = yield database.course().getByCourseCode(courseCode);
        if (!course || !course.students) {
            event.reply('mark-exam-attendance-response', { error: 'Course not found or no students enrolled in the course' });
            return;
        }
        // @ts-ignore
        scanner = {
            inUse: true,
            //@ts-ignore
            window: event.sender,
            timestamp: Date.now()
        };
        // Set a special flag for exam attendance
        fingerPrintTakingAttendance = {
            inUse: true,
            courseCode: courseCode + '_EXAM', // Add suffix to distinguish from regular attendance
            course,
            date
        };
        // send search command to the scanner
        port.write("search\n");
    }
    catch (error) {
        event.reply('mark-exam-attendance-response', { error });
    }
}));
