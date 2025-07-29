import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

// material-ui
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';

// third party
import * as Yup from 'yup';
import { Formik, useFormik } from 'formik';

// project imports

// assets
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { API_BASE_URL } from '../../../../config';

// ============================|| FIREBASE - LOGIN ||============================ //

const AuthLogin = ({ ...others }) => {
  const theme = useTheme();
  const matchDownSM = useMediaQuery(theme.breakpoints.down('md'));
  const customization = useSelector((state: any) => state.customization);
  const login = useSelector((state: any) => state.auth);
  const [checked, setChecked] = useState(true);
  const [status, setStatus] = useState({ success: false });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const dispatch = useDispatch();
  const googleHandler = async () => {
    console.error('Login');
  };

  const [showPassword, setShowPassword] = useState(false);
  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const navigate = useNavigate();
  const handleMouseDownPassword = (event: any) => {
    event.preventDefault();
  };
  // create a regexp to validate email
  const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i;

  useEffect(() => {
    if (login.isAuthenticated) navigate('/');
  }, []);
  const handlemSubmit = async (event: any) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    // get the form data
    const form = event.target;
    const data = new FormData(form);
    const values = Object.fromEntries(data.entries());
    try {
      //@ts-ignore
      if (values.email.match(emailRegex) && values.password.length > 0) {
        // @ts-ignore
        const result = await window.electronAPI.staffLogin(values.email, values.password);
        // dispatch login action
        dispatch({ type: 'LOGIN', payload: result });
      } else {
        setError('Invalid email address or password');
      }
    } catch (err) {
      console.error(err);
      setSubmitting(false);
      setError('Failed to login');
    }
  };

  const loginSchema = Yup.object({
    email: Yup.string().email('Invalid email address').required('Email is required'),
    password: Yup.string().required('Password is required')
  });

  type LoginType = Yup.InferType<typeof loginSchema>;

  const initialValues: LoginType = {
    email: '',
    password: ''
  };

  const formik = useFormik({
    initialValues,
    validationSchema: loginSchema,
    onSubmit: async (values: LoginType) => {
      try {
        //@ts-ignore
        if (values.email.match(emailRegex) && values.password.length > 0) {
          // console.log('values:', values);
          // @ts-ignore
          const result = await window.electronAPI.staffLogin(values.email, values.password);
          // console.log('login result:', result);
          // dispatch login action
          dispatch({ type: 'LOGIN', payload: result });
          navigate('/');
        } else {
          setError('Invalid email address or password');
        }
      } catch (err) {
        console.error(err);
        setSubmitting(false);
        setError('Failed to login');
      }
    }
  });

  return (
    <>
      <form noValidate onSubmit={formik.handleSubmit} {...others}>
        {/* @ts-ignore */}
        <FormControl fullWidth error={Boolean(formik.touched.email && formik.errors.email)} sx={{ ...theme.typography.customInput }}>
          <InputLabel htmlFor="outlined-adornment-email-login">Email Address / Username</InputLabel>
          <OutlinedInput
            id="outlined-adornment-email-login"
            type="email"
            value={formik.values.email}
            name="email"
            onBlur={formik.handleBlur}
            onChange={formik.handleChange}
            label="Email Address"
            inputProps={{}}
          />
          {formik.touched.email && formik.errors.email && (
            <FormHelperText error id="standard-weight-helper-text-email-login">
              {formik.touched.email && formik.errors.email}
            </FormHelperText>
          )}
        </FormControl>

        {/* @ts-ignore */}
        <FormControl fullWidth error={Boolean(formik.touched.password && formik.errors.password)} sx={{ ...theme.typography.customInput }}>
          <InputLabel htmlFor="outlined-adornment-password-login">Password</InputLabel>
          <OutlinedInput
            id="outlined-adornment-password-login"
            type={showPassword ? 'text' : 'password'}
            value={formik.values.password}
            name="password"
            onBlur={formik.handleBlur}
            onChange={formik.handleChange}
            endAdornment={
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={handleClickShowPassword}
                  onMouseDown={handleMouseDownPassword}
                  edge="end"
                  size="large"
                >
                  {showPassword ? <Visibility /> : <VisibilityOff />}
                </IconButton>
              </InputAdornment>
            }
            label="Password"
            inputProps={{}}
          />
          {formik.touched.password && formik.errors.password && (
            <FormHelperText error id="standard-weight-helper-text-password-login">
              {formik.touched.password && formik.errors.password}
            </FormHelperText>
          )}
        </FormControl>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
          <FormControlLabel
            control={
              <Checkbox checked={checked} onChange={(event: any) => setChecked(event.target.checked)} name="checked" color="primary" />
            }
            label="Remember me"
          />
          <Typography variant="subtitle1" color="secondary" sx={{ textDecoration: 'none', cursor: 'pointer' }}>
            Forgot Password?
          </Typography>
        </Stack>
        <Typography variant="subtitle1" color="error" sx={{ mt: 2 }}>
          {error}
        </Typography>

        <Box sx={{ mt: 2 }}>
          <Button disableElevation disabled={submitting} fullWidth size="large" type="submit" variant="contained" color="secondary">
            Sign in
          </Button>
        </Box>
      </form>
    </>
  );
};

export default AuthLogin;
