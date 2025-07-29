import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import Switch from '@mui/material/Switch';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import { styled } from '@mui/material/styles';


// project imports
// import LogoSection from '../LogoSection';
import SearchSection from './SearchSection';
import NotificationSection from './NotificationSection';
import ProfileSection from './ProfileSection';

// assets
import MenuIcon from '@mui/icons-material/Menu';
import { API_BASE_URL } from '../../../config';

const IOSSwitch = styled((props) => (
  <Switch focusVisibleClassName=".Mui-focusVisible" disableRipple {...props} />
))(({ theme }) => ({
  width: 42*1.5,
  height: 26*1.5,
  padding: 0,
  '& .MuiSwitch-switchBase': {
    padding: 0,
    margin: 2,
    transitionDuration: '300ms',
    '&.Mui-checked': {
      transform: 'translateX(24px)',
      color: '#fff',
      '& + .MuiSwitch-track': {
        backgroundColor: '#65C466',
        opacity: 1,
        border: 0,
        ...theme.applyStyles('dark', {
          backgroundColor: '#2ECA45',
        }),
      },
      '&.Mui-disabled + .MuiSwitch-track': {
        opacity: 0.5,
      },
    },
    '&.Mui-focusVisible .MuiSwitch-thumb': {
      color: '#33cf4d',
      border: '6px solid #fff',
    },
    '&.Mui-disabled .MuiSwitch-thumb': {
      color: theme.palette.grey[100],
      ...theme.applyStyles('dark', {
        color: theme.palette.grey[600],
      }),
    },
    '&.Mui-disabled + .MuiSwitch-track': {
      opacity: 0.7,
      ...theme.applyStyles('dark', {
        opacity: 0.3,
      }),
    },
  },
  '& .MuiSwitch-thumb': {
    boxSizing: 'border-box',
    width: 22*1.5,
    height: 22*1.5,
  },
  '& .MuiSwitch-track': {
    borderRadius: (26 / 2)*1.5,
    backgroundColor: '#E9E9EA',
    opacity: 1,
    transition: theme.transitions.create(['background-color'], {
      duration: 500,
    }),
    ...theme.applyStyles('dark', {
      backgroundColor: '#39393D',
    }),
  },
}));

export  function CustomizedSwitches({meter, tenant_id}: any) {
  const [scannerAvailable, setScannerAvailable] = useState(false);

  useEffect(() => {
    //@ts-ignore
    window.electronAPI.onScannerAvailable((available: boolean) => {
      setScannerAvailable(available);
  });
  //@ts-ignore
  window.electronAPI.getScannerState()
    .then((response: { connected: boolean, inUse: boolean }) => {
      setScannerAvailable(response.connected);
    })
    .catch((error: any) => {
      console.log('get scanner state error', error);
    });
  }, []);
  return (
    <FormGroup>
      <FormControlLabel
        control={
          <IOSSwitch
            sx={{ m: 1 }}
            //@ts-ignore
            checked={scannerAvailable}
            // onChange={(e: any) => {
            //   let response = prompt(`Are you sure you want to turn ${e.target.checked ? 'on' : 'off'} the power?
            //     \nIf you are not sure, Please type in "yes" to continue otherwise press cancel.
            //     `)
            //   if (response === 'yes') {
            //     fetch(`${API_BASE_URL}/power`, {
            //       method: 'POST',
            //       headers: {
            //         'Content-Type': 'application/json'
            //       },
            //       body: JSON.stringify({ tenant_id, status: e.target.checked })
            //     })
            //       .then((response) => response.json())
            //       .then((data) => {
            //       });
            //   } else {
            //   }
            // }}
          />
        }
        label={ scannerAvailable ? "Scanner Available" : "Scanner Unavailable"}
      />
      
    </FormGroup>
  );
}
// ==============================|| MAIN NAVBAR / HEADER ||============================== //

const Header = ({ handleLeftDrawerToggle }: any) => {
  const theme: any = useTheme();
  const auth = useSelector((state: any) => state.auth);
  const meter = useSelector((state: any) => state.meter);
  const navigate = useNavigate();

  return (
    <>
      {/* logo & toggler button */}
      <Box
        sx={{
          width: 228,
          display: 'flex',
          [theme.breakpoints.down('md')]: {
            width: 'auto'
          }
        }}
      >
        {/* <Box component="span" sx={{ display: { xs: 'none', md: 'block' }, flexGrow: 1 }}>
          <LogoSection />
        </Box> */}
        <ButtonBase sx={{ borderRadius: '8px', overflow: 'hidden' }}>
          <Avatar
            variant="rounded"
            sx={{
              ...theme.typography.commonAvatar,
              ...theme.typography.mediumAvatar,
              transition: 'all .2s ease-in-out',
              background: theme.palette.secondary.light,
              color: theme.palette.secondary.dark,
              '&:hover': {
                background: theme.palette.secondary.dark,
                color: theme.palette.secondary.light
              }
            }}
            onClick={handleLeftDrawerToggle}
            color="inherit"
          >
            <MenuIcon fontSize="inherit" />
          </Avatar>
        </ButtonBase>
      </Box>

      {/* header search */}
      {/* <SearchSection /> */}
      <Typography variant="h2"
        sx ={{
          ml: 4,
          color: "primary"
        }}
      >
        {
          auth?.user?.fullName || 'Not logged in'
        }
      </Typography>
      <Box sx={{ flexGrow: 1 }} />
      <Box sx={{ flexGrow: 1 }} />

      {/* notification & profile */}
      <CustomizedSwitches meter={meter} tenant_id={auth?.user?.email} />
      <NotificationSection />
      {/* <ProfileSection /> */}
    </>
  );
};

Header.propTypes = {
  handleLeftDrawerToggle: PropTypes.func
};

export default Header;
