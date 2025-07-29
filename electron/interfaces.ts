export type IStudent = {
  id: number;
  fid1: number;
  fid2: number;
  fullName: string;
  matric: string;
  gender: 'male' | 'female';
  age: string;
  school: string;
  department: string;
  level: string;
  email: string;
  createdAt: Date;
  courses: string;
}

export type ICourse = {
  attendance: any[];
  courseCode: string;
  courseTitle: string;
  school: string;
  department: string;
  venue: string;
  startTime: string;
  duration: number;
  lecturers: string[];
  students: string;
  startsOn: string;
  createdAt: Date;
  createdBy: string;
}

export type IStaff = {
  id: number;
  fullName: string;
  school: string;
  department: string;
  email: string;
  fid1: number;
  fid2: number;
  gender: 'male' | 'female';
  createdAt: Date;
  phone: string;
  faculty: string;
  password?: string;
}

export type ISchool = {
  name: string;
  departments: string[];
  createdAt: Date;
  faculties: string[];
}

export type IFaculty = {
  name: string;
  departments: string[];
  school: string;
  createdAt: Date;
}

export type IDepartment = {
  name: string;
  code: string;
  courses: string[];
  school: string;
  faculty: string;
  createdAt: Date;
}

export type IStudentAttendance = {
  id?: number;
  studentMatric: string;
  courseCode: string;
  date: string;
  timestamp: Date;
  mode: 'bio' | 'manual';
  createdAt: Date;
}