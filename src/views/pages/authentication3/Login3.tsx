import { Link, useNavigate, useSearchParams } from 'react-router-dom';

// material-ui
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';

// project imports
import AuthWrapper1 from '../AuthWrapper1';
import AuthCardWrapper from '../AuthCardWrapper';
import AuthLogin from '../authentication/auth-forms/AuthLogin';
import Logo from '../../../ui-component/Logo';
import AuthFooter from '../../../ui-component/cards/AuthFooter';
import CaptureFinger from '../../captureFinger';
import { useEffect, useLayoutEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box } from '@mui/system';
import { Backdrop, Button, Fab, Paper } from '@mui/material';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import PasswordIcon from '@mui/icons-material/Password';
import { port } from '../../../config';
// ================================|| AUTH3 - LOGIN ||================================ //

const Login = () => {
  const downMD = useMediaQuery((theme: any) => theme.breakpoints.down('md'));
  const [scannerAvailable, setScannerAvailable] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [useFingerPrint, setUseFingerPrint] = useState(false);
  const [searchParams] = useSearchParams(); // Use useSearchParams hook
  const [createFirstStaff, setCreateFirstStaff] = useState(false);
  const [staffCount, setStaffCount] = useState<number | null>(null);
  // lets get the count query string
  useLayoutEffect(() => {
    const count = searchParams.get('staff-count');
    setStaffCount(Number(count || 0));
    if (count && Number(count) === 0) {
      // setCreateFirstStaff(true);
      // //@ts-ignore
      // window.electronAPI.createNewWindow(`http://localhost:${port}/enroll/staff?message=first`, 800, 950, 'Create Staff Account');
    }
  }, [searchParams]);

  // if createFirstStaff is true, open the create staff account window
  useEffect(() => {
    if (createFirstStaff) {
      // @ts-ignore
      window.electronAPI.createNewWindow(`http://localhost:${port}/enroll/staff?message=first`, 800, 950, 'First Staff Account');
      setCreateFirstStaff(false);
    }
  }, [createFirstStaff]);

  const login = useSelector((state: any) => state.auth);
  const dispatch = useDispatch();

  const navigate = useNavigate();
  useEffect(() => {
    if (login.isAuthenticated) navigate('/');
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
    // if staffCount is 0, listen for new staff events
    // if (staffCount === 0) {
      // @ts-ignore
      window.electronAPI.onNewStaff((data) => {
        setStaffCount((prevCount) => prevCount === null ? 1 : prevCount + 1);
        // Handle the new staff data here
        // You can update state, navigate, or perform other actions
      });
    // }
  }, []);

  useEffect(() => {
    if (result === '') return;
    dispatch({ type: 'LOGIN', payload: result });
    // navigate to home
    navigate('/');
  }, [result]);

  return (
    <AuthWrapper1>
      {!useFingerPrint ? (
        <Grid container direction="column" justifyContent="flex-end" sx={{ minHeight: '100vh' }}>
          <Grid item xs={12}>
            <Grid container justifyContent="center" alignItems="center" sx={{ minHeight: 'calc(100vh - 68px)' }}>
              <Grid item sx={{ m: { xs: 1, sm: 3 }, mb: 0 }}>
                <AuthCardWrapper>
                  <Grid container spacing={2} alignItems="center" justifyContent="center">
                    <Grid item sx={{ mb: 3 }}>
                      <Link to="#" aria-label="logo">
                        <Logo />
                      </Link>
                    </Grid>
                    <Grid item xs={12}>
                      <Grid container direction={{ xs: 'column-reverse', md: 'row' }} alignItems="center" justifyContent="center">
                        <Grid item>
                          <Stack alignItems="center" justifyContent="center" spacing={1}>
                            <Typography color="secondary.main" gutterBottom variant={downMD ? 'h3' : 'h2'}>
                              Hi, Welcome Back
                            </Typography>
                            <Typography variant="caption" fontSize="16px" textAlign={{ xs: 'center', md: 'inherit' }}>
                              Enter your credentials to continue
                            </Typography>
                          </Stack>
                        </Grid>
                      </Grid>
                    </Grid>
                    <Grid item xs={12}>
                      <AuthLogin />
                    </Grid>
                    <Grid item xs={12}>
                      <Divider />
                    </Grid>
                    {/* <Grid item xs={12}>
                      <Grid item container direction="column" alignItems="center" xs={12}>
                        <Typography component={Link} to="/register" variant="subtitle1" sx={{ textDecoration: 'none' }}>
                          Don&apos;t have an account?
                        </Typography>
                      </Grid>
                    </Grid> */}
                  </Grid>
                </AuthCardWrapper>
              </Grid>
            </Grid>
          </Grid>
          <Grid item xs={12} sx={{ m: 3, mt: 1 }}>
            <AuthFooter />
          </Grid>
        </Grid>
      ) : (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '70vh',
            alignSelf: 'center',
            width: { xs: '90%', md: '50%' },
            justifySelf: 'center',
            margin: 'auto'
          }}
          component={Paper}
        >
          <CaptureFinger action="login" scannerAvailable={scannerAvailable} setResult={setResult} setError={setError} />
        </Box>
      )}
      <Fab
        color="secondary"
        variant="extended"
        sx={{ position: 'fixed', bottom: 16, right: 16, alignItems: 'center', justifyContent: 'center', gap: 1 }}
        onClick={() => setUseFingerPrint(!useFingerPrint)}
      >
        {useFingerPrint ? (
          <>
            {' '}
            <PasswordIcon /> Use Password
          </>
        ) : (
          <>
            {' '}
            <FingerprintIcon /> Use Fingerprint
          </>
        )}
      </Fab>
      {staffCount === 0 && (
        <Backdrop
          open={staffCount === 0}
          sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, color: '#fff' }}
          // onClick={() => setCreateFirstStaff(false)}
        >
          <Box
            sx={{
              color: 'text.primary',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              maxWidth: { xs: '90vw', md: '50vw' },
              width: '100%',
              backgroundColor: 'background.paper',
              padding: 4,
              textAlign: 'center',
              boxShadow: 24,
              borderRadius: 2
            }}
          >
            <Typography variant="h4" gutterBottom>
              Welcome to BioAS
            </Typography>
            <Typography variant="body1" textAlign="left" gutterBottom>
              This is your first time of running the app and as such, you need to enroll a staff member first (create an account as a staff)
              before you can use the app. <br /><br />
              Or if you have a database backup, you can restore it to continue by clicking the restore button.
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, mt: 2, width: '100%' }}>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => {
                  //@ts-ignore
                  window.electronAPI.importDatabase()
                    .then((response: { result: boolean; error?: string }) => {
                      if (response.result) {
                        setCreateFirstStaff(true);
                      } else {
                        setError(response.error || 'An error occurred while importing the database');
                      }
                    })
                    .catch((error: any) => {
                      setError(error.message || 'An error occurred while importing the database');
                    });
                }}
              >
                Restore Database
              </Button>
              <Button
                variant="contained"
                fullWidth
                onClick={() => {
                  setCreateFirstStaff(true);
                  //@ts-ignore
                  // window.electronAPI.createNewWindow(`http://localhost:${port}/enroll/staff?message=first`, 800, 950, 'Create Staff Account');
                }}
              >
                Enroll Staff Member
              </Button>
            </Box>
          </Box>
        </Backdrop>
      )}
    </AuthWrapper1>
  );
};

export default Login;
