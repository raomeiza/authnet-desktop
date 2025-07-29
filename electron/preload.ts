import { contextBridge, ipcRenderer } from 'electron';
import { IStaff, IStudent } from './interfaces';
import { string } from 'prop-types';

function openNewWindow(url: any, width: any, height: any, title?: string) {
  ipcRenderer.send('create-new-window', { url, width, height, title });
}
ipcRenderer.on('user-data', (event, userData) => {
  if(!userData) return;
  window.localStorage.setItem('userData', JSON.stringify(userData));
  // You can now use the userData in your renderer process
});
contextBridge.exposeInMainWorld('electronAPI', {
  sendSerialCommand: (command: any, commandId?: string, preventDuplicate?: boolean) => ipcRenderer.send('serial-send', command, commandId, preventDuplicate),
  onSerialData: (callback: (arg0: any) => void) => ipcRenderer.on('serial-data', (event, data) => callback(data)),
  onImageData: (callback: (arg0: any) => void) => ipcRenderer.on('image-data', (event, data) => callback(data)),
  removeImageDataListener: () => ipcRenderer.removeAllListeners('image-data'),
  createNewWindow: openNewWindow,
  closeWindow: (url?: string) => ipcRenderer.send('close-window', url),
  enrollStudent: (student: IStudent) => {
    return new Promise((resolve, reject) => {
      ipcRenderer.once('enroll-student-response', (_event, response) => {
        if (response.error) {
          reject(response.error);
        } else {
          resolve(response.result);
        }
      });
      ipcRenderer.send('enroll-student', student, window.location.href);
    });
  },
  enrollStaff: (staff: IStaff) => {
    return new Promise((resolve, reject) => {
      ipcRenderer.once('enroll-staff-response', (_event, response) => {
        if (response.error) {
          reject(response.error);
        } else {
          resolve(response.result);
        }
      });
      ipcRenderer.send('enroll-staff', staff, window.location.href);
    });
  },
  createCourse: (course: any) => {
    return new Promise((resolve, reject) => {
      ipcRenderer.once('create-course-response', (_event, response) => {
        if (response.error) {
          reject(response.error);
        } else {
          resolve(response.result);
        }
      });
      ipcRenderer.send('create-course', course, window.location.href);
    });
  },
  getCourses: () => {
    
    return new Promise((resolve, reject) => {
      ipcRenderer.once('get-courses-response', (_event, response) => {
        if (response.error) {
          reject(response.error);
        } else {
          resolve(response.result);
        }
      });
      ipcRenderer.send('get-courses', window.location.href);
    });
  },
  getStudents: () => {
    return new Promise((resolve, reject) => {
      ipcRenderer.once('get-students-response', (_event, response) => {
        if (response.error) {
          reject(response.error);
        } else {
          resolve(response.result);
        }
      });
      ipcRenderer.send('get-students', window.location.href);
    });
  },
  onNewCourse: (callback: (course: any) => void) => {
    ipcRenderer.on('new-course', (_event, course) => callback(course));
  },
  onNewStudent: (callback: (student: any) => void) => {
    ipcRenderer.on('new-student', (_event, student) => callback(student));
  },
  onNewStaff: (callback: (staff: any) => void) => {
    ipcRenderer.on('new-staff', (_event, staff) => callback(staff));
  },
  onScannerAvailable: (callback: (available: boolean) => void) => {
    ipcRenderer.on('scanner-available', (_event, available) => callback(available));
  },
  getStaffs: () => {
    return new Promise((resolve, reject) => {
      ipcRenderer.once('get-staffs-response', (_event, response) => {
        if (response.error) {
          reject(response.error);
        } else {
          resolve(response.result);
        }
      });
      ipcRenderer.send('get-staffs', window.location.href);
    });
  },
  staffLogin: (email: string, password: string) => {
    return new Promise((resolve, reject) => {
      ipcRenderer.once('staff-login-response', (_event, response) => {
        if (response.error) {
          reject(response.error);
        } else {
          resolve(response.result);
        }
      });
      ipcRenderer.send('staff-login', { email, password }, window.location.href);
    });
  },
  staffFingerPrintLogin: () => {
    return new Promise((resolve, reject) => {
      ipcRenderer.once('staff-fingerprint-login-response', (_event, response) => {
        if (response.error) {
          reject(response.error);
        } else {
          resolve(response.result);
        }
      });
      ipcRenderer.send('staff-fingerprint-login', window.location.href);
    });
  },
  getScannerState: () => {
    return new Promise((resolve, reject) => {
      ipcRenderer.once('scanner-state-response', (_event, response) => {
        if (response.error) {
          reject(response.error);
        } else {
          resolve(response.result);
        }
      });
      ipcRenderer.send('get-scanner-state', window.location.href);
    });
  },
  getStaffCount: () => {
    return new Promise((resolve, reject) => {
      ipcRenderer.once('get-staff-count-response', (_event, response) => {
        if (response.error) {
          reject(response.error);
        } else {
          resolve(response.result);
        }
      });
      ipcRenderer.send('get-staff-count', window.location.href);
    });
  },
  getStudentsFromLevel: (level: string) => {
    return new Promise((resolve, reject) => {
      ipcRenderer.once('get-students-from-level-response', (_event, response) => {
        if (response.error) {
          reject(response.error);
        } else {
          resolve(response.result);
        }
      });
      ipcRenderer.send('get-students-from-level', level, window.location.href);
    });
  },
  getCourse(courseCode: string) {
    return new Promise((resolve, reject) => {
      ipcRenderer.once('get-course-response', (_event, response) => {
        if (response.error) {
          reject(response.error);
        } else {
          resolve(response.result);
        }
      });
      ipcRenderer.send('get-course', courseCode, window.location.href);
    });
  },
  getCourseAttendance: (courseCode: string) => {
    return new Promise((resolve, reject) => {
      ipcRenderer.once('get-course-attendance-response' + courseCode.trim().replace(' ', '-'), (_event, response) => { // use course code as event name to make each call unique as multiple calls can be made at the same time
        if (response.error) {
          reject(response.error);
        } else {
          resolve(response.result);
        }
      });
      ipcRenderer.send('get-course-attendance', courseCode);
    });
  },
  getStudentByMatric: (matric: string) => {
    return new Promise((resolve, reject) => {
      ipcRenderer.once('get-student-by-matric-response', (_event, response) => {
        if (response.error) {
          reject(response.error);
        } else {
          resolve(response.result);
        }
      });
      ipcRenderer.send('get-student-by-matric', matric, window.location.href);
    });
  },
  getStudentsByLevel: (level: string) => {
    return new Promise((resolve, reject) => {
      ipcRenderer.once('get-students-from-level-response', (_event, response) => {
        if (response.error) {
          reject(response.error);
        } else {
          resolve(response.result);
        }
      });
      ipcRenderer.send('get-students-from-level', level, window.location.href);
    });
  },
  getCoursesByLevel: (level: string) => {
    return new Promise((resolve, reject) => {
      ipcRenderer.once('get-courses-by-level-response', (_event, response) => {
        if (response.error) {
          reject(response.error);
        } else {
          resolve(response.result);
        }
      });
      ipcRenderer.send('get-courses-by-level', level, window.location.href);
    });
  },
  markAttendance: (courseCode: string, date?: string) => {
    return new Promise((resolve, reject) => {
      ipcRenderer.once('mark-attendance-response', (_event, response) => {
        if (response.error) {
          reject(response.error);
        } else {
          resolve(response.result);
        }
      });
      ipcRenderer.send('mark-attendance', courseCode, date, window.location.href);
    });
  },
  stopMarkingAttendance: () => {
    ipcRenderer.send('stop-marking-attendance');
  },
  updateCourseStudents: (courseCode: string, students: string) => {
    return new Promise((resolve, reject) => {
      ipcRenderer.once('update-course-students-response', (_event, response) => {
        if (response.error) {
          reject(response.error);
        } else {
          resolve(response.result);
        }
      });
      ipcRenderer.send('update-course-students', courseCode, students, window.location.href);
    });
  },
  updateCourse: (courseCode: string, courseData: any) => {
    return new Promise((resolve, reject) => {
      ipcRenderer.once('update-course-response', (_event, response) => {
        if (response.error) {
          reject(response.error);
        } else {
          resolve(response.result);
        }
      });
      ipcRenderer.send('update-course', courseCode, courseData, window.location.href);
    });
  },
  deleteCourse: (courseCode: string) => {
    return new Promise((resolve, reject) => {
      ipcRenderer.once('delete-course-response', (_event, response) => {
        if (response.error) {
          reject(response.error);
        } else {
          resolve(response.result);
        }
      });
      ipcRenderer.send('delete-course', courseCode, window.location.href);
    });
  },
  exportCoursesToCSV: () => {
    return new Promise((resolve, reject) => {
      ipcRenderer.once('export-courses-to-csv-response', (_event, response) => {
        if (response.error) {
          reject(response.error);
        } else {
          resolve(response.result);
        }
      });
      ipcRenderer.send('export-courses-to-csv', window.location.href);
    });
  },
  exportStudentsToCSV: () => {
    return new Promise((resolve, reject) => {
      ipcRenderer.once('export-students-to-csv-response', (_event, response) => {
        if (response.error) {
          reject(response.error);
        } else {
          resolve(response.result);
        }
      });
      ipcRenderer.send('export-students-to-csv', window.location.href);
    });
  },
  exportAttendanceToCSV: (courseCode: string) => {
    return new Promise((resolve, reject) => {
      ipcRenderer.once('export-attendance-to-csv-response', (_event, response) => {
        if (response.error) {
          reject(response.error);
        } else {
          resolve(response.result);
        }
      });
      ipcRenderer.send('export-attendance-to-csv', courseCode, window.location.href);
    });
  },
  // New atomic attendance methods
  markManualAttendance: (studentMatric: string, courseCode: string, date?: string) => {
    return new Promise((resolve, reject) => {
      ipcRenderer.once('mark-manual-attendance-response', (_event, response) => {
        if (response.error) {
          reject(response.error);
        } else {
          resolve(response.result);
        }
      });
      ipcRenderer.send('mark-manual-attendance', studentMatric, courseCode, date);
    });
  },
  getAttendanceStats: (courseCode: string, date?: string) => {
    return new Promise((resolve, reject) => {
      ipcRenderer.once('get-attendance-stats-response', (_event, response) => {
        if (response.error) {
          reject(response.error);
        } else {
          resolve(response.result);
        }
      });
      ipcRenderer.send('get-attendance-stats', courseCode, date);
    });
  },
  getStudentAttendance: (studentMatric: string, courseCode?: string) => {
    return new Promise((resolve, reject) => {
      ipcRenderer.once('get-student-attendance-response', (_event, response) => {
        if (response.error) {
          reject(response.error);
        } else {
          resolve(response.result);
        }
      });
      ipcRenderer.send('get-student-attendance', studentMatric, courseCode);
    });
  },
  clearStudentFids: (matric: string) => {
    return new Promise((resolve, reject) => {
      ipcRenderer.once('delete-student-fids-response', (_event, response) => {
        if (response.error) {
          reject(response.error);
        } else {
          resolve(response.result);
        }
      });
      ipcRenderer.send('delete-student-fids', matric);
    });
  },
  clearStaffFids: (staffEmail: string) => {
    return new Promise((resolve, reject) => {
      ipcRenderer.once('delete-staff-fids-response', (_event, response) => {
        if (response.error) {
          reject(response.error);
        } else {
          resolve(response.result);
        }
      });
      ipcRenderer.send('delete-staff-fids', staffEmail);
    });
  },
  clearFingerprintScanner: (password: string) => {
    return new Promise((resolve, reject) => {
      ipcRenderer.once('clear-fingerprint-scanner-response', (_event, response) => {
        if (response.error) {
          reject(response.error);
        } else {
          resolve(response.result);
        }
      });
      ipcRenderer.send('clear-fingerprint-scanner', password);
    });
  },
  deleteStudentByMatric: (matric: string) => {
    return new Promise((resolve, reject) => {
      ipcRenderer.once('delete-student-response', (_event, response) => {
        if (response.error) {
          reject(response.error);
        } else {
          resolve(response.result);
        }
      });
      ipcRenderer.send('delete-student', matric);
    });
  },
  deleteStaffById: (staffId: number) => {
    return new Promise((resolve, reject) => {
      ipcRenderer.once('delete-staff-response', (_event, response) => {
        if (response.error) {
          reject(response.error);
        } else {
          resolve(response.result);
        }
      });
      ipcRenderer.send('delete-staff', staffId);
    });
  },
  updateStudent: (studentMatric: string, studentData: IStudent) => {
    return new Promise((resolve, reject) => {
      ipcRenderer.once('update-student-response', (_event, response) => {
        if (response.error) {
          reject(response.error);
        } else {
          resolve(response.result);
        }
      });
      ipcRenderer.send('update-student', studentMatric, studentData);
    });
  },
  updateStaff: (staffId: number, staffData: IStaff) => {
    return new Promise((resolve, reject) => {
      ipcRenderer.once('update-staff-response', (_event, response) => {
        if (response.error) {
          reject(response.error);
        } else {
          resolve(response.result);
        }
      });
      ipcRenderer.send('update-staff', staffId, staffData);
    });
  },
  deleteFIDFromScanner: (fid: number) => {
    return new Promise((resolve, reject) => {
      ipcRenderer.once('delete-fid-response', (_event, response) => {
        if (response.error) {
          reject(response.error);
        } else {
          resolve(response.result);
        }
      });
      ipcRenderer.send('delete-fid', fid);
    });
  },
  getStaffById: (staffId: number) => {
    return new Promise((resolve, reject) => {
      ipcRenderer.once('get-staff-by-id-response', (_event, response) => {
        if (response.error) {
          reject(response.error);
        } else {
          resolve(response.result);
        }
      });
      ipcRenderer.send('get-staff-by-id', staffId);
    });
  },
  deleteFID(fid: number) {
    return new Promise((resolve, reject) => {
      ipcRenderer.once('delete-fid-response', (_event, response) => {
        if (response.error) {
          reject(response.error);
        } else {
          resolve(response.result);
        }
      });
      ipcRenderer.send('delete-fid', fid);
    });
  },
  // Database Management Methods
  exportDatabase: () => {
    return new Promise((resolve, reject) => {
      ipcRenderer.once('export-database-response', (_event, response) => {
        if (response.error) {
          reject(response.error);
        } else {
          resolve(response);
        }
      });
      ipcRenderer.send('export-database');
    });
  },

  importDatabase: () => {
    return new Promise((resolve, reject) => {
      ipcRenderer.once('import-database-response', (_event, response) => {
        if (response.error) {
          reject(response.error);
        } else {
          resolve(response);
        }
      });
      ipcRenderer.send('import-database');
    });
  },

  clearDatabase: (password: string) => {
    return new Promise((resolve, reject) => {
      ipcRenderer.once('clear-database-response', (_event, response) => {
        if (response.error) {
          reject(response.error);
        } else {
          resolve(response);
        }
      });
      ipcRenderer.send('clear-database', password);
    });
  },

  backupDatabase: () => {
    return new Promise((resolve, reject) => {
      ipcRenderer.once('backup-database-response', (_event, response) => {
        if (response.error) {
          reject(response.error);
        } else {
          resolve(response);
        }
      });
      ipcRenderer.send('backup-database');
    });
  },

  restoreDatabase: () => {
    return new Promise((resolve, reject) => {
      ipcRenderer.once('restore-database-response', (_event, response) => {
        if (response.error) {
          reject(response.error);
        } else {
          resolve(response);
        }
      });
      ipcRenderer.send('restore-database');
    });
  },

  getDatabaseStats: () => {
    return new Promise((resolve, reject) => {
      ipcRenderer.once('get-database-stats-response', (_event, response) => {
        if (response.error) {
          reject(response.error);
        } else {
          resolve(response.result);
        }
      });
      ipcRenderer.send('get-database-stats');
    });
  },

  markExamAttendance: (courseCode: string, date?: string) => {
    return new Promise((resolve, reject) => {
      ipcRenderer.once('mark-exam-attendance-response', (_event, response) => {
        if (response.error) {
          reject(response.error);
        } else {
          resolve(response.result);
        }
      });
      ipcRenderer.send('mark-exam-attendance', courseCode, date);
    });
  },
  // Database event listeners
  onDatabaseCleared: (callback: () => void) => {
    ipcRenderer.on('database-cleared', () => callback());
  },

  onDatabaseImported: (callback: () => void) => {
    ipcRenderer.on('database-imported', () => callback());
  },

  onDatabaseRestored: (callback: () => void) => {
    ipcRenderer.on('database-restored', () => callback());
  },

  // Remove database event listeners
  removeDatabaseListeners: () => {
    ipcRenderer.removeAllListeners('database-cleared');
    ipcRenderer.removeAllListeners('database-imported');
    ipcRenderer.removeAllListeners('database-restored');
  },
  
  // Enhanced listeners for attendance responses
  onMarkAttendanceResponse: (callback: (response: any) => void) => {
    ipcRenderer.on('mark-attendance-response', (_event, response) => callback(response));
  },
  removeMarkAttendanceListener: () => {
    ipcRenderer.removeAllListeners('mark-attendance-response');
  },
  onUpdatedCourse: (callback: (course: any) => void) => {
    ipcRenderer.on('updated-course', (_event, course) => callback(course));
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
