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
import { CircularProgress, MenuItem, Select, TextField } from '@mui/material';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import CaptureFinger from '../../views/captureFinger';

const personSchema = Yup.object({
  fullName: Yup.string()
    .matches(/^[a-zA-Z\s]+$/, 'Full name must only contain letters and spaces')
    .test('len', 'Full name must be between 2 and 3 words', (val) => {
      if (!val) return false;
      const words = val.trim().split(/\s+/);
      return words.length >= 2 && words.length <= 3;
    })
    .required('Full name is required'),
  gender: Yup.string().oneOf(['male', 'female'], 'please select a gender'),
  age: Yup.string().oneOf(['15 - 18', '18 - 22', '22 - 26', '26 - 30', '30 and above'], 'Please select an age range you falls beetween')
});

type TPersonForm = Yup.InferType<typeof personSchema>;

interface PersonFormProps {
  onSubmit: (values: TPersonForm) => void;
  values: {
    fullName: string;
    gender: string;
    age: string;
  };
}

interface PersonFormRef {
  submitForm: () => void;
  validateForm: () => Promise<FormikErrors<TPersonForm>>;
  hasErrors: () => boolean;
}

const PersonForm = ({ onSubmit, values }: PersonFormProps, ref: React.Ref<PersonFormRef>) => {
  const formik = useFormik<TPersonForm>({
    initialValues: values,
    validationSchema: personSchema,
    onSubmit: (values) => {
      onSubmit(values);
    }
  });

  // Create refs to store the methods
  const submitFormRef = useRef(formik.submitForm);

  const validateFormRef = useRef(formik.validateForm);
  const hasErrorsRef = useRef(() => Object.keys(formik.errors).length > 0);

  // Update the refs whenever the methods change
  useEffect(() => {
    submitFormRef.current = formik.submitForm;
    validateFormRef.current = formik.validateForm;
    hasErrorsRef.current = () => Object.keys(formik.errors).length > 0;
  }, [formik.submitForm, formik.validateForm, formik.errors]);

  // Expose the methods to be called programmatically
  useImperativeHandle(ref, () => ({
    submitForm: () => submitFormRef.current(),
    validateForm: () => validateFormRef.current(),
    hasErrors: () => hasErrorsRef.current()
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
        {formik.touched.gender && formik.errors.gender && <FormHelperText>{formik.errors.gender}</FormHelperText>}
      </FormControl>
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
        {formik.touched.age && formik.errors.age && <FormHelperText>{formik.errors.age}</FormHelperText>}
      </FormControl>
    </Box>
  );
};
// ============================|| PERSONAL FORM END ||============================ //

export const StudentForms = ({ ...others }) => {
  const theme = useTheme();
  const login = useSelector((state: any) => state.auth);
  const [checked, setChecked] = useState(true);
  const [status, setStatus] = useState({ success: false });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [values, setValues] = useState({
    academic: {
      matric: '',
      school: '',
      department: '',
      level: 100,
      email: ''
    },
    personal: {
      fullName: '',
      gender: 'male',
      age: '15 - 18'
    }
  });

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
  const handlemSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    // get the form data
    const form: any = event.target;
    const data = new FormData(form);
    const values = Object.fromEntries(data.entries());
    try {
      if (typeof values.email === 'string' && values.email.match(emailRegex)) {
        fetch(`${API_BASE_URL}/user/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(values)
        })
          .then((response) => response.json())
          .then((data) => {
            // put the data in the store
            dispatch({ type: 'LOGIN', payload: data });
            // navigate to dashboard
            navigate('/');
            if (data.error) {
              setError(data.error);
              setSubmitting(false);
            } else {
              setStatus({ success: true });
              setSubmitting(false);
            }
          });
      } else {
        setError('Invalid email address');
      }
    } catch (err) {
      console.error(err);
      setSubmitting(false);
      setError('Failed to login');
    }
  };

  const handleSubmit = (values: TPersonForm) => {
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

  return (
    <>
      <PersonForm onSubmit={handleSubmit} values={values.personal} />
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
          disableElevation
          disabled={others.activeStep === 0}
          fullWidth
          size="large"
          type="submit"
          variant="contained"
          color="secondary"
          startIcon={<KeyboardArrowLeftIcon />}
          sx={{
            visibility: others.activeStep > 0 ? 'visible' : 'hidden'
          }}
          onClick={() => others.setActiveStep((prevActiveStep: number) => prevActiveStep - 1)}
        >
          {others.activeStep === 0 ? 'Back' : steps[others.activeStep - 1]}
        </Button>
        <Button
          disableElevation
          disabled={submitting}
          fullWidth
          size="large"
          type="submit"
          variant="contained"
          color="secondary"
          onClick={() => {}}
          endIcon={<KeyboardArrowRightIcon />}
        >
          {others.activeStep === steps.length - 1 ? 'Finish' : steps[others.activeStep + 1]}
        </Button>
      </Box>
    </>
  );
};
