// material-ui
import { styled } from '@mui/material/styles';

// project imports

// ==============================|| AUTHENTICATION 1 WRAPPER ||============================== //

const AuthWrapper1 = styled('div')(({ theme }) => ({
  backgroundColor: theme.palette.grey[100],
  minHeight: '100vh',
  // minWidth: '100vw',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
}));

export default AuthWrapper1;
