// material-ui
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';

// ==============================|| FOOTER - AUTHENTICATION 2 & 3 ||============================== //

const AuthFooter = () => (
  <Stack direction="row" justifyContent="space-between" width={400} >
    <Typography variant="subtitle1" component={Link} href="https://github.com/raomeiza" target="_blank" underline="hover" sx={{color: "primary.main"}}>
      Designed and developed by Bithive Solutions
    </Typography>
    <Typography variant="subtitle1" component={Link} href="https://futminna.edu.ng" target="_blank" underline="hover">
      &copy; FUTMX
    </Typography>
  </Stack>
);

export default AuthFooter;
