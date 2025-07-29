"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
function openNewWindow(url, width, height, title) {
    electron_1.ipcRenderer.send('create-new-window', { url, width, height, title });
}
electron_1.ipcRenderer.on('user-data', (event, userData) => {
    if (!userData)
        return;
    window.localStorage.setItem('userData', JSON.stringify(userData));
    // You can now use the userData in your renderer process
});
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    sendSerialCommand: (command, commandId, preventDuplicate) => electron_1.ipcRenderer.send('serial-send', command, commandId, preventDuplicate),
    onSerialData: (callback) => electron_1.ipcRenderer.on('serial-data', (event, data) => callback(data)),
    onImageData: (callback) => electron_1.ipcRenderer.on('image-data', (event, data) => callback(data)),
    removeImageDataListener: () => electron_1.ipcRenderer.removeAllListeners('image-data'),
    createNewWindow: openNewWindow,
    closeWindow: (url) => electron_1.ipcRenderer.send('close-window', url),
    enrollStudent: (student) => {
        return new Promise((resolve, reject) => {
            electron_1.ipcRenderer.once('enroll-student-response', (_event, response) => {
                if (response.error) {
                    reject(response.error);
                }
                else {
                    resolve(response.result);
                }
            });
            electron_1.ipcRenderer.send('enroll-student', student, window.location.href);
        });
    },
    enrollStaff: (staff) => {
        return new Promise((resolve, reject) => {
            electron_1.ipcRenderer.once('enroll-staff-response', (_event, response) => {
                if (response.error) {
                    reject(response.error);
                }
                else {
                    resolve(response.result);
                }
            });
            electron_1.ipcRenderer.send('enroll-staff', staff, window.location.href);
        });
    },
    createCourse: (course) => {
        return new Promise((resolve, reject) => {
            electron_1.ipcRenderer.once('create-course-response', (_event, response) => {
                if (response.error) {
                    reject(response.error);
                }
                else {
                    resolve(response.result);
                }
            });
            electron_1.ipcRenderer.send('create-course', course, window.location.href);
        });
    },
    getCourses: () => {
        return new Promise((resolve, reject) => {
            electron_1.ipcRenderer.once('get-courses-response', (_event, response) => {
                if (response.error) {
                    reject(response.error);
                }
                else {
                    resolve(response.result);
                }
            });
            electron_1.ipcRenderer.send('get-courses', window.location.href);
        });
    },
    getStudents: () => {
        return new Promise((resolve, reject) => {
            electron_1.ipcRenderer.once('get-students-response', (_event, response) => {
                if (response.error) {
                    reject(response.error);
                }
                else {
                    resolve(response.result);
                }
            });
            electron_1.ipcRenderer.send('get-students', window.location.href);
        });
    },
    onNewCourse: (callback) => {
        electron_1.ipcRenderer.on('new-course', (_event, course) => callback(course));
    },
    onNewStudent: (callback) => {
        electron_1.ipcRenderer.on('new-student', (_event, student) => callback(student));
    },
    onNewStaff: (callback) => {
        electron_1.ipcRenderer.on('new-staff', (_event, staff) => callback(staff));
    },
    onScannerAvailable: (callback) => {
        electron_1.ipcRenderer.on('scanner-available', (_event, available) => callback(available));
    },
    getStaffs: () => {
        return new Promise((resolve, reject) => {
            electron_1.ipcRenderer.once('get-staffs-response', (_event, response) => {
                if (response.error) {
                    reject(response.error);
                }
                else {
                    resolve(response.result);
                }
            });
            electron_1.ipcRenderer.send('get-staffs', window.location.href);
        });
    },
    staffLogin: (email, password) => {
        return new Promise((resolve, reject) => {
            electron_1.ipcRenderer.once('staff-login-response', (_event, response) => {
                if (response.error) {
                    reject(response.error);
                }
                else {
                    resolve(response.result);
                }
            });
            electron_1.ipcRenderer.send('staff-login', { email, password }, window.location.href);
        });
    },
    staffFingerPrintLogin: () => {
        return new Promise((resolve, reject) => {
            electron_1.ipcRenderer.once('staff-fingerprint-login-response', (_event, response) => {
                if (response.error) {
                    reject(response.error);
                }
                else {
                    resolve(response.result);
                }
            });
            electron_1.ipcRenderer.send('staff-fingerprint-login', window.location.href);
        });
    },
    getScannerState: () => {
        return new Promise((resolve, reject) => {
            electron_1.ipcRenderer.once('scanner-state-response', (_event, response) => {
                if (response.error) {
                    reject(response.error);
                }
                else {
                    resolve(response.result);
                }
            });
            electron_1.ipcRenderer.send('get-scanner-state', window.location.href);
        });
    },
    getStaffCount: () => {
        return new Promise((resolve, reject) => {
            electron_1.ipcRenderer.once('get-staff-count-response', (_event, response) => {
                if (response.error) {
                    reject(response.error);
                }
                else {
                    resolve(response.result);
                }
            });
            electron_1.ipcRenderer.send('get-staff-count', window.location.href);
        });
    },
    getStudentsFromLevel: (level) => {
        return new Promise((resolve, reject) => {
            electron_1.ipcRenderer.once('get-students-from-level-response', (_event, response) => {
                if (response.error) {
                    reject(response.error);
                }
                else {
                    resolve(response.result);
                }
            });
            electron_1.ipcRenderer.send('get-students-from-level', level, window.location.href);
        });
    },
    getCourse(courseCode) {
        return new Promise((resolve, reject) => {
            electron_1.ipcRenderer.once('get-course-response', (_event, response) => {
                if (response.error) {
                    reject(response.error);
                }
                else {
                    resolve(response.result);
                }
            });
            electron_1.ipcRenderer.send('get-course', courseCode, window.location.href);
        });
    },
    getCourseAttendance: (courseCode) => {
        return new Promise((resolve, reject) => {
            electron_1.ipcRenderer.once('get-course-attendance-response' + courseCode.trim().replace(' ', '-'), (_event, response) => {
                if (response.error) {
                    reject(response.error);
                }
                else {
                    resolve(response.result);
                }
            });
            electron_1.ipcRenderer.send('get-course-attendance', courseCode);
        });
    },
    getStudentByMatric: (matric) => {
        return new Promise((resolve, reject) => {
            electron_1.ipcRenderer.once('get-student-by-matric-response', (_event, response) => {
                if (response.error) {
                    reject(response.error);
                }
                else {
                    resolve(response.result);
                }
            });
            electron_1.ipcRenderer.send('get-student-by-matric', matric, window.location.href);
        });
    },
    getStudentsByLevel: (level) => {
        return new Promise((resolve, reject) => {
            electron_1.ipcRenderer.once('get-students-from-level-response', (_event, response) => {
                if (response.error) {
                    reject(response.error);
                }
                else {
                    resolve(response.result);
                }
            });
            electron_1.ipcRenderer.send('get-students-from-level', level, window.location.href);
        });
    },
    getCoursesByLevel: (level) => {
        return new Promise((resolve, reject) => {
            electron_1.ipcRenderer.once('get-courses-by-level-response', (_event, response) => {
                if (response.error) {
                    reject(response.error);
                }
                else {
                    resolve(response.result);
                }
            });
            electron_1.ipcRenderer.send('get-courses-by-level', level, window.location.href);
        });
    },
    markAttendance: (courseCode, date) => {
        return new Promise((resolve, reject) => {
            electron_1.ipcRenderer.once('mark-attendance-response', (_event, response) => {
                if (response.error) {
                    reject(response.error);
                }
                else {
                    resolve(response.result);
                }
            });
            electron_1.ipcRenderer.send('mark-attendance', courseCode, date, window.location.href);
        });
    },
    stopMarkingAttendance: () => {
        electron_1.ipcRenderer.send('stop-marking-attendance');
    },
    updateCourseStudents: (courseCode, students) => {
        return new Promise((resolve, reject) => {
            electron_1.ipcRenderer.once('update-course-students-response', (_event, response) => {
                if (response.error) {
                    reject(response.error);
                }
                else {
                    resolve(response.result);
                }
            });
            electron_1.ipcRenderer.send('update-course-students', courseCode, students, window.location.href);
        });
    },
    updateCourse: (courseCode, courseData) => {
        return new Promise((resolve, reject) => {
            electron_1.ipcRenderer.once('update-course-response', (_event, response) => {
                if (response.error) {
                    reject(response.error);
                }
                else {
                    resolve(response.result);
                }
            });
            electron_1.ipcRenderer.send('update-course', courseCode, courseData, window.location.href);
        });
    },
    deleteCourse: (courseCode) => {
        return new Promise((resolve, reject) => {
            electron_1.ipcRenderer.once('delete-course-response', (_event, response) => {
                if (response.error) {
                    reject(response.error);
                }
                else {
                    resolve(response.result);
                }
            });
            electron_1.ipcRenderer.send('delete-course', courseCode, window.location.href);
        });
    },
    exportCoursesToCSV: () => {
        return new Promise((resolve, reject) => {
            electron_1.ipcRenderer.once('export-courses-to-csv-response', (_event, response) => {
                if (response.error) {
                    reject(response.error);
                }
                else {
                    resolve(response.result);
                }
            });
            electron_1.ipcRenderer.send('export-courses-to-csv', window.location.href);
        });
    },
    exportStudentsToCSV: () => {
        return new Promise((resolve, reject) => {
            electron_1.ipcRenderer.once('export-students-to-csv-response', (_event, response) => {
                if (response.error) {
                    reject(response.error);
                }
                else {
                    resolve(response.result);
                }
            });
            electron_1.ipcRenderer.send('export-students-to-csv', window.location.href);
        });
    },
    exportAttendanceToCSV: (courseCode) => {
        return new Promise((resolve, reject) => {
            electron_1.ipcRenderer.once('export-attendance-to-csv-response', (_event, response) => {
                if (response.error) {
                    reject(response.error);
                }
                else {
                    resolve(response.result);
                }
            });
            electron_1.ipcRenderer.send('export-attendance-to-csv', courseCode, window.location.href);
        });
    },
    // New atomic attendance methods
    markManualAttendance: (studentMatric, courseCode, date) => {
        return new Promise((resolve, reject) => {
            electron_1.ipcRenderer.once('mark-manual-attendance-response', (_event, response) => {
                if (response.error) {
                    reject(response.error);
                }
                else {
                    resolve(response.result);
                }
            });
            electron_1.ipcRenderer.send('mark-manual-attendance', studentMatric, courseCode, date);
        });
    },
    getAttendanceStats: (courseCode, date) => {
        return new Promise((resolve, reject) => {
            electron_1.ipcRenderer.once('get-attendance-stats-response', (_event, response) => {
                if (response.error) {
                    reject(response.error);
                }
                else {
                    resolve(response.result);
                }
            });
            electron_1.ipcRenderer.send('get-attendance-stats', courseCode, date);
        });
    },
    getStudentAttendance: (studentMatric, courseCode) => {
        return new Promise((resolve, reject) => {
            electron_1.ipcRenderer.once('get-student-attendance-response', (_event, response) => {
                if (response.error) {
                    reject(response.error);
                }
                else {
                    resolve(response.result);
                }
            });
            electron_1.ipcRenderer.send('get-student-attendance', studentMatric, courseCode);
        });
    },
    clearStudentFids: (matric) => {
        return new Promise((resolve, reject) => {
            electron_1.ipcRenderer.once('delete-student-fids-response', (_event, response) => {
                if (response.error) {
                    reject(response.error);
                }
                else {
                    resolve(response.result);
                }
            });
            electron_1.ipcRenderer.send('delete-student-fids', matric);
        });
    },
    clearStaffFids: (staffEmail) => {
        return new Promise((resolve, reject) => {
            electron_1.ipcRenderer.once('delete-staff-fids-response', (_event, response) => {
                if (response.error) {
                    reject(response.error);
                }
                else {
                    resolve(response.result);
                }
            });
            electron_1.ipcRenderer.send('delete-staff-fids', staffEmail);
        });
    },
    clearFingerprintScanner: (password) => {
        return new Promise((resolve, reject) => {
            electron_1.ipcRenderer.once('clear-fingerprint-scanner-response', (_event, response) => {
                if (response.error) {
                    reject(response.error);
                }
                else {
                    resolve(response.result);
                }
            });
            electron_1.ipcRenderer.send('clear-fingerprint-scanner', password);
        });
    },
    deleteStudentByMatric: (matric) => {
        return new Promise((resolve, reject) => {
            electron_1.ipcRenderer.once('delete-student-response', (_event, response) => {
                if (response.error) {
                    reject(response.error);
                }
                else {
                    resolve(response.result);
                }
            });
            electron_1.ipcRenderer.send('delete-student', matric);
        });
    },
    deleteStaffById: (staffId) => {
        return new Promise((resolve, reject) => {
            electron_1.ipcRenderer.once('delete-staff-response', (_event, response) => {
                if (response.error) {
                    reject(response.error);
                }
                else {
                    resolve(response.result);
                }
            });
            electron_1.ipcRenderer.send('delete-staff', staffId);
        });
    },
    updateStudent: (studentMatric, studentData) => {
        return new Promise((resolve, reject) => {
            electron_1.ipcRenderer.once('update-student-response', (_event, response) => {
                if (response.error) {
                    reject(response.error);
                }
                else {
                    resolve(response.result);
                }
            });
            electron_1.ipcRenderer.send('update-student', studentMatric, studentData);
        });
    },
    updateStaff: (staffId, staffData) => {
        return new Promise((resolve, reject) => {
            electron_1.ipcRenderer.once('update-staff-response', (_event, response) => {
                if (response.error) {
                    reject(response.error);
                }
                else {
                    resolve(response.result);
                }
            });
            electron_1.ipcRenderer.send('update-staff', staffId, staffData);
        });
    },
    deleteFIDFromScanner: (fid) => {
        return new Promise((resolve, reject) => {
            electron_1.ipcRenderer.once('delete-fid-response', (_event, response) => {
                if (response.error) {
                    reject(response.error);
                }
                else {
                    resolve(response.result);
                }
            });
            electron_1.ipcRenderer.send('delete-fid', fid);
        });
    },
    getStaffById: (staffId) => {
        return new Promise((resolve, reject) => {
            electron_1.ipcRenderer.once('get-staff-by-id-response', (_event, response) => {
                if (response.error) {
                    reject(response.error);
                }
                else {
                    resolve(response.result);
                }
            });
            electron_1.ipcRenderer.send('get-staff-by-id', staffId);
        });
    },
    deleteFID(fid) {
        return new Promise((resolve, reject) => {
            electron_1.ipcRenderer.once('delete-fid-response', (_event, response) => {
                if (response.error) {
                    reject(response.error);
                }
                else {
                    resolve(response.result);
                }
            });
            electron_1.ipcRenderer.send('delete-fid', fid);
        });
    },
    // Database Management Methods
    exportDatabase: () => {
        return new Promise((resolve, reject) => {
            electron_1.ipcRenderer.once('export-database-response', (_event, response) => {
                if (response.error) {
                    reject(response.error);
                }
                else {
                    resolve(response);
                }
            });
            electron_1.ipcRenderer.send('export-database');
        });
    },
    importDatabase: () => {
        return new Promise((resolve, reject) => {
            electron_1.ipcRenderer.once('import-database-response', (_event, response) => {
                if (response.error) {
                    reject(response.error);
                }
                else {
                    resolve(response);
                }
            });
            electron_1.ipcRenderer.send('import-database');
        });
    },
    clearDatabase: (password) => {
        return new Promise((resolve, reject) => {
            electron_1.ipcRenderer.once('clear-database-response', (_event, response) => {
                if (response.error) {
                    reject(response.error);
                }
                else {
                    resolve(response);
                }
            });
            electron_1.ipcRenderer.send('clear-database', password);
        });
    },
    backupDatabase: () => {
        return new Promise((resolve, reject) => {
            electron_1.ipcRenderer.once('backup-database-response', (_event, response) => {
                if (response.error) {
                    reject(response.error);
                }
                else {
                    resolve(response);
                }
            });
            electron_1.ipcRenderer.send('backup-database');
        });
    },
    restoreDatabase: () => {
        return new Promise((resolve, reject) => {
            electron_1.ipcRenderer.once('restore-database-response', (_event, response) => {
                if (response.error) {
                    reject(response.error);
                }
                else {
                    resolve(response);
                }
            });
            electron_1.ipcRenderer.send('restore-database');
        });
    },
    getDatabaseStats: () => {
        return new Promise((resolve, reject) => {
            electron_1.ipcRenderer.once('get-database-stats-response', (_event, response) => {
                if (response.error) {
                    reject(response.error);
                }
                else {
                    resolve(response.result);
                }
            });
            electron_1.ipcRenderer.send('get-database-stats');
        });
    },
    markExamAttendance: (courseCode, date) => {
        return new Promise((resolve, reject) => {
            electron_1.ipcRenderer.once('mark-exam-attendance-response', (_event, response) => {
                if (response.error) {
                    reject(response.error);
                }
                else {
                    resolve(response.result);
                }
            });
            electron_1.ipcRenderer.send('mark-exam-attendance', courseCode, date);
        });
    },
    // Database event listeners
    onDatabaseCleared: (callback) => {
        electron_1.ipcRenderer.on('database-cleared', () => callback());
    },
    onDatabaseImported: (callback) => {
        electron_1.ipcRenderer.on('database-imported', () => callback());
    },
    onDatabaseRestored: (callback) => {
        electron_1.ipcRenderer.on('database-restored', () => callback());
    },
    // Remove database event listeners
    removeDatabaseListeners: () => {
        electron_1.ipcRenderer.removeAllListeners('database-cleared');
        electron_1.ipcRenderer.removeAllListeners('database-imported');
        electron_1.ipcRenderer.removeAllListeners('database-restored');
    },
    // Enhanced listeners for attendance responses
    onMarkAttendanceResponse: (callback) => {
        electron_1.ipcRenderer.on('mark-attendance-response', (_event, response) => callback(response));
    },
    removeMarkAttendanceListener: () => {
        electron_1.ipcRenderer.removeAllListeners('mark-attendance-response');
    },
    onUpdatedCourse: (callback) => {
        electron_1.ipcRenderer.on('updated-course', (_event, course) => callback(course));
    },
});
// setTimeout(() => {
//   // @ts-ignore
//   window.electronAPI.exportCoursesToCSV();
//   // @ts-ignore
//   window.electronAPI.exportStudentsToCSV();
//   // @ts-ignore
//   window.electronAPI.exportAttendanceToCSV();
// },10000);
function exportCoursesToCSV() {
    throw new Error('Function not implemented.');
}
function exportStudentsToCSV() {
    throw new Error('Function not implemented.');
}
function exportAttendanceToCSV() {
    throw new Error('Function not implemented.');
}
