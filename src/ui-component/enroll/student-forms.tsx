import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

// material-ui
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import InputLabel from '@mui/material/InputLabel';
import Typography from '@mui/material/Typography';

// third party
import * as Yup from 'yup';
import { FormikErrors, useFormik } from 'formik';

// project imports
import { steps } from './student';
// assets
import { API_BASE_URL } from '../../config';
import { CircularProgress, IconButton, List, ListItem, ListItemText, ListSubheader, MenuItem, Select, TextField } from '@mui/material';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import AddchartIcon from '@mui/icons-material/Addchart';
import CloseIcon from '@mui/icons-material/Close';
import CaptureFinger from '../../views/captureFinger';
//@ts-ignore
import successGif from '../../assets/images/success.gif';
import { closeForm, FormSummary } from './course-forms';
import { Visibility, VisibilityOff } from '@mui/icons-material';

// ============================|| ACARDEMIC FORM STARTS||============================ //

const createAcadSchema = (type: 'student' | 'staff'): Yup.AnyObjectSchema =>
  Yup.object({
    school: Yup.string().required('School is required'),
    department: Yup.string().required('Department is required'),
    email: Yup.string().email('Invalid email').required('Email is required'),
    ...(type === 'student'
      ? {
          matric: Yup.string().required('Matric number is required'),
          level: Yup.number().required('Level is required').oneOf([100, 200, 300, 400, 500], 'Invalid level')
        }
      : {
          faculty: Yup.string().required('Faculty is required')
        })
  });
const studentAcadSchema = createAcadSchema('student');
const staffAcadSchema = createAcadSchema('staff');
type TStudentAcadForm = Yup.InferType<typeof studentAcadSchema>;
type TStaffAcadForm = Yup.InferType<typeof staffAcadSchema>;

interface AcadFormProps {
  onSubmit: (values: TStudentAcadForm | TStaffAcadForm) => void;
  values: {
    school: string;
    department: string;
    level: number;
    matric?: string;
    email?: string;
    faculty?: string;
  };
  type: 'student' | 'staff';
  user: any;
  isUpdate?: boolean;
}

interface AcadFormRef {
  submitForm: () => void;
  validateForm: () => Promise<FormikErrors<any>>;
  hasErrors: () => boolean;
  values: any;
  errors: FormikErrors<any>;
}

const AcadForm = forwardRef<AcadFormRef, AcadFormProps>(({ onSubmit, values, type, user, isUpdate = false }, ref) => {
  const formik = useFormik<TStaffAcadForm | TStaffAcadForm>({
    initialValues: values,
    enableReinitialize: true,
    validationSchema: type === 'student' ? studentAcadSchema : staffAcadSchema,
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
    <Box component="form" noValidate onSubmit={formik.handleSubmit}>
      {/* <Typography variant="h6" gutterBottom>
        Academic Information
      </Typography> */}
      {type === 'student' && (
        <TextField
          fullWidth
          id="matric"
          name="matric"
          label="Matric"
          value={formik.values.matric}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.matric && Boolean(formik.errors.matric)}
          // @ts-ignore
          helperText={formik.touched.matric && formik.errors.matric}
          margin="normal"
          disabled={isUpdate}
          InputProps={{
            readOnly: isUpdate,
          }}
        />
      )}

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
      {type === 'staff' && (
        <TextField
          fullWidth
          id="faculty"
          name="faculty"
          label="Faculty"
          value={formik.values.faculty}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.faculty && Boolean(formik.errors.faculty)}
          // @ts-ignore
          helperText={formik.touched.faculty && formik.errors.faculty}
          margin="normal"
        />
      )}
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
      {type === 'student' && (
        <FormControl fullWidth margin="normal" error={formik.touched.level && Boolean(formik.errors.level)}>
          <InputLabel id="level-label">Level</InputLabel>
          <Select
            labelId="level-label"
            id="level"
            name="level"
            value={formik.values.level}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            label="Level"
          >
            <MenuItem value={100}>100</MenuItem>
            <MenuItem value={200}>200</MenuItem>
            <MenuItem value={300}>300</MenuItem>
            <MenuItem value={400}>400</MenuItem>
            <MenuItem value={500}>500</MenuItem>
          </Select>
          {/* @ts-ignore  */}
          {formik.touched.level && formik.errors.level && <FormHelperText>{formik.errors.level}</FormHelperText>}
        </FormControl>
      )}
      <TextField
        fullWidth
        id="email"
        name="email"
        label="Email"
        type="email"
        value={formik.values.email}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={formik.touched.email && Boolean(formik.errors.email)}
        // @ts-ignore
        helperText={formik.touched.email && formik.errors.email}
        margin="normal"
      />
      {/* the bellow button is just there to enforce html 5 standard of form submission on enter key press */}
      <Button type="submit" style={{ display: 'none' }}></Button>
    </Box>
  );
});

// ============================|| ACARDEMIC FORM END ||============================ //

// ============================|| PERSONAL FORM STARTS ||============================ //

const createPersonSchema = (type: 'staff' | 'student'): Yup.AnyObjectSchema =>
  Yup.object({
    fullName: Yup.string()
      .matches(/^[a-zA-Z\s]+$/, 'Full name must only contain letters and spaces')
      .test('len', 'Full name must be between 2 and 3 words', (val) => {
        if (!val) return false;
        const words = val.trim().split(/\s+/);
        return words.length >= 2 && words.length <= 3;
      })
      .required('Full name is required'),
    gender: Yup.string().oneOf(['male', 'female'], 'please select a gender'),
    ...(type === 'student'
      ? { age: Yup.string().oneOf(['15 - 18', '18 - 22', '22 - 26', '26 - 30', '30 and above'], 'Please select an age range you falls beetween') }
      : {
          phone: Yup.string()
            .required('Phone number is required')
            .matches(/^[0-9]{11}$/, 'Invalid phone number'),
          password: Yup.string()
            .required('Password is required')
            .min(6, 'Password must be at least 6 characters long')
            .max(20, 'Password must not exceed 20 characters'),
          confirmPassword: Yup.string()
            .oneOf([Yup.ref('password'), undefined], 'Passwords must match')
            .required('Confirm password is required')
        }
      )
  });

const studentpersonSchema = createPersonSchema('student');
const staffpersonSchema = createPersonSchema('staff');

type TStudentPersonForm = Yup.InferType<typeof studentpersonSchema>;
type TStaffPersonForm = Yup.InferType<typeof staffpersonSchema>;

interface PersonFormProps {
  onSubmit: (values: TStudentPersonForm | TStaffPersonForm) => void;
  values: {
    fullName: string;
    gender: string;
    age: string;
    phone?: string;
    password?: string;
    confirmPassword?: string;
  };
  type: 'student' | 'staff';
  isUpdate?: boolean;
}

interface PersonFormRef {
  submitForm: () => void;
  validateForm: () => Promise<FormikErrors<TStudentPersonForm | TStaffPersonForm>>;
  hasErrors: () => boolean;
  values: TStudentPersonForm | TStaffPersonForm;
}

const PersonForm = forwardRef<PersonFormRef, PersonFormProps>(({ onSubmit, values, type, isUpdate = false }, ref) => {
  const formik = useFormik<TStudentPersonForm | TStaffPersonForm>({
    initialValues: values,
    enableReinitialize: true,
    validationSchema: type === 'student' ? studentpersonSchema : staffpersonSchema,
    onSubmit: (values) => {
      onSubmit(values);
    }
  });

  // Create refs to store the methods
  const submitFormRef = useRef(formik.submitForm);
  const validateFormRef = useRef(formik.validateForm);
  const hasErrorsRef = useRef(() => Object.keys(formik.errors).length > 0);
  const valuesRef = useRef(formik.values);

  const [passwordInputType, setPasswordInputType] = useState("password")
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
    values: valuesRef.current
  }));

  return (
    <Box component="form" noValidate onSubmit={formik.handleSubmit} width={'100%'} height={'100%'}>
      {/* <Typography variant="h6" gutterBottom>
        Personal Information
      </Typography> */}
      <TextField
        fullWidth
        id="fullName"
        name="fullName"
        label="Full Name"
        value={formik.values.fullName}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={formik.touched.fullName && Boolean(formik.errors.fullName)}
        // @ts-ignore
        helperText={formik.touched.fullName && formik.errors.fullName}
        margin="normal"
      />
      <FormControl fullWidth margin="normal" error={formik.touched.gender && Boolean(formik.errors.gender)}>
        <InputLabel id="gender-label">gender</InputLabel>
        <Select
          labelId="gender-label"
          id="gender"
          name="gender"
          value={formik.values.gender}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          label="gender"
        >
          <MenuItem value={'male'}>Male</MenuItem>
          <MenuItem value={'female'}>Female</MenuItem>
        </Select>
        {/* @ts-ignore */}
        {formik.touched.gender && formik.errors.gender && <FormHelperText>{formik.errors.gender}</FormHelperText>}
      </FormControl>
      {type === 'staff' ? (
        <>
        <TextField
          fullWidth
          id="phone"
          name="phone"
          label="Phone number"
          value={formik.values.phone}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.phone && Boolean(formik.errors.phone)}
          // @ts-ignore
          helperText={formik.touched.phone && formik.errors.phone}
          margin="normal"
        />
        <TextField
          fullWidth
          id="password"
          name="password"
          label="Password"
          type={passwordInputType}
          value={formik.values.password}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.password && Boolean(formik.errors.password)}
          // @ts-ignore
          helperText={formik.touched.password && formik.errors.password}
          margin="normal"
          InputProps={{
            endAdornment: <IconButton
              onClick={()=> setPasswordInputType(prev=> prev === "text" ? "password" : "text")}
              >{passwordInputType === "text" ? <VisibilityOff /> : <Visibility />}</IconButton>
          }}
        />
        <TextField
          fullWidth
          id="confirmPassword"
          name="confirmPassword"
          label="Confirm Password"
          type={passwordInputType}
          value={formik.values.confirmPassword}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
          // @ts-ignore
          helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
          margin="normal"
          InputProps={{
            endAdornment: <IconButton
              onClick={()=> setPasswordInputType(prev=> prev === "text" ? "password" : "text")}
              >{passwordInputType === "text" ? <VisibilityOff /> : <Visibility />}</IconButton>
          }}
        />
        </>
      ) : (
        <FormControl fullWidth margin="normal" error={formik.touched.age && Boolean(formik.errors.age)}>
          <InputLabel id="age-label">Age</InputLabel>
          <Select
            labelId="age-label"
            id="age"
            name="age"
            value={formik.values.age}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            label="Age"
          >
            <MenuItem value={'15 - 18'}>15 - 18</MenuItem>
            <MenuItem value={'18 - 22'}>18 - 22</MenuItem>
            <MenuItem value={'22 - 26'}>22 - 26</MenuItem>
            <MenuItem value={'30 and above'}>30 and above</MenuItem>
          </Select>
          {/* @ts-ignore */}
          {formik.touched.age && formik.errors.age && <FormHelperText>{formik.errors.age}</FormHelperText>}
        </FormControl>
      )}
      {/* the bellow button is just there to enforce html 5 standard of form submission on enter key press */}
      <Button type="submit" style={{ display: 'none' }}></Button>
    </Box>
  );
});
// ============================|| PERSONAL FORM END ||============================ //

interface StudentFormsProps {
  updateData?: {
    matric?: string;
    school: string;
    department: string;
    level?: number;
    email: string;
    faculty?: string;
    fullName: string;
    gender: string;
    age?: string;
    phone?: string;
    password?: string;
    confirmPassword?: string;
    fid1?: string;
    fid2?: string;

  };
  isUpdate?: boolean;
  type: 'student' | 'staff';
  [key: string]: any; // for spread props
}


export const StudentForms = ({ updateData, isUpdate = false, type, ...others }: StudentFormsProps) => {
  const theme = useTheme();
  const login = useSelector((state: any) => state.auth);
  const [checked, setChecked] = useState(false);
  const [status, setStatus] = useState({ success: false });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [fingerEnrolled, setFingerEnrolled] = useState(false);
  const [scannerAvailable, setScannerAvailable] = useState(false);

  const user = JSON.parse(window.localStorage.getItem('userData') || '{}');
  
  // Initialize form values based on whether it's an update or new registration
  const [values, setValues] = useState({
    academic: {
      school: updateData?.school || user?.school || '',
      department: updateData?.department || user?.department || '',
      email: updateData?.email || '',
      ...(type === 'student'
        ? {
            matric: updateData?.matric || '',
            level: updateData?.level || 100
          }
        : { faculty: updateData?.faculty || '' })
    },
    personal: {
      fullName: updateData?.fullName || '',
      gender: updateData?.gender || '',
      ...(type === 'staff' 
        ? { 
            phone: updateData?.phone || '', 
            password: updateData?.password || '',
            confirmPassword: '' // Always empty for security
          } 
        : { age: updateData?.age || '' })
    }
  });

  // Update form values when updateData changes (for update scenarios)
  useEffect(() => {
    if (updateData && isUpdate) {
      setValues({
        academic: {
          school: updateData.school || user?.school || '',
          department: updateData.department || user?.department || '',
          email: updateData.email || '',
          ...(type === 'student'
            ? {
                matric: updateData.matric || '',
                level: updateData.level || 100
              }
            : { faculty: updateData.faculty || '' })
        },
        personal: {
          fullName: updateData.fullName || '',
          gender: updateData.gender || '',
          ...(type === 'staff' 
            ? { 
                phone: updateData.phone || '', 
                password: '', // Don't pre-fill password for security
                confirmPassword: ''
              } 
            : { age: updateData.age || '' })
        }
      });
    }

    // @ts-ignore
    if (updateData && isUpdate && updateData.fid1) {
      setFingerEnrolled(true);
    }
  }, [updateData, isUpdate, type, user?.school, user?.department]);

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
    // @ts-ignore
    window.electronAPI
      .getScannerState()
      .then((response: { connected: boolean; inUse: boolean }) => {
        setScannerAvailable(response.connected);
      })
      .catch((error: any) => {
        console.log('get scanner state error', error);
      });

    // @ts-ignore

    window.electronAPI.onScannerAvailable((available) => {
      setScannerAvailable(available);
    });

    if (login.isAuthenticated) navigate('/');
    // @ts-ignore
    window.electronAPI.onScannerAvailable((available) => {
      setScannerAvailable(available);
    });
  }, []);
  const acadFormRef = useRef<AcadFormRef>(null);
  const personFormRef = useRef<PersonFormRef>(null);

  const handleSubmit = async (values: any | TStudentPersonForm | TStaffPersonForm) => {
    if (others.activeStep === 0) {
      //@ts-ignore
      setValues((prevValues) => ({
        ...prevValues,
        academic: values
      }));
    } else if (others.activeStep === 1) {
      //@ts-ignore
      setValues((prevValues) => ({
        ...prevValues,
        personal: values
      }));
    }
  };

  const resetForm = () => {
    const defaultValues = {
      academic: {
        matric: '',
        school: user.school || '',
        department: user.department || '',
        level: 100,
        email: '',
        ...(type === 'staff' ? { faculty: '' } : {})
      },
      personal: {
        fullName: '',
        gender: '',
        ...(type === 'staff' 
          ? { phone: '', password: '', confirmPassword: '' } 
          : { age: '' })
      }
    };

    setValues(defaultValues);
    setFingerEnrolled(false);
    others.setActiveStep(0);
    others.setCompleted({ 0: false, 1: false, 2: false, 3: false });
    status.success && setStatus({ success: false });
  };

  const enrollStudent = async () => {
    try {
      const payload = { ...values.academic, ...values.personal };
      
      let result;
      if (isUpdate) {
        // @ts-ignore
        if(!payload.fid1 && updateData?.fid1) {
          // @ts-ignore
          payload.fid1 = updateData.fid1;
        }
        // @ts-ignore
        if(!payload.fid2 && updateData?.fid2) {
          // @ts-ignore
          payload.fid2 = updateData.fid2;
        }
        // For updates, we need to identify by matric (student) or email (staff)
        const identifier = type === 'student' 
          ? (values.academic as any).matric 
          : values.academic.email;
        // Note: You'll need to add updateStudent and updateStaff methods to your electronAPI
        result = type === 'student'
          ? //@ts-ignore
            await window.electronAPI.updateStudent(identifier, payload)
          : //@ts-ignore
            await window.electronAPI.updateStaff(identifier, payload);
      } else {
        // For new registrations
        result = type === 'student'
          ? //@ts-ignore
            await window.electronAPI.enrollStudent(payload)
          : //@ts-ignore
            await window.electronAPI.enrollStaff(payload);
      }
      
      if (result.error) {
        setError(result.error);
      } else {
        setStatus({ success: true });
      }
    } catch (error: any) {
      console.error(error);
      setError(error.message || error);
    }
  };
  const handleNext = async () => {
    let ref;
    if (others.activeStep === 0) {
      ref = acadFormRef;
    } else if (others.activeStep === 1) {
      ref = personFormRef;
    }
    if (ref && ref.current) {
      await ref.current.validateForm();
      if (!ref.current.hasErrors()) {
        ref.current.submitForm();
        others.setCompleted((prevCompleted: any) => ({ ...prevCompleted, [others.activeStep]: true }));
        others.setActiveStep((prevActiveStep: number) => prevActiveStep + 1);
      } else {
        ref.current.submitForm();
      }
    } else if (others.activeStep === 2) {
      fingerEnrolled && others.setActiveStep((prevActiveStep: number) => prevActiveStep + 1);
      others.setCompleted((prevCompleted: any) => ({ ...prevCompleted, [others.activeStep]: true }));
    } else if (others.activeStep === 3 && (fingerEnrolled || isUpdate)) {
      try {
        //@ts-ignore
        const result = await window.electronAPI.enrollStudent({ ...values.academic, ...values.personal });
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
        //@ts-ignore
        <AcadForm ref={acadFormRef} onSubmit={handleSubmit} values={values.academic} type={type} user={user} isUpdate={isUpdate} />
      )}
      {others.activeStep === 1 && (
      //@ts-ignore
        <PersonForm ref={personFormRef} onSubmit={handleSubmit} values={values.personal} type={type} isUpdate={isUpdate} />
      )}
      {others.activeStep === 2 && (
        <CaptureFinger
        action="enroll"
        setResult={setFingerEnrolled}
        setError={() => {}}
        // @ts-ignore
          userId={type === 'student' ? values.academic.matric : values.academic.email}
          scannerAvailable={scannerAvailable}
          preventDuplicate={!isUpdate}
        />
      )}
      {others.activeStep === 3 ? (
        !status.success ? (
          <FormSummary values={values} />
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <img src={successGif} alt="success" width={300} height={300} style={{ borderRadius: '50%' }} />
            <Box sx={{ height: 30 }} />
            <Typography variant="h4" gutterBottom>
              {isUpdate 
                ? `${type === 'student' ? 'Student' : 'Staff'} updated successfully`
                : `${type === 'student' ? 'Student' : 'Staff'} enrolled successfully`
              }
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
            width: { xs: '45%', sm: '40', md: '30%', lg: '25%' },
            visibility: others.activeStep > 0 ? 'visible' : 'hidden'
          }}
          onClick={() =>
            others.activeStep === steps.length - 1 && status.success
              ? resetForm()
              : others.setActiveStep((prevActiveStep: number) => prevActiveStep - 1)
          }
          onKeyDown={(event) =>
            // @ts-ignore
            handleKeyDown(others.activeStep === steps.length - 1 && status.success)
              ? resetForm()
              : others.setActiveStep((prevActiveStep: number) => prevActiveStep - 1)
          }
        >
          {others.activeStep === steps.length - 1 && status.success
            ? 'NEW'
            : others.activeStep === 0
              ? 'Back'
              : steps[others.activeStep - 1]}
        </Button>
        <Button
          sx={{
            width: { xs: '45%', sm: '40', md: '30%', lg: '25%' }
          }}
          // disableElevation
          disabled={submitting || (others.activeStep === steps.length - 2 && !fingerEnrolled)}
          fullWidth
          size="large"
          type="submit"
          variant="contained"
          color="secondary"
          onClick={others.activeStep === steps.length - 1 ? (status.success ? closeForm : enrollStudent) : handleNext}
          // @ts-ignore
          onKeyDown={(event) => handleKeyDown(event, () => (others.activeStep === steps.length - 1 ? enrollStudent : handleNext))}
          endIcon={status.success ? <CloseIcon /> : <KeyboardArrowRightIcon />}
        >
          {others.activeStep === steps.length - 1 ? 'Finish' : steps[others.activeStep + 1]}
        </Button>
      </Box>
    </Box>
  );
};
