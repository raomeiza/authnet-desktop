import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

// material-ui
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

// third party
import * as Yup from 'yup';
import { FormikErrors, useFormik } from 'formik';

// project imports
import { steps } from './course';
// assets
import { API_BASE_URL } from '../../config';
import {
  Checkbox,
  Chip,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  MenuItem,
  Paper,
  Select,
  TextField,
  Tooltip
} from '@mui/material';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import AddchartIcon from '@mui/icons-material/Addchart';
import CloseIcon from '@mui/icons-material/Close';
//@ts-ignore
import successGif from '../../assets/images/success.gif';

// ============================|| ACARDEMIC FORM STARTS||============================ //

const basicSchema = Yup.object({
  courseCode: Yup.string().required('Course code is required'),
  courseTitle: Yup.string().required('Course title is required'),
  startTime: Yup.string().required('Start time is required'),
  duration: Yup.string().required('Duration is required'),
  startsOn: Yup.string().required('Start date is required'),
  venue: Yup.string().required('Venue is required')
});

type TBasicForm = Yup.InferType<typeof basicSchema>;

interface BasicFormProps {
  onSubmit: (values: TBasicForm) => void;
  values: {
    courseCode: string;
    courseTitle: string;
    startTime: string;
    duration: string;
    startsOn: string;
    venue: string;
  };
  handleNext: () => void;
  isUpdate?: boolean;
}

interface BasicForm {
  submitForm: () => void;
  validateForm: () => Promise<FormikErrors<any>>;
  hasErrors: () => boolean;
  values: TBasicForm;
  errors: FormikErrors<any>;
}

export const closeForm = () => {
  try {
    //@ts-ignore
    window.electronAPI.closeWindow();
  } catch (error: any) {
    console.error(error);
  }
};

const AcadForm = forwardRef<BasicForm, BasicFormProps>(({ onSubmit, values, handleNext, isUpdate = false }, ref) => {
  const formik = useFormik<TBasicForm>({
    initialValues: values,
    enableReinitialize: true,
    validationSchema: basicSchema,
    onSubmit: (values) => {
      onSubmit(values);
    }
  });

  // Create refs to store the methods
  const submitFormRef = useRef(formik.submitForm);
  const validateFormRef = useRef(formik.validateForm);
  const hasErrorsRef = useRef(() => Object.keys(formik.errors).length > 0);
  const valuesRef = useRef(formik.values);
  const formikRef = useRef(formik);

  // Update the refs whenever the methods change
  useEffect(() => {
    submitFormRef.current = formik.submitForm;
    validateFormRef.current = formik.validateForm;
    hasErrorsRef.current = () => Object.keys(formik.errors).length > 0;
    valuesRef.current = formik.values;
  }, [formik.submitForm, formik.validateForm, formik.errors]);

  // Expose the methods to be called programmatically
  useImperativeHandle(ref, () => ({
    submitForm: () => submitFormRef.current(),
    validateForm: () => validateFormRef.current(),
    hasErrors: () => hasErrorsRef.current(),
    values: valuesRef.current,
    errors: formik.errors
  }));

  return (
    <Box component="form" noValidate onSubmit={handleNext}>
      <TextField
        fullWidth
        id="courseCode"
        name="courseCode"
        label="Course Code"
        value={formik.values.courseCode}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={formik.touched.courseCode && Boolean(formik.errors.courseCode)}
        helperText={formik.touched.courseCode && formik.errors.courseCode}
        margin="normal"
        disabled={isUpdate}
        InputProps={{
          readOnly: isUpdate,
        }}
      />
      <TextField
        fullWidth
        id="courseTitle"
        name="courseTitle"
        label="Course Title"
        value={formik.values.courseTitle}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={formik.touched.courseTitle && Boolean(formik.errors.courseTitle)}
        helperText={formik.touched.courseTitle && formik.errors.courseTitle}
        margin="normal"
      />
      <TextField
        fullWidth
        id="startTime"
        name="startTime"
        label="Start Time"
        value={formik.values.startTime}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={formik.touched.startTime && Boolean(formik.errors.startTime)}
        helperText={formik.touched.startTime && formik.errors.startTime}
        margin="normal"
      />
      <TextField
        fullWidth
        id="duration"
        name="duration"
        label="Duration"
        value={formik.values.duration}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={formik.touched.duration && Boolean(formik.errors.duration)}
        helperText={formik.touched.duration && formik.errors.duration}
        margin="normal"
      />
      <TextField
        fullWidth
        id="startsOn"
        name="startsOn"
        label="Starts On"
        value={formik.values.startsOn}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={formik.touched.startsOn && Boolean(formik.errors.startsOn)}
        helperText={formik.touched.startsOn && formik.errors.startsOn}
        margin="normal"
      />
      <TextField
        fullWidth
        id="venue"
        name="venue"
        label="Venue"
        value={formik.values.venue}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={formik.touched.venue && Boolean(formik.errors.venue)}
        helperText={formik.touched.venue && formik.errors.venue}
        margin="normal"
      />
      {/* the bellow button is just there to enforce html 5 standard of form submission on enter key press */}
      <Button type="submit" style={{ display: 'none' }}></Button>
    </Box>
  );
});

// ============================|| ACARDEMIC FORM END ||============================ //

// ============================|| PERSONAL FORM STARTS ||============================ //

const otherFormSchema = Yup.object({
  department: Yup.string().required('Department is required'),
  lecturers: Yup.string().required('Lecturers are required'),
  students: Yup.string(),
  school: Yup.string().required('School is required')
});

type TOtherForm = Yup.InferType<typeof otherFormSchema>;

interface TOtherFormProps {
  onSubmit: (values: TOtherForm) => void;
  values: {
    department: string;
    lecturers: string;
    students: string;
    school: string;
  };
}
interface OtherFormProps {
  onSubmit: (values: TOtherForm) => void;
  values: {
    department: string;
    lecturers: string;
    students: string;
    school: string;
  };
  user: any;
  isUpdate?: boolean;
}

interface OtherFormRef {
  submitForm: () => void;
  validateForm: () => Promise<FormikErrors<TOtherForm>>;
  hasErrors: () => boolean;
  values: TOtherForm;
}

const PersonForm = forwardRef<OtherFormRef, OtherFormProps>(({ onSubmit, values, user, isUpdate = false }, ref) => {
  const formik = useFormik<TOtherForm>({
    initialValues: values,
    enableReinitialize: true,
    validationSchema: otherFormSchema,
    onSubmit: (values) => {
      onSubmit(values);
    }
  });

  // Create refs to store the methods
  const submitFormRef = useRef(formik.submitForm);
  const validateFormRef = useRef(formik.validateForm);
  const hasErrorsRef = useRef(() => Object.keys(formik.errors).length > 0);
  const valuesRef = useRef(formik.values);
  const [level, setLevel] = useState<string>('');
  const [showLevelField, setShowLevelField] = useState(false);
  const [loadedStudents, setLoadedStudents] = useState<string[]>([]);
  const [checked, setChecked] = useState<number[]>([]);

  // listen to loaded students change and log it
  // Initialize loadedStudents with existing course students when updating
  useEffect(() => {
    if (values.students) {
      try {
        let existingStudents;
        
        // Handle both cases: string (JSON) or already parsed array
        if (typeof values.students === 'string') {
          existingStudents = JSON.parse(values.students);
        } else {
          existingStudents = values.students;
        }
        
        if (Array.isArray(existingStudents)) {
          setLoadedStudents(existingStudents);
        } else {
          setLoadedStudents([]);
        }
      } catch (e) {
        setLoadedStudents([]);
      }
    } else {
      setLoadedStudents([]);
    }
  }, [values.students]);

  const handleRemoveStudent = (matricToRemove: string) => {
    setLoadedStudents(prev => prev.filter(matric => matric !== matricToRemove));
  };

  const handleToggle = (value: number) => () => {
    const currentIndex = checked.indexOf(value);
    const newChecked = [...checked];

    if (currentIndex === -1) {
      newChecked.push(value);
    } else {
      newChecked.splice(currentIndex, 1);
    }

    setChecked(newChecked);
  };
  // when we have a new level, load the students for that level
  useEffect(() => {
    const fetchStudents = async (level: number) => {
      try {
        //@ts-ignore
        const result = await window.electronAPI.getStudentsByLevel(level);
        // for each of the students, extract their matric and ensure uniqueness
        const newMatrics = result.map((student: any) => student.matric);
        setLoadedStudents((prev) => {
          const combined = [...prev, ...newMatrics];
          // return only unique matrics
          return combined.filter((matric, index, self) => self.indexOf(matric) === index);
        });
      } catch (error: any) {
        console.error(error);
      }
    };

    const fetchAllSelectedLevels = async () => {
      try {
        let allMatrics: string[] = [];
        
        for (const level of checked) {
          //@ts-ignore
          const result = await window.electronAPI.getStudentsByLevel(level);
          const matrics = result.map((student: any) => student.matric);
          allMatrics = [...allMatrics, ...matrics];
        }
        
        // Remove duplicates and set the final list
        const uniqueMatrics = allMatrics.filter((matric, index, self) => self.indexOf(matric) === index);
        setLoadedStudents(uniqueMatrics);
      } catch (error: any) {
        console.error(error);
      }
    };

    if (checked.length > 0) {
      fetchAllSelectedLevels();
    } else if (!isUpdate || !values.students) {
      // Only clear students if we're not in update mode or if there are no existing students
      setLoadedStudents([]);
    }
  }, [checked]);

  // once loaded students change, update the formik values
  useEffect(() => {
    // Convert array of matrics to JSON string format for the database
    formik.setFieldValue('students', JSON.stringify(loadedStudents));
  }, [loadedStudents]);

  // Update the refs whenever the methods change
  useEffect(() => {
    submitFormRef.current = formik.submitForm;
    validateFormRef.current = formik.validateForm;
    hasErrorsRef.current = () => Object.keys(formik.errors).length > 0;
    valuesRef.current = formik.values;
  }, [formik.submitForm, formik.validateForm, formik.errors]);

  // load students on level change
  useEffect(() => {
    if (!level) return; // Don't fetch if level is empty
    
    const fetchStudents = async () => {
      try {
        //@ts-ignore
        const result = await window.electronAPI.getStudentsFromLevel(level);
        // for each of the students, extract their matric only
        const matrics = result.map((student: any) => student.matric);
        // set the students as JSON string to the formik values
        formik.setFieldValue('students', JSON.stringify(matrics));
        setLoadedStudents(matrics);
      } catch (error: any) {
        console.error(error);
      }
    };
    fetchStudents();
  }, [level]);
  // Expose the methods to be called programmatically
  useImperativeHandle(ref, () => ({
    submitForm: () => submitFormRef.current(),
    validateForm: () => validateFormRef.current(),
    hasErrors: () => hasErrorsRef.current(),
    values: valuesRef.current
  }));

  return (
    <Box component="form" noValidate onSubmit={formik.handleSubmit} width={'100%'} height={'100%'}>
      {/* <Typography variant="h6" gutterBottom>
        Personal Information
      </Typography> */}
      <TextField
        fullWidth
        id="department"
        name="department"
        label="Department"
        value={formik.values.department}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={formik.touched.department && Boolean(formik.errors.department)}
        // @ts-ignore
        helperText={formik.touched.department && formik.errors.department}
        margin="normal"
        // disabled={user.department}
      />
      <TextField
        fullWidth
        id="lecturers"
        name="lecturers"
        label="Lecturers"
        value={formik.values.lecturers}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={formik.touched.lecturers && Boolean(formik.errors.lecturers)}
        // @ts-ignore
        helperText={formik.touched.lecturers && formik.errors.lecturers}
        margin="normal"
      />
      {
        // create an mui checkbox to show the level field
        <Paper
          sx={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'left',
            maxHeight: '200px',
            width: '100%',
            borderBottom: '1px solid #ccc',
            margin: 2
          }}
          elevation={0}
        >
          {/* <FormControlLabel
            control={
              <Checkbox checked={showLevelField} onChange={(event: any) => setShowLevelField(event.target.checked)} name="checked" color="secondary" />
            }
            label="Pick students from a level"
            sx={{ width: '50%' }}
          />

        { //create a select field to show the levels 
        showLevelField &&
        <FormControl margin="normal" error={showLevelField && level === '' } sx= {{width:"50%"}}>
          <InputLabel id="level-label">Level</InputLabel>
          <Select
            labelId="level-label"
            id="level"
            name="level"
            value={level}
            onChange={(event: any) => setLevel(event.target.value)}
            // onBlur=
            label="Level"
          >
            <MenuItem value={100}>100</MenuItem>
            <MenuItem value={200}>200</MenuItem>
            <MenuItem value={300}>300</MenuItem>
            <MenuItem value={400}>400</MenuItem>
            <MenuItem value={500}>500</MenuItem>
          </Select>
        </FormControl>
        } */}
          <Box
            sx={{
              width: '80%',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'start',
              marginBottom: 2,
              gap: 1
            }}
            id="selected-students-tooltip-container"
          >
            {
              loadedStudents.map((matric: string, index: number) => (
                <Tooltip key={index} title={`Click X to remove ${matric}`}>
                  <Chip 
                    label={matric} 
                    onDelete={() => handleRemoveStudent(matric)}
                    color="primary"
                    variant="outlined"
                  />
                </Tooltip>
              ))
            }
          </Box>
          <Box sx={{ width: '20%' }} id="levels-list-container">
            <List>
              {[100, 200, 300, 400, 500].map((value) => {
                const labelId = `checkbox-list-label-${value}`;

                return (
                  <ListItem key={value} disablePadding>
                    <ListItemButton role={undefined} onClick={handleToggle(value)} dense sx={{ padding: 0, margin: 0 }}>
                      <ListItemIcon>
                        <Checkbox
                          edge="start"
                          checked={checked.includes(value)}
                          tabIndex={-1}
                          disableRipple
                          inputProps={{ 'aria-labelledby': labelId }}
                        />
                      </ListItemIcon>
                      <ListItemText id={labelId} primary={`Level ${value}`} />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          </Box>
        </Paper>
      }
      <TextField
        fullWidth
        id="students"
        name="students"
        label="Students"
        value={formik.values.students}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={formik.touched.students && Boolean(formik.errors.students)}
        // @ts-ignore
        helperText={formik.touched.students && formik.errors.students}
        margin="normal"
      />
      <TextField
        fullWidth
        id="school"
        name="school"
        label="School"
        value={formik.values.school}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={formik.touched.school && Boolean(formik.errors.school)}
        // @ts-ignore
        helperText={formik.touched.school && formik.errors.school}
        margin="normal"
        // disabled={user.school}
      />
      {/* the bellow button is just there to enforce html 5 standard of form submission on enter key press */}
      <Button type="submit" style={{ display: 'none' }}></Button>
    </Box>
  );
});
// ============================|| PERSONAL FORM END ||============================ //

export function FormSummary({ values }: { values: any }) {
  return (
    <List
      sx={{
        width: '100%',
        maxWidth: 360,
        bgcolor: 'background.paper',
        position: 'relative',
        overflow: 'auto',
        maxHeight: '60%',
        '& ul': { padding: 0 },
        textTransform: 'capitalize',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      subheader={<li />}
    >
      {Object.keys(values).map((key) => (
        <li key={`section-${key}`} style={{ backgroundColor: 'inherit' }}>
          <ul>
            <ListSubheader sx={{ fontSize: '2rem', fontWeight: 'bold' }}>{key}</ListSubheader>
            <Grid container spacing={2}>
              {
                //@ts-ignore
                Object.keys(values[key]).map((k) => (
                  <Grid item xs={12} sm={6} key={`item-${k}`}>
                    <ListItem key={`item-${k}`} sx={{ fontSize: '2rem', fontWeight: 'bold' }}>
                      {/* @ts-ignore */}
                      <ListItemText primary={k} secondary={values[key][k]} sx={{ fontSize: '1.6rem', fontWeight: 'normal' }} />
                    </ListItem>
                  </Grid>
                ))
              }
            </Grid>
          </ul>
        </li>
      ))}
    </List>
  );
}

interface CourseFormsProps {
  courseData?: {
    courseCode: string;
    courseTitle: string;
    startTime: string;
    duration: string;
    startsOn: string;
    venue: string;
    department: string;
    lecturers: string;
    students: string;
    school: string;
  };
  isUpdate?: boolean;
  [key: string]: any; // for spread props
}

export const CourseForms = ({ courseData, isUpdate = false, ...others }: CourseFormsProps) => {
  const theme = useTheme();
  const login = useSelector((state: any) => state.auth);
  const [checked, setChecked] = useState(false);
  const [status, setStatus] = useState({ success: false });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  // get user data from local storage
  const user = JSON.parse(localStorage.getItem('userData') || '{}');
  
  // Initialize form values based on whether it's an update or new creation
  const [values, setValues] = useState({
    basic: {
      courseCode: courseData?.courseCode || '',
      courseTitle: courseData?.courseTitle || '',
      startTime: courseData?.startTime || '',
      duration: courseData?.duration || '',
      startsOn: courseData?.startsOn || '',
      venue: courseData?.venue || ''
    },
    other: {
      department: courseData?.department || user.department || '',
      lecturers: courseData?.lecturers || user.email || '',
      students: courseData?.students || '',
      school: courseData?.school || user.school || ''
    }
  });

  // Update form values when courseData changes (for update scenarios)
  useEffect(() => {
    if (courseData && isUpdate) {
      setValues({
        basic: {
          courseCode: courseData.courseCode || '',
          courseTitle: courseData.courseTitle || '',
          startTime: courseData.startTime || '',
          duration: courseData.duration || '',
          startsOn: courseData.startsOn || '',
          venue: courseData.venue || ''
        },
        other: {
          department: courseData.department || user.department || '',
          lecturers: courseData.lecturers || user.email || '',
          students: courseData.students || '',
          school: courseData.school || user.school || ''
        }
      });
    }
  }, [courseData, isUpdate, user.department, user.email, user.school]);

  const dispatch = useDispatch();
  const googleHandler = async () => {
    console.error('Login');
  };

  const [showPassword, setShowPassword] = useState(false);
  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const navigate = useNavigate();
  const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };
  // create a regexp to validate email
  const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i;

  useEffect(() => {
    if (login.isAuthenticated) navigate('/');
  }, []);

  const BasicForm = useRef<BasicForm>(null);
  const OtherFormRef = useRef<OtherFormRef>(null);

  const handleSubmit = async (values: TBasicForm | TOtherForm) => {
    if (others.activeStep === 0) {
      //@ts-ignore
      setValues((prevValues) => ({
        ...prevValues,
        basic: values
      }));
    } else if (others.activeStep === 1) {
      //@ts-ignore
      setValues((prevValues) => ({
        ...prevValues,
        other: values
      }));
    }
  };

  const resetForm = () => {
    const defaultValues = {
      basic: {
        courseCode: '',
        courseTitle: '',
        startTime: '',
        duration: '',
        startsOn: '',
        venue: ''
      },
      other: {
        department: user.department || '',
        lecturers: user.email || '',
        students: '',
        school: user.school || ''
      }
    };

    setValues(defaultValues);
    others.setActiveStep(0);
    others.setCompleted({ 0: false, 1: false, 2: false, 3: false });
    status.success && setStatus({ success: false });
  };

  const saveCorse = async () => {
    try {
      const coursePayload = {
        ...values.basic,
        ...values.other,
        // students field is already a JSON string, no need to re-process it
        students: values.other.students
      };

      let result;
      if (isUpdate && courseData?.courseCode) {
        //@ts-ignore
        result = await window.electronAPI.updateCourse(courseData.courseCode, coursePayload);
      } else {
        //@ts-ignore
        result = await window.electronAPI.createCourse(coursePayload);
      }

      if (result.error) {
        alert(result.error);
        setError(result.error);
      } else {
        setStatus({ success: true });
      }
    } catch (error: any) {
      setError(error);
    }
  };
  const handleNext = async (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    let ref;
    if (others.activeStep === 0) {
      ref = BasicForm;
    } else if (others.activeStep === 1) {
      ref = OtherFormRef;
    }
    if (ref && ref.current) {
      await ref.current.validateForm();
      if (!ref.current.hasErrors()) {
        ref.current.submitForm();
        others.setCompleted((prevCompleted: any) => ({ ...prevCompleted, [others.activeStep]: true }));
        others.setActiveStep((prevActiveStep: number) => prevActiveStep + 1);
      } else {
        ref.current.submitForm();
        //@ts-ignore
      }
    } else if (others.activeStep === steps.length - 1) {
      try {
        //@ts-ignore
        const result = await window.electronAPI.saveCorse({ ...values.basic, ...values.personal });
        if (result.error) {
          setError(result.error);
        } else {
          setStatus({ success: true });
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent, action: () => void | Promise<void>) => {
    if (event.key === 'Enter') {
      action();
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '100%',
        gap: 'auto',
        minHeight: '60vh'
      }}
    >
      {others.activeStep === 0 && (
        // @ts-ignore
        <AcadForm ref={BasicForm} onSubmit={handleSubmit} values={values.basic} handleNext={handleNext} isUpdate={isUpdate} />
      )}
      {others.activeStep === 1 && (
        // @ts-ignore
        <PersonForm ref={OtherFormRef} onSubmit={handleSubmit} values={values.other} user={user} isUpdate={isUpdate} />
      )}
      {others.activeStep === 2 ? (
        !status.success ? (
          <FormSummary values={{ ...values }} />
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <img src={successGif} alt="success" width={300} height={300} style={{ borderRadius: '50%' }} />
            <Box sx={{ height: 30 }} />
            <Typography variant="h4" gutterBottom>
              {isUpdate ? 'Course updated successfully' : 'Course created successfully'}
            </Typography>
          </Box>
        )
      ) : null}

      <Box
        sx={{
          mt: 2,
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%'
        }}
      >
        <Button
          // disableElevation
          disabled={others.activeStep === 0}
          fullWidth
          size="large"
          type="submit"
          variant="contained"
          color="secondary"
          startIcon={status.success ? <AddchartIcon /> : <KeyboardArrowLeftIcon />}
          sx={{
            visibility: others.activeStep > 0 ? 'visible' : 'hidden'
          }}
          onClick={() =>
            others.activeStep === steps.length - 1 && status.success
              ? resetForm()
              : others.setActiveStep((prevActiveStep: number) => prevActiveStep - 1)
          }
          onKeyDown={(event) =>
            handleKeyDown(event, () =>
              others.activeStep === steps.length - 1 && status.success
                ? resetForm()
                : others.setActiveStep((prevActiveStep: number) => prevActiveStep - 1)
            )
          }
        >
          {others.activeStep === steps.length - 1 && status.success
            ? 'NEW'
            : others.activeStep === 0
              ? 'Back'
              : steps[others.activeStep - 1]}
        </Button>
        <Button
          // disableElevation
          // disabled={
          fullWidth
          size="large"
          type="submit"
          variant="contained"
          color="secondary"
          onClick={others.activeStep === steps.length - 1 ? (status.success ? closeForm : saveCorse) : handleNext}
          //@ts-ignore
          onKeyDown={(event) => handleKeyDown(event, () => (others.activeStep === steps.length - 1 ? saveCorse : handleNext))}
          endIcon={status.success ? <CloseIcon /> : <KeyboardArrowRightIcon />}
        >
          {others.activeStep === steps.length - 1 ? 'Finish' : steps[others.activeStep + 1]}
        </Button>
      </Box>
    </Box>
  );
};
