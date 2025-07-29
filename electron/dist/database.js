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
exports.Database = void 0;
const sqlite3 = __importStar(require("sqlite3"));
const crypto = __importStar(require("crypto"));
class Database {
    constructor() {
        this.db = new sqlite3.Database('school.db');
        // this.deleteDatabase();
        this.createTables();
    }
    // Helper functions for password hashing
    hashPassword(password) {
        const salt = crypto.randomBytes(16).toString('hex');
        const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
        return `${salt}:${hash}`;
    }
    verifyPassword(password, storedHash) {
        const [salt, hash] = storedHash.split(':');
        const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
        return hash === verifyHash;
    }
    createTables() {
        this.db.serialize(() => {
            this.db.run(`CREATE TABLE IF NOT EXISTS schools (
        name TEXT PRIMARY KEY,
        faculties TEXT NOT NULL,
        createdAt TEXT
      )`);
            this.db.run(`CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        _id TEXT,
        matric TEXT UNIQUE NOT NULL,
        fid1 TEXT,
        fid2 TEXT,
        fullName TEXT,
        gender TEXT,
        age TEXT,
        school TEXT NOT NULL,
        department TEXT,
        level TEXT,
        email TEXT,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        courses TEXT,
        FOREIGN KEY (school) REFERENCES schools(name),
        FOREIGN KEY (department) REFERENCES departments(code)
      )`);
            this.db.run(`CREATE TABLE IF NOT EXISTS staff (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        _id TEXT,
        fullName TEXT,
        school TEXT,
        faculty TEXT NOT NULL,
        department TEXT NOT NULL,
        email TEXT,
        fid1 TEXT UNIQUE,
        fid2 TEXT UNIQUE,
        gender TEXT,
        createdAt DATE,
        phone TEXT,
        password TEXT,
        FOREIGN KEY (faculty) REFERENCES faculties(name),
        FOREIGN KEY (department) REFERENCES departments(name)
      )`);
            this.db.run(`CREATE TABLE IF NOT EXISTS courses (
        _id TEXT,
        courseCode TEXT PRIMARY KEY UNIQUE NOT NULL,
        courseTitle TEXT,
        school TEXT NOT NULL,
        department TEXT NOT NULL,
        venue TEXT,
        startTime TEXT,
        duration INTEGER,
        lecturers TEXT,
        students TEXT,
        createdAt TEXT,
        startsOn TEXT,
        createdBy TEXT,
        FOREIGN KEY (school) REFERENCES schools(name),
        FOREIGN KEY (department) REFERENCES departments(code)
      )`);
            this.db.run(`CREATE TABLE IF NOT EXISTS departments (
        _id TEXT,
        code TEXT UNIQUE NOT NULL PRIMARY KEY,
        faculties TEXT NOT NULL,
        courses TEXT NOT NULL,
        name TEXT,
        FOREIGN KEY (faculties) REFERENCES faculties(name),
        FOREIGN KEY (courses) REFERENCES courses(courseCode)
      )`);
            this.db.run(`CREATE TABLE IF NOT EXISTS faculties (
        _id TEXT,
        name TEXT UNIQUE NOT NULL PRIMARY KEY,
        departments TEXT NOT NULL,
        school TEXT NOT NULL,
        FOREIGN KEY (school) REFERENCES schools(name)
      )`);
            this.db.run(`CREATE TABLE IF NOT EXISTS users (
        _id TEXT,
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL
      )`);
            this.db.run(`CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        _id TEXT,
        token TEXT UNIQUE NOT NULL,
        email TEXT NOT NULL,
        expiresAt TEXT NOT NULL,
        FOREIGN KEY (email) REFERENCES users(email)
      )`);
            this.db.run(`CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        _id TEXT,
        message TEXT NOT NULL,
        createdAt TEXT NOT NULL
      )`);
            this.db.run(`CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        _id TEXT,
        message TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        seen BOOLEAN NOT NULL
      )`);
            this.db.run(`CREATE TABLE IF NOT EXISTS studentAttendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        _id TEXT,
        studentMatric TEXT NOT NULL,
        courseCode TEXT NOT NULL,
        date TEXT NOT NULL,
        timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        mode TEXT NOT NULL CHECK (mode IN ('bio', 'manual')) DEFAULT 'manual',
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (studentMatric) REFERENCES students(matric),
        FOREIGN KEY (courseCode) REFERENCES courses(courseCode),
        UNIQUE(studentMatric, courseCode, date)
      )`);
            this.db.run(`CREATE TABLE IF NOT EXISTS fingerprint (
        id TEXT UNIQUE PRIMARY KEY NOT NULL,
        fid1 number NOT NULL,
        fid2 number NOT NULL
      )`);
        });
    }
    close() {
        this.db.close();
    }
    deleteDatabase() {
        this.db.run('DROP TABLE IF EXISTS schools');
        this.db.run('DROP TABLE IF EXISTS students');
        this.db.run('DROP TABLE IF EXISTS staff');
        this.db.run('DROP TABLE IF EXISTS courses');
        this.db.run('DROP TABLE IF EXISTS departments');
        this.db.run('DROP TABLE IF EXISTS faculties');
        this.db.run('DROP TABLE IF EXISTS users');
        this.db.run('DROP TABLE IF EXISTS sessions');
        this.db.run('DROP TABLE IF EXISTS logs');
        this.db.run('DROP TABLE IF EXISTS notifications');
        this.db.run('DROP TABLE IF EXISTS studentAttendance');
        this.db.run('DROP TABLE IF EXISTS fingerprint');
    }
    deleteTable(table) {
        // check if the table exists
        this.db.get(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`, [table], (err, row) => {
            if (err) {
                console.error(err);
                return err;
            }
            if (!row) {
                console.error('Table does not exist');
                return 'Table does not exist';
            }
            // delete the table
            this.db.run(`DROP TABLE IF EXISTS ${table}`);
            return true;
        });
    }
    // lets start implementing the methods
    student() {
        return {
            getAll: () => {
                return new Promise((resolve, reject) => {
                    this.db.all(`SELECT * FROM students`, (err, rows) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(rows);
                        }
                    });
                });
            },
            findByMatricNumber: (matricNumber) => {
                return new Promise((resolve, reject) => {
                    this.db.get(`SELECT * FROM students WHERE matric = ?`, [matricNumber], (err, row) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(row);
                        }
                    });
                });
            },
            getByMatricNumbers: (matricNumbers) => {
                return new Promise((resolve, reject) => {
                    this.db.all(`SELECT * FROM students WHERE matric IN (${matricNumbers.map(() => '?').join(',')})`, matricNumbers, (err, rows) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(rows);
                        }
                    });
                });
            },
            findByFid: (fid) => {
                return new Promise((resolve, reject) => {
                    this.db.get(`SELECT * FROM students WHERE fid1 = ? OR fid2 = ?`, [fid, fid], (err, row) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(row);
                        }
                    });
                });
            },
            getBySchool: (school) => {
                return new Promise((resolve, reject) => {
                    this.db.all(`SELECT * FROM students WHERE school = ?`, [school], (err, rows) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(rows);
                        }
                    });
                });
            },
            getByDepartment: (department) => {
                return new Promise((resolve, reject) => {
                    this.db.all(`SELECT * FROM students WHERE department = ?`, [department], (err, rows) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(rows);
                        }
                    });
                });
            },
            getByLevel: (level) => {
                return new Promise((resolve, reject) => {
                    this.db.all(`SELECT * FROM students WHERE level = ?`, [level], (err, rows) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(rows);
                        }
                    });
                });
            },
            getByCourse: (courseCode) => {
                return new Promise((resolve, reject) => {
                    this.db.all(`SELECT * FROM students WHERE courses LIKE ?`, [`%${courseCode}%`], (err, rows) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(rows);
                        }
                    });
                });
            },
            enroll: (student) => {
                const { matric, fid1, fid2, fullName, gender, age, school, department, level, email, createdAt } = student;
                return new Promise((resolve, reject) => {
                    this.db.run(`INSERT INTO students (matric, fid1, fid2, fullName, gender, age, school, department, level, email, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [matric, fid1, fid2, fullName, gender, age, school, department, level, email, createdAt], (err) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(student);
                        }
                    });
                });
            },
            remove: (matricNumber) => {
                return new Promise((resolve, reject) => {
                    this.db.run(`DELETE FROM students WHERE matric = ?`, [matricNumber], (err) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(null);
                        }
                    });
                });
            },
            addCourse: (matricNumber, courseCode) => {
                return new Promise((resolve, reject) => {
                    // First get the current courses for the student
                    this.db.get(`SELECT courses FROM students WHERE matric = ?`, [matricNumber], (err, row) => {
                        if (err) {
                            reject(err);
                            return;
                        }
                        let courses = [];
                        if (row && row.courses) {
                            try {
                                courses = JSON.parse(row.courses);
                            }
                            catch (e) {
                                courses = [];
                            }
                        }
                        // Add the new course if it doesn't already exist
                        if (!courses.includes(courseCode)) {
                            courses.push(courseCode);
                        }
                        // Update the student's courses
                        this.db.run(`UPDATE students SET courses = ? WHERE matric = ?`, [JSON.stringify(courses), matricNumber], (updateErr) => {
                            if (updateErr) {
                                reject(updateErr);
                            }
                            else {
                                resolve(null);
                            }
                        });
                    });
                });
            },
            removeCourse: (matricNumber, courseCode) => {
                return new Promise((resolve, reject) => {
                    // First get the current courses for the student
                    this.db.get(`SELECT courses FROM students WHERE matric = ?`, [matricNumber], (err, row) => {
                        if (err) {
                            reject(err);
                            return;
                        }
                        let courses = [];
                        if (row && row.courses) {
                            try {
                                courses = JSON.parse(row.courses);
                            }
                            catch (e) {
                                courses = [];
                            }
                        }
                        // Remove the course if it exists
                        courses = courses.filter((course) => course !== courseCode);
                        // Update the student's courses
                        this.db.run(`UPDATE students SET courses = ? WHERE matric = ?`, [JSON.stringify(courses), matricNumber], (updateErr) => {
                            if (updateErr) {
                                reject(updateErr);
                            }
                            else {
                                resolve(null);
                            }
                        });
                    });
                });
            },
            exportToCSV: () => {
                return new Promise((resolve, reject) => {
                    this.db.all(`SELECT * FROM students`, (err, rows) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            let csv = 'ID,Matric Number,Full Name,Genger,Age,School,Department,Level,Email,Courses\n';
                            rows.forEach((row) => {
                                csv += `${row.id},${row.matric},${row.fullName},${row.gender},${row.age},${row.school},${row.department},${row.level},${row.email},${JSON.parse(row.courses || '[]').join('; ')}\n`;
                            });
                            resolve(csv);
                        }
                    });
                });
            },
            findByEmail: (email) => {
                return new Promise((resolve, reject) => {
                    this.db.get(`SELECT * FROM students WHERE email = ?`, [email], (err, row) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(row);
                        }
                    });
                });
            },
            clearFids: (matricNumber) => {
                return new Promise((resolve, reject) => {
                    this.db.run(`UPDATE students SET fid1 = NULL, fid2 = NULL WHERE matric = ?`, [matricNumber], (err) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve();
                        }
                    });
                });
            },
            deleteByMatric: (matric) => {
                return new Promise((resolve, reject) => {
                    this.db.run(`DELETE FROM students WHERE matric = ?`, [matric], (err) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve();
                        }
                    });
                });
            },
            // Replace the entire student data with the new data (complete replacement)
            updateStudentData: (matric, data) => {
                return new Promise((resolve, reject) => {
                    // Ensure we update all fields explicitly for complete replacement
                    const { fid1, fid2, fullName, gender, age, school, department, level, email, courses } = data;
                    this.db.run(`UPDATE students SET 
            fid1 = ?, 
            fid2 = ?, 
            fullName = ?, 
            gender = ?, 
            age = ?, 
            school = ?, 
            department = ?, 
            level = ?, 
            email = ?, 
            courses = ?
            WHERE matric = ?`, [fid1, fid2, fullName, gender, age, school, department, level, email, courses, matric], (err) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            // Fetch the updated student data
                            this.db.get(`SELECT * FROM students WHERE matric = ?`, [matric], (err, row) => {
                                if (err) {
                                    reject(err);
                                }
                                else {
                                    resolve(row);
                                }
                            });
                        }
                    });
                });
            },
            count: () => {
                return new Promise((resolve, reject) => {
                    this.db.get(`SELECT COUNT(*) as count FROM students`, (err, row) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(row.count);
                        }
                    });
                });
            }
        };
    }
    staff() {
        return {
            getAll: () => {
                return new Promise((resolve, reject) => {
                    this.db.all(`SELECT * FROM staff`, (err, rows) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(rows);
                        }
                    });
                });
            },
            findByEmail: (email) => {
                return new Promise((resolve, reject) => {
                    this.db.get(`SELECT * FROM staff WHERE email = ?`, [email], (err, row) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(row);
                        }
                    });
                });
            },
            findByFid: (fid) => {
                return new Promise((resolve, reject) => {
                    this.db.get(`SELECT * FROM staff WHERE fid1 = ? OR fid2 = ?`, [fid, fid], (err, row) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(row);
                        }
                    });
                });
            },
            getBySchool: (school) => {
                return new Promise((resolve, reject) => {
                    this.db.all(`SELECT * FROM staff WHERE school = ?`, [school], (err, rows) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(rows);
                        }
                    });
                });
            },
            getByDepartment: (department) => {
                return new Promise((resolve, reject) => {
                    this.db.all(`SELECT * FROM staff WHERE department = ?`, [department], (err, rows) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(rows);
                        }
                    });
                });
            },
            getByCourse: (courseCode) => {
                return new Promise((resolve, reject) => {
                    this.db.all(`SELECT * FROM staff WHERE courses LIKE ?`, [`%${courseCode}%`], (err, rows) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(rows);
                        }
                    });
                });
            },
            enroll: (staff) => {
                const { fullName, school, department, email, fid1, fid2, gender, createdAt, phone, faculty, password } = staff;
                return new Promise((resolve, reject) => {
                    try {
                        // Hash the password before storing
                        const hashedPassword = password ? this.hashPassword(password) : null;
                        this.db.run(`INSERT INTO staff (fullName, school, department, email, fid1, fid2, gender, createdAt, phone, faculty, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [fullName, school, department, email, fid1, fid2, gender, createdAt, phone, faculty, hashedPassword], (err) => {
                            if (err) {
                                reject(err);
                            }
                            else {
                                resolve(staff);
                            }
                        });
                    }
                    catch (error) {
                        reject(error);
                    }
                });
            },
            remove: (email) => {
                return new Promise((resolve, reject) => {
                    this.db.run(`DELETE FROM staff WHERE email = ?`, [email], (err) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(null);
                        }
                    });
                });
            },
            addCourse: (email, courseCode) => {
                return new Promise((resolve, reject) => {
                    // First get the current courses for the staff member
                    this.db.get(`SELECT courses FROM staff WHERE email = ?`, [email], (err, row) => {
                        if (err) {
                            reject(err);
                            return;
                        }
                        let courses = [];
                        if (row && row.courses) {
                            try {
                                courses = JSON.parse(row.courses);
                            }
                            catch (e) {
                                courses = [];
                            }
                        }
                        // Add the new course if it doesn't already exist
                        if (!courses.includes(courseCode)) {
                            courses.push(courseCode);
                        }
                        // Update the staff member's courses
                        this.db.run(`UPDATE staff SET courses = ? WHERE email = ?`, [JSON.stringify(courses), email], (updateErr) => {
                            if (updateErr) {
                                reject(updateErr);
                            }
                            else {
                                resolve(null);
                            }
                        });
                    });
                });
            },
            removeCourse: (email, courseCode) => {
                return new Promise((resolve, reject) => {
                    // First get the current courses for the staff member
                    this.db.get(`SELECT courses FROM staff WHERE email = ?`, [email], (err, row) => {
                        if (err) {
                            reject(err);
                            return;
                        }
                        let courses = [];
                        if (row && row.courses) {
                            try {
                                courses = JSON.parse(row.courses);
                            }
                            catch (e) {
                                courses = [];
                            }
                        }
                        // Remove the course if it exists
                        courses = courses.filter((course) => course !== courseCode);
                        // Update the staff member's courses
                        this.db.run(`UPDATE staff SET courses = ? WHERE email = ?`, [JSON.stringify(courses), email], (updateErr) => {
                            if (updateErr) {
                                reject(updateErr);
                            }
                            else {
                                resolve(null);
                            }
                        });
                    });
                });
            },
            setPassword: (email, password) => {
                return new Promise((resolve, reject) => {
                    try {
                        // Hash the password before storing
                        const hashedPassword = this.hashPassword(password);
                        this.db.run(`UPDATE staff SET password = ? WHERE email = ?`, [hashedPassword, email], (err) => {
                            if (err) {
                                reject(err);
                            }
                            else {
                                resolve(true);
                            }
                        });
                    }
                    catch (error) {
                        reject(error);
                    }
                });
            },
            verifyPassword: (email, password) => {
                return new Promise((resolve, reject) => {
                    try {
                        this.db.get(`SELECT password FROM staff WHERE email = ?`, [email], (err, row) => {
                            if (err) {
                                reject(err);
                            }
                            else if (!row || !row.password) {
                                resolve(false);
                            }
                            else {
                                // Compare the provided password with the hashed password
                                const isValid = this.verifyPassword(password, row.password);
                                resolve(isValid);
                            }
                        });
                    }
                    catch (error) {
                        reject(error);
                    }
                });
            },
            count: () => {
                return new Promise((resolve, reject) => {
                    this.db.get(`SELECT COUNT(*) FROM staff`, (err, row) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(row['COUNT(*)']);
                        }
                    });
                });
            },
            login: (email, password) => {
                return new Promise((resolve, reject) => {
                    try {
                        this.db.get(`SELECT * FROM staff WHERE email = ?`, [email], (err, row) => {
                            if (err) {
                                reject(err);
                            }
                            else if (!row) {
                                reject('User not found');
                            }
                            else {
                                // Compare the provided password with the hashed password
                                const isValid = this.verifyPassword(password, row.password);
                                if (isValid) {
                                    resolve(row);
                                }
                                else {
                                    reject('Invalid email or password');
                                }
                            }
                        });
                    }
                    catch (error) {
                        reject(error);
                    }
                });
            },
            clearFids: (email) => {
                return new Promise((resolve, reject) => {
                    this.db.run(`UPDATE staff SET fid1 = NULL, fid2 = NULL WHERE email = ?`, [email], (err) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve();
                        }
                    });
                });
            },
            deleteById: (staffId) => {
                return new Promise((resolve, reject) => {
                    this.db.run(`DELETE FROM staff WHERE id = ?`, [staffId], (err) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve();
                        }
                    });
                });
            },
            updateStaffData: (email, data) => {
                return new Promise((resolve, reject) => {
                    // Extract all possible fields from the data, excluding ID
                    const { fullName, school, department, fid1, fid2, gender, phone, faculty, password } = data;
                    // Handle password hashing if password is provided
                    let hashedPassword = null;
                    if (password && password.trim() !== '') {
                        try {
                            hashedPassword = this.hashPassword(password);
                        }
                        catch (error) {
                            reject(new Error('Failed to hash password'));
                            return;
                        }
                    }
                    // Build the SQL query dynamically based on what fields are provided
                    const updateFields = [];
                    const updateValues = [];
                    if (fullName !== undefined) {
                        updateFields.push('fullName = ?');
                        updateValues.push(fullName);
                    }
                    if (school !== undefined) {
                        updateFields.push('school = ?');
                        updateValues.push(school);
                    }
                    if (department !== undefined) {
                        updateFields.push('department = ?');
                        updateValues.push(department);
                    }
                    if (faculty !== undefined) {
                        updateFields.push('faculty = ?');
                        updateValues.push(faculty);
                    }
                    if (gender !== undefined) {
                        updateFields.push('gender = ?');
                        updateValues.push(gender);
                    }
                    if (phone !== undefined) {
                        updateFields.push('phone = ?');
                        updateValues.push(phone);
                    }
                    if (fid1 !== undefined) {
                        updateFields.push('fid1 = ?');
                        updateValues.push(fid1);
                    }
                    if (fid2 !== undefined) {
                        updateFields.push('fid2 = ?');
                        updateValues.push(fid2);
                    }
                    // Only update password if it was provided and successfully hashed
                    if (hashedPassword) {
                        updateFields.push('password = ?');
                        updateValues.push(hashedPassword);
                    }
                    // If no fields to update, return the current data
                    if (updateFields.length === 0) {
                        resolve(Object.assign(Object.assign({}, data), { email }));
                        return;
                    }
                    // Add email to the end for the WHERE clause
                    updateValues.push(email);
                    const query = `UPDATE staff SET ${updateFields.join(', ')} WHERE email = ?`;
                    this.db.run(query, updateValues, (err) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            // Fetch the updated staff data to return
                            this.db.get(`SELECT * FROM staff WHERE email = ?`, [email], (fetchErr, row) => {
                                if (fetchErr) {
                                    reject(fetchErr);
                                }
                                else {
                                    resolve(row);
                                }
                            });
                        }
                    });
                });
            },
            findById: (staffId) => {
                return new Promise((resolve, reject) => {
                    this.db.get(`SELECT * FROM staff WHERE id = ?`, [staffId], (err, row) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(row);
                        }
                    });
                });
            }
        };
    }
    school() {
        return {
            get: () => {
                return new Promise((resolve, reject) => {
                    this.db.all(`SELECT * FROM schools`, (err, rows) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(rows);
                        }
                    });
                });
            },
            enroll: (school) => {
                const { name, departments } = school;
                return new Promise((resolve, reject) => {
                    this.db.run(`INSERT INTO schools (name, departments) VALUES (?, ?)`, [name, departments], (err) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(school);
                        }
                    });
                });
            },
            remove: (name) => {
                return new Promise((resolve, reject) => {
                    this.db.run(`DELETE FROM schools WHERE name = ?`, [name], (err) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(null);
                        }
                    });
                });
            },
            getDepartments: (school) => {
                return new Promise((resolve, reject) => {
                    this.db.get(`SELECT departments FROM schools WHERE name = ?`, [school], (err, row) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(row.departments);
                        }
                    });
                });
            },
            enrollDepartment: (department) => {
                return new Promise((resolve, reject) => {
                    this.db.run(`UPDATE schools SET departments = array_append(departments, ?) WHERE name = ?`, [department, department], (err) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(department);
                        }
                    });
                });
            },
            removeDepartment: (department) => {
                return new Promise((resolve, reject) => {
                    this.db.run(`UPDATE schools SET departments = array_remove(departments, ?) WHERE name = ?`, [department, department], (err) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(null);
                        }
                    });
                });
            },
            getFaculties: (school) => {
                return new Promise((resolve, reject) => {
                    this.db.get(`SELECT faculties FROM schools WHERE name = ?`, [school], (err, row) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(row.faculties);
                        }
                    });
                });
            },
            enrollFaculty: (faculty) => {
                return new Promise((resolve, reject) => {
                    this.db.run(`UPDATE schools SET faculties = array_append(faculties, ?) WHERE name = ?`, [faculty, faculty], (err) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(faculty);
                        }
                    });
                });
            },
            removeFaculty: (faculty) => {
                return new Promise((resolve, reject) => {
                    this.db.run(`UPDATE schools SET faculties = array_remove(faculties, ?) WHERE name = ?`, [faculty, faculty], (err) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(null);
                        }
                    });
                });
            }
        };
    }
    department() {
        return {
            get: () => {
                return new Promise((resolve, reject) => {
                    this.db.all(`SELECT * FROM departments`, (err, rows) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(rows);
                        }
                    });
                });
            },
            enroll: (department) => {
                return new Promise((resolve, reject) => {
                    this.db.run(`INSERT INTO departments (name) VALUES (?)`, [department], (err) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(department);
                        }
                    });
                });
            },
            remove: (department) => {
                return new Promise((resolve, reject) => {
                    this.db.run(`DELETE FROM departments WHERE name = ?`, [department], (err) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(null);
                        }
                    });
                });
            },
            getFaculties: () => {
                return new Promise((resolve, reject) => {
                    this.db.all(`SELECT * FROM faculties`, (err, rows) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(rows);
                        }
                    });
                });
            },
            enrollFaculty: (faculty) => {
                return new Promise((resolve, reject) => {
                    this.db.run(`UPDATE departments SET faculties = array_append(faculties, ?)`, [faculty], (err) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(faculty);
                        }
                    });
                });
            },
            removeFaculty: (faculty) => {
                return new Promise((resolve, reject) => {
                    this.db.run(`UPDATE departments SET faculties = array_remove(faculties, ?)`, [faculty], (err) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(null);
                        }
                    });
                });
            },
            getCourses: () => {
                return new Promise((resolve, reject) => {
                    this.db.all(`SELECT * FROM departments`, (err, rows) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(rows);
                        }
                    });
                });
            },
            enrollCourse: (course) => {
                return new Promise((resolve, reject) => {
                    this.db.run(`UPDATE departments SET courses = array_append(courses, ?)`, [course], (err) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(course);
                        }
                    });
                });
            },
            removeCourse: (courseCode) => {
                return new Promise((resolve, reject) => {
                    this.db.run(`UPDATE departments SET courses = array_remove(courses, ?)`, [courseCode], (err) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(null);
                        }
                    });
                });
            }
        };
    }
    faculty() {
        return {
            get: () => {
                return new Promise((resolve, reject) => {
                    this.db.all(`SELECT * FROM faculties`, (err, rows) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(rows);
                        }
                    });
                });
            },
            enroll: (faculty) => {
                return new Promise((resolve, reject) => {
                    this.db.run(`INSERT INTO faculties (name) VALUES (?)`, [faculty], (err) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(faculty);
                        }
                    });
                });
            },
            remove: (faculty) => {
                return new Promise((resolve, reject) => {
                    this.db.run(`DELETE FROM faculties WHERE name = ?`, [faculty], (err) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(faculty);
                        }
                    });
                });
            },
            enrollDepartment: (department) => {
                return new Promise((resolve, reject) => {
                    this.db.run(`UPDATE faculties SET departments = array_append(departments, ?)`, [department], (err) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(department);
                        }
                    });
                });
            },
            removeDepartment: (department) => {
                return new Promise((resolve, reject) => {
                    this.db.run(`UPDATE faculties SET departments = array_remove(departments, ?)`, [department], (err) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(department);
                        }
                    });
                });
            }
        };
    }
    course() {
        return {
            getAll: () => {
                return new Promise((resolve, reject) => {
                    this.db.all(`SELECT * FROM courses`, (err, rows) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(rows);
                        }
                    });
                });
            },
            create: (course) => {
                return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                    // students prop is a stringified JSON array of student matric numbers.
                    // ensure that all the students actually exist in the students table.
                    if (course.students) {
                        const studentMatrics = JSON.parse(course.students);
                        const existingStudents = yield this.student().getByMatricNumbers(studentMatrics);
                        if (existingStudents.length !== studentMatrics.length) {
                            reject(new Error(`Some students do not exist: ${studentMatrics.filter((matric) => !existingStudents.some((student) => student.matric === matric)).join(', ')}`));
                            return;
                        }
                    }
                    // for each of the students, add this course to their courses array.
                    if (course.students) {
                        const studentMatrics = JSON.parse(course.students);
                        for (const matric of studentMatrics) {
                            yield this.student().addCourse(matric, course.courseCode);
                        }
                    }
                    this.db.run(`INSERT INTO courses (courseCode, courseTitle, school, department, venue, startTime, duration, lecturers, students, startsOn, createdAt,createdBy) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                        course.courseCode,
                        course.courseTitle,
                        course.school,
                        course.department,
                        course.venue,
                        course.startTime,
                        course.duration,
                        course.lecturers,
                        course.students,
                        course.startsOn,
                        course.createdAt,
                        course.createdBy
                    ], (err) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(course);
                        }
                    });
                }));
            },
            remove: (courseCode) => {
                return new Promise((resolve, reject) => {
                    this.db.run(`DELETE FROM courses WHERE courseCode = ?`, [courseCode], (err) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(courseCode);
                        }
                    });
                });
            },
            getLecturers: (courseCode) => {
                return new Promise((resolve, reject) => {
                    this.db.all(`SELECT lecturers FROM courses WHERE courseCode = ?`, [courseCode], (err, rows) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(rows);
                        }
                    });
                });
            },
            enrollLecturers: (courseCode, lecturer) => {
                return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                    try {
                        let prevLecturers = yield this.course().getLecturers(courseCode);
                        prevLecturers = JSON.parse(prevLecturers);
                        prevLecturers.push(...lecturer);
                        this.db.run(`UPDATE courses SET lecturers = ? WHERE courseCode = ?`, [JSON.stringify(prevLecturers), courseCode], (err) => {
                            if (err) {
                                reject(err);
                            }
                            else {
                                resolve(lecturer);
                            }
                        });
                    }
                    catch (error) {
                        reject(error);
                    }
                }));
            },
            getByLevel: (level) => {
                return new Promise((resolve, reject) => {
                    this.db.all(`SELECT * FROM students WHERE level = ?`, [level], (err, rows) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(rows);
                        }
                    });
                });
            },
            getStudents: (courseCode) => {
                return new Promise((resolve, reject) => {
                    this.db.all(`SELECT students FROM courses WHERE courseCode = ?`, [courseCode], (err, rows) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(JSON.parse(rows));
                        }
                    });
                });
            },
            updateStudents: (courseCode, students) => {
                return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                    try {
                        this.db.run(`UPDATE courses SET students = ? WHERE courseCode = ?`, [students, courseCode], (err) => {
                            if (err) {
                                reject(err);
                            }
                            else {
                                resolve(students);
                            }
                        });
                    }
                    catch (error) {
                        reject(error);
                    }
                }));
            },
            removeStudents: (courseCode, student) => {
                return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                    try {
                        let prevStudents = yield this.course().getStudents(courseCode);
                        student.forEach((s) => {
                            prevStudents = prevStudents.filter((st) => st !== s);
                        });
                        this.db.run(`UPDATE courses SET students = ? WHERE courseCode = ?`, [JSON.stringify(prevStudents), courseCode], (err) => {
                            if (err) {
                                reject(err);
                            }
                            else {
                                resolve(student);
                            }
                        });
                    }
                    catch (error) {
                        reject(error);
                    }
                }));
            },
            getByCourseCode: (courseCode) => {
                return new Promise((resolve, reject) => {
                    this.db.get(`SELECT * FROM courses WHERE courseCode = ?`, [courseCode], (err, row) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(row);
                        }
                    });
                });
            },
            exportToCSV: () => {
                return new Promise((resolve, reject) => {
                    this.db.all(`SELECT * FROM courses`, (err, rows) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            let csv = 'ID,Course Code,Course Title,School,Department,Venue,Start Time,Duration,Lecturers,Students,Starts On,Created At,Created By\n';
                            rows.forEach((row) => {
                                // @ts-ignore
                                csv += `${row.id},${row.courseCode},${row.courseTitle},${row.school},${row.department},${row.venue},${row.startTime},${row.duration},${row.lecturers.replace(',', ';')},${JSON.parse(row.students || '[]').join('; ')},${row.startsOn},${row.createdAt},${row.createdBy}\n`;
                            });
                            resolve(csv);
                        }
                    });
                });
            },
            updateCourse: (courseCode, updatedCourse) => {
                return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                    try {
                        // Get the existing course
                        const existingCourse = yield this.course().getByCourseCode(courseCode);
                        if (!existingCourse) {
                            reject(new Error(`Course with code ${courseCode} does not exist`));
                            return;
                        }
                        // Update the course properties
                        const updatedProperties = Object.assign(Object.assign({}, existingCourse), updatedCourse);
                        // Handle student updates if students field is being updated
                        if (updatedProperties.students) {
                            const newStudentMatrics = JSON.parse(updatedProperties.students);
                            const oldStudentMatrics = existingCourse.students ? JSON.parse(existingCourse.students) : [];
                            // Validate that all new students exist
                            if (newStudentMatrics.length > 0) {
                                const existingStudents = yield this.student().getByMatricNumbers(newStudentMatrics);
                                if (existingStudents.length !== newStudentMatrics.length) {
                                    reject(new Error(`Some students do not exist: ${newStudentMatrics.filter((matric) => !existingStudents.some((student) => student.matric === matric)).join(', ')}`));
                                    return;
                                }
                            }
                            // Find students to remove (in old list but not in new list)
                            const studentsToRemove = oldStudentMatrics.filter((matric) => !newStudentMatrics.includes(matric));
                            // Find students to add (in new list but not in old list)
                            const studentsToAdd = newStudentMatrics.filter((matric) => !oldStudentMatrics.includes(matric));
                            // Remove course from students who are no longer enrolled
                            for (const matric of studentsToRemove) {
                                yield this.student().removeCourse(matric, courseCode);
                            }
                            // Add course to newly enrolled students
                            for (const matric of studentsToAdd) {
                                yield this.student().addCourse(matric, courseCode);
                            }
                        }
                        // Update the course in the database
                        this.db.run(`UPDATE courses SET courseTitle = ?, school = ?, department = ?, venue = ?, startTime = ?, duration = ?, lecturers = ?, students = ?, startsOn = ?, createdAt = ? WHERE courseCode = ?`, [
                            updatedProperties.courseTitle,
                            updatedProperties.school,
                            updatedProperties.department,
                            updatedProperties.venue,
                            updatedProperties.startTime,
                            updatedProperties.duration,
                            updatedProperties.lecturers,
                            updatedProperties.students,
                            updatedProperties.startsOn,
                            updatedProperties.createdAt,
                            courseCode
                        ], (err) => {
                            if (err) {
                                reject(err);
                            }
                            else {
                                resolve(updatedProperties);
                            }
                        });
                    }
                    catch (error) {
                        reject(error);
                    }
                }));
            },
            count: () => {
                return new Promise((resolve, reject) => {
                    this.db.get(`SELECT COUNT(*) FROM courses`, (err, row) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(row['COUNT(*)']);
                        }
                    });
                });
            }
        };
    }
    user() {
        return {
            getAll: () => {
                return new Promise((resolve, reject) => {
                    this.db.all(`SELECT * FROM users`, (err, rows) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(rows);
                        }
                    });
                });
            },
            create: (user) => {
                return new Promise((resolve, reject) => {
                    try {
                        // Hash the password before storing
                        const hashedPassword = this.hashPassword(user.password);
                        this.db.run(`INSERT INTO users (email, password, role) VALUES (?, ?, ?)`, [user.email, hashedPassword, user.role], (err) => {
                            if (err) {
                                reject(err);
                            }
                            else {
                                resolve(true);
                            }
                        });
                    }
                    catch (error) {
                        reject(error);
                    }
                });
            },
            getByEmail: (email) => {
                return new Promise((resolve, reject) => {
                    this.db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, row) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(row);
                        }
                    });
                });
            },
            login: (email, password) => {
                return new Promise((resolve, reject) => {
                    try {
                        this.db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, row) => {
                            if (err) {
                                reject(err);
                            }
                            else if (!row) {
                                reject('User not found');
                            }
                            else {
                                // Compare the provided password with the hashed password
                                const isValid = this.verifyPassword(password, row.password);
                                if (isValid) {
                                    resolve(row);
                                }
                                else {
                                    reject('Invalid email or password');
                                }
                            }
                        });
                    }
                    catch (error) {
                        reject(error);
                    }
                });
            },
            remove: (email) => {
                return new Promise((resolve, reject) => {
                    this.db.run(`DELETE FROM users WHERE email = ?`, [email], (err) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(email);
                        }
                    });
                });
            }
        };
    }
    session() {
        return {
            get: () => {
                return new Promise((resolve, reject) => {
                    this.db.all(`SELECT * FROM sessions`, (err, rows) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(rows);
                        }
                    });
                });
            },
            enroll: (session) => {
                return new Promise((resolve, reject) => {
                    this.db.run(`INSERT INTO sessions (token) VALUES (?)`, [session], (err) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(session);
                        }
                    });
                });
            },
            remove: (token) => {
                return new Promise((resolve, reject) => {
                    this.db.run(`DELETE FROM sessions WHERE token = ?`, [token], (err) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(token);
                        }
                    });
                });
            }
        };
    }
    log() {
        return {
            get: () => {
                return new Promise((resolve, reject) => {
                    this.db.all(`SELECT * FROM logs`, (err, rows) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(rows);
                        }
                    });
                });
            },
            enroll: (log) => {
                return new Promise((resolve, reject) => {
                    this.db.run(`INSERT INTO logs (message) VALUES (?)`, [log], (err) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(log);
                        }
                    });
                });
            },
            remove: (id) => {
                return new Promise((resolve, reject) => {
                    this.db.run(`DELETE FROM logs WHERE id = ?`, [id], (err) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(id.toString());
                        }
                    });
                });
            }
        };
    }
    notification() {
        return {
            get: () => {
                return new Promise((resolve, reject) => {
                    this.db.all(`SELECT * FROM notifications`, (err, rows) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(rows);
                        }
                    });
                });
            },
            enroll: (notification) => {
                return new Promise((resolve, reject) => {
                    this.db.run(`INSERT INTO notifications (message) VALUES (?)`, [notification], (err) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(notification);
                        }
                    });
                });
            },
            remove: (id) => {
                return new Promise((resolve, reject) => {
                    this.db.run(`DELETE FROM notifications WHERE id = ?`, [id], (err) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(id.toString());
                        }
                    });
                });
            },
            markAsSeen: (id) => {
                return new Promise((resolve, reject) => {
                    this.db.run(`UPDATE notifications SET seen = true WHERE id = ?`, [id], (err) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(id.toString());
                        }
                    });
                });
            }
        };
    }
    fingerprint() {
        return {
            get: () => {
                return new Promise((resolve, reject) => {
                    this.db.all(`SELECT * FROM fingerprint`, (err, rows) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(rows);
                        }
                    });
                });
            },
            find: (id) => {
                return new Promise((resolve, reject) => {
                    this.db.get(`SELECT * FROM fingerprint WHERE id = ?`, [id], (err, row) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(row);
                        }
                    });
                });
            },
            enroll: (id, fid1, fid2) => {
                return new Promise((resolve, reject) => {
                    this.db.run(`INSERT INTO fingerprint (id, fid1, fid2) VALUES (?, ?, ?)`, [id, fid1, fid2], (err) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve({ id, fid1, fid2 });
                        }
                    });
                });
            },
            remove: (id) => {
                return new Promise((resolve, reject) => {
                    this.db.run(`DELETE FROM fingerprint WHERE id = ?`, [id], (err) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(true);
                        }
                    });
                });
            }
        };
    }
    studentAttendance() {
        return {
            get: () => {
                return new Promise((resolve, reject) => {
                    this.db.all(`SELECT * FROM studentAttendance ORDER BY timestamp DESC`, (err, rows) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(rows);
                        }
                    });
                });
            },
            getByCourseCode: (courseCode) => {
                return new Promise((resolve, reject) => {
                    this.db.all(`SELECT * FROM studentAttendance WHERE courseCode = ? ORDER BY timestamp DESC`, [courseCode], (err, rows) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(rows);
                        }
                    });
                });
            },
            getByCourseCodeAndDate: (courseCode, date) => {
                return new Promise((resolve, reject) => {
                    this.db.all(`SELECT * FROM studentAttendance WHERE courseCode = ? AND date = ? ORDER BY timestamp DESC`, [courseCode, date], (err, rows) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(rows);
                        }
                    });
                });
            },
            getByStudentMatric: (studentMatric) => {
                return new Promise((resolve, reject) => {
                    this.db.all(`SELECT * FROM studentAttendance WHERE studentMatric = ? ORDER BY timestamp DESC`, [studentMatric], (err, rows) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(rows);
                        }
                    });
                });
            },
            getByStudentMatricAndCourse: (studentMatric, courseCode) => {
                return new Promise((resolve, reject) => {
                    this.db.all(`SELECT * FROM studentAttendance WHERE studentMatric = ? AND courseCode = ? ORDER BY timestamp DESC`, [studentMatric, courseCode], (err, rows) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(rows);
                        }
                    });
                });
            },
            markAttendance: (attendance) => {
                const { studentMatric, courseCode, date, mode, timestamp } = attendance;
                return new Promise((resolve, reject) => {
                    // Insert or replace attendance record (due to UNIQUE constraint on studentMatric, courseCode, date)
                    this.db.run(`INSERT OR REPLACE INTO studentAttendance (studentMatric, courseCode, date, timestamp, mode) VALUES (?, ?, ?, ?, ?)`, [studentMatric, courseCode, date, timestamp || new Date().toISOString(), mode], (err) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(attendance);
                        }
                    });
                });
            },
            remove: (id) => {
                return new Promise((resolve, reject) => {
                    this.db.run(`DELETE FROM studentAttendance WHERE id = ?`, [id], (err) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(true);
                        }
                    });
                });
            },
            getAttendanceStats: (courseCode, date) => {
                return new Promise((resolve, reject) => {
                    // Get total students enrolled in the course
                    this.db.get(`SELECT students FROM courses WHERE courseCode = ?`, [courseCode], (err, courseRow) => {
                        if (err) {
                            reject(err);
                            return;
                        }
                        if (!courseRow || !courseRow.students) {
                            resolve({ total: 0, present: 0, absent: 0 });
                            return;
                        }
                        const totalStudents = JSON.parse(courseRow.students).length;
                        // Get attendance count for the date (if specified) or overall
                        const query = date
                            ? `SELECT COUNT(*) as present FROM studentAttendance WHERE courseCode = ? AND date = ?`
                            : `SELECT COUNT(DISTINCT studentMatric) as present FROM studentAttendance WHERE courseCode = ?`;
                        const params = date ? [courseCode, date] : [courseCode];
                        this.db.get(query, params, (attendanceErr, attendanceRow) => {
                            if (attendanceErr) {
                                reject(attendanceErr);
                            }
                            else {
                                const present = (attendanceRow === null || attendanceRow === void 0 ? void 0 : attendanceRow.present) || 0;
                                const absent = totalStudents - present;
                                resolve({
                                    total: totalStudents,
                                    present: present,
                                    absent: absent
                                });
                            }
                        });
                    });
                });
            },
            exportToCSV: () => {
                return new Promise((resolve, reject) => {
                    this.db.all(`SELECT * FROM studentAttendance ORDER BY timestamp DESC`, (err, rows) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            let csv = 'ID,Student Matric,Course Code,Date,Timestamp,Mode,Created At\n';
                            rows.forEach((row) => {
                                // @ts-ignore
                                csv += `${row.id},${row.studentMatric},${row.courseCode},${row.date},${row.timestamp},${row.mode},${row.createdAt}\n`;
                            });
                            resolve(csv);
                        }
                    });
                });
            }
        };
    }
    ldb() {
        return {
            export: () => {
                return new Promise((resolve, reject) => {
                    const exportData = {
                        metadata: {
                            exportDate: new Date().toISOString(),
                            version: '1.0.0'
                        },
                        tables: {}
                    };
                    const tables = [
                        'schools',
                        'students',
                        'staff',
                        'courses',
                        'departments',
                        'faculties',
                        'users',
                        'sessions',
                        'logs',
                        'notifications',
                        'studentAttendance',
                        'fingerprint'
                    ];
                    let completedTables = 0;
                    tables.forEach(tableName => {
                        this.db.all(`SELECT * FROM ${tableName}`, (err, rows) => {
                            if (err) {
                                reject(new Error(`Failed to export table ${tableName}: ${err.message}`));
                                return;
                            }
                            exportData.tables[tableName] = rows;
                            completedTables++;
                            // Check if all tables have been exported
                            if (completedTables === tables.length) {
                                try {
                                    const jsonData = JSON.stringify(exportData, null, 2);
                                    resolve(jsonData);
                                }
                                catch (error) {
                                    reject(new Error(`Failed to serialize export data: ${error}`));
                                }
                            }
                        });
                    });
                });
            },
            import: (jsonData) => {
                return new Promise((resolve, reject) => {
                    try {
                        // Parse the import data
                        const importData = JSON.parse(jsonData);
                        if (!importData.tables) {
                            reject(new Error('Invalid import data format: missing tables'));
                            return;
                        }
                        // Check if database is empty first
                        const tables = [
                            'schools',
                            'students',
                            'staff',
                            'courses',
                            'departments',
                            'faculties',
                            'users',
                            'sessions',
                            'logs',
                            'notifications',
                            'studentAttendance',
                            'fingerprint'
                        ];
                        let emptyCheckCount = 0;
                        let isEmpty = true;
                        const checkEmpty = () => {
                            return new Promise((resolveEmpty, rejectEmpty) => {
                                let checkedTables = 0;
                                tables.forEach(tableName => {
                                    this.db.get(`SELECT COUNT(*) as count FROM ${tableName}`, (err, row) => {
                                        if (err) {
                                            rejectEmpty(new Error(`Failed to check table ${tableName}: ${err.message}`));
                                            return;
                                        }
                                        if (row.count > 0) {
                                            isEmpty = false;
                                        }
                                        checkedTables++;
                                        if (checkedTables === tables.length) {
                                            resolveEmpty(isEmpty);
                                        }
                                    });
                                });
                            });
                        };
                        // Check if database is empty
                        checkEmpty()
                            .then(isDbEmpty => {
                            if (!isDbEmpty) {
                                reject(new Error('Database is not empty. Import rejected to prevent data loss.'));
                                return;
                            }
                            // Begin transaction for import
                            this.db.serialize(() => {
                                this.db.run('BEGIN TRANSACTION');
                                let importedTables = 0;
                                let hasError = false;
                                const importTable = (tableName, data) => {
                                    if (hasError)
                                        return;
                                    if (!data || data.length === 0) {
                                        importedTables++;
                                        if (importedTables === tables.length) {
                                            this.db.run('COMMIT', (err) => {
                                                if (err) {
                                                    reject(new Error(`Failed to commit transaction: ${err.message}`));
                                                }
                                                else {
                                                    resolve(true);
                                                }
                                            });
                                        }
                                        return;
                                    }
                                    // Get table schema to build proper INSERT statement
                                    this.db.all(`PRAGMA table_info(${tableName})`, (err, columns) => {
                                        if (err) {
                                            hasError = true;
                                            this.db.run('ROLLBACK');
                                            reject(new Error(`Failed to get schema for table ${tableName}: ${err.message}`));
                                            return;
                                        }
                                        const columnNames = columns.map(col => col.name).filter(name => name !== 'id'); // Exclude auto-increment id
                                        const placeholders = columnNames.map(() => '?').join(', ');
                                        const insertSQL = `INSERT INTO ${tableName} (${columnNames.join(', ')}) VALUES (${placeholders})`;
                                        let insertedRows = 0;
                                        data.forEach(rowData => {
                                            if (hasError)
                                                return;
                                            const values = columnNames.map(col => rowData[col] !== undefined ? rowData[col] : null);
                                            this.db.run(insertSQL, values, (insertErr) => {
                                                if (insertErr) {
                                                    hasError = true;
                                                    this.db.run('ROLLBACK');
                                                    reject(new Error(`Failed to import row into ${tableName}: ${insertErr.message}`));
                                                    return;
                                                }
                                                insertedRows++;
                                                if (insertedRows === data.length) {
                                                    importedTables++;
                                                    if (importedTables === tables.length) {
                                                        this.db.run('COMMIT', (commitErr) => {
                                                            if (commitErr) {
                                                                reject(new Error(`Failed to commit transaction: ${commitErr.message}`));
                                                            }
                                                            else {
                                                                resolve(true);
                                                            }
                                                        });
                                                    }
                                                }
                                            });
                                        });
                                    });
                                };
                                // Import all tables
                                tables.forEach(tableName => {
                                    const tableData = importData.tables[tableName] || [];
                                    importTable(tableName, tableData);
                                });
                            });
                        })
                            .catch(error => {
                            reject(error);
                        });
                    }
                    catch (error) {
                        reject(new Error(`Failed to parse import data: ${error}`));
                    }
                });
            },
            exportToFile: (filePath) => {
                return new Promise((resolve, reject) => {
                    this.ldb().export()
                        .then(jsonData => {
                        const fs = require('fs');
                        fs.writeFile(filePath, jsonData, 'utf8', (err) => {
                            if (err) {
                                reject(new Error(`Failed to write export file: ${err.message}`));
                            }
                            else {
                                resolve(filePath);
                            }
                        });
                    })
                        .catch(error => {
                        reject(error);
                    });
                });
            },
            importFromFile: (filePath) => {
                return new Promise((resolve, reject) => {
                    const fs = require('fs');
                    fs.readFile(filePath, 'utf8', (err, data) => {
                        if (err) {
                            reject(new Error(`Failed to read import file: ${err.message}`));
                            return;
                        }
                        this.ldb().import(data)
                            .then(result => {
                            resolve(result);
                        })
                            .catch(error => {
                            reject(error);
                        });
                    });
                });
            },
            clear: () => {
                return new Promise((resolve, reject) => {
                    const tables = [
                        'fingerprint',
                        'studentAttendance',
                        'notifications',
                        'logs',
                        'sessions',
                        'users',
                        'courses',
                        'staff',
                        'students',
                        'faculties',
                        'departments',
                        'schools'
                    ];
                    this.db.serialize(() => {
                        this.db.run('BEGIN TRANSACTION');
                        let clearedTables = 0;
                        let hasError = false;
                        tables.forEach(tableName => {
                            if (hasError)
                                return;
                            this.db.run(`DELETE FROM ${tableName}`, (err) => {
                                if (err) {
                                    hasError = true;
                                    this.db.run('ROLLBACK');
                                    reject(new Error(`Failed to clear table ${tableName}: ${err.message}`));
                                    return;
                                }
                                clearedTables++;
                                if (clearedTables === tables.length) {
                                    this.db.run('COMMIT', (commitErr) => {
                                        if (commitErr) {
                                            reject(new Error(`Failed to commit clear operation: ${commitErr.message}`));
                                        }
                                        else {
                                            resolve(true);
                                        }
                                    });
                                }
                            });
                        });
                    });
                });
            }
        };
    }
}
exports.Database = Database;
