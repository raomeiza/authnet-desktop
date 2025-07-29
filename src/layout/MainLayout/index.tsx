import { Outlet, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useLayoutEffect, useState } from 'react';

// material-ui
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import useMediaQuery from '@mui/material/useMediaQuery';

// project imports
import { CssBaseline, styled, useTheme } from '@mui/material';
import Header from './Header';
import Sidebar from './Sidebar';
import Breadcrumbs from '../../ui-component/extended/Breadcrumbs';
import { SET_MENU } from '../../store/actions';
import { drawerWidth } from '../../store/constant';

// assets
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { port } from '../../config';

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' && prop !== 'theme' })(({ theme, open }: any) => ({
  ...theme.typography.mainContent,
  borderBottomLeftRadius: 0,
  borderBottomRightRadius: 0,
  transition: theme.transitions.create(
    'margin',
    open
      ? {
          easing: theme.transitions.easing.easeOut,
          duration: theme.transitions.duration.enteringScreen
        }
      : {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.leavingScreen
        }
  ),
  [theme.breakpoints.up('md')]: {
    marginLeft: open ? 0 : -(drawerWidth - 20),
    width: `calc(100% - ${drawerWidth}px)`
  },
  [theme.breakpoints.down('md')]: {
    marginLeft: '20px',
    width: `calc(100% - ${drawerWidth}px)`,
    padding: '16px'
  },
  [theme.breakpoints.down('sm')]: {
    marginLeft: '10px',
    width: `calc(100% - ${drawerWidth}px)`,
    padding: '16px',
    marginRight: '10px'
  }
}));

async function connectToSerialPort() {
  try {
    // Request a port and open a connection.
    //@ts-ignore
    const port = await navigator.serial.requestPort();
    await port.open({ baudRate: 57600 });

    // Set up a reader to read data from the port.
    const reader = port.readable.getReader();
    const decoder = new TextDecoderStream();
    const inputDone = port.readable.pipeTo(decoder.writable);
    const inputStream = decoder.readable;

    // Listen for data from the serial port.
    const readerStream = inputStream.getReader();
    while (true) {
      const { value, done } = await readerStream.read();
      if (done) {
        // Allow the serial port to be closed later.
        readerStream.releaseLock();
        break;
      }
    }

    // Write data to the serial port.
    const writer = port.writable.getWriter();
    await writer.write('enroll\n');
    writer.releaseLock();

    // Close the port when done.
    await port.close();
  } catch (error) {
    console.error('There was an error:', error);
  }
}

// ==============================|| MAIN LAYOUT ||============================== //

const MainLayout = () => {
  const [response, setResponse] = useState('');
  const [imageData, setImageData] = useState(null);
  const auth = useSelector((state: any) => state.auth);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams(); // Use useSearchParams hook
  const [createFirstStaff, setCreateFirstStaff] = useState(false);
  const [staffCount, setStaffCount] = useState<number | null>(null);
  // lets get the count query string
  useLayoutEffect(() => {
    const count = searchParams.get('count');
    setStaffCount(Number(count || 0));
    if(count && Number(count) === 0){
      // setCreateFirstStaff(true);
      // //@ts-ignore
      // window.electronAPI.createNewWindow(`http://localhost:${port}/enroll/staff?message=first`, 800, 950, 'Create Staff Account');
    }
  }, [searchParams]);

  // if createFirstStaff is true, open the create staff account window
  useEffect(() => {
    if (createFirstStaff) {
      // @ts-ignore
      window.electronAPI.createNewWindow(`http://localhost:${port}/enroll/staff?message=first`, 800, 950, 'Create Staff Account');
      setCreateFirstStaff(false);
    }
  }, [createFirstStaff]);
      
  useEffect(() => {
    // wait for the staffCount to be set
    if(staffCount === null) return;
    if (!auth.user) {
      navigate(`/login?staff-count=${staffCount}`, { replace: true });
    }
  }, [auth.user, navigate, staffCount]);

  useEffect(() => {
    //@ts-ignore
    if(window.electronAPI === undefined) {
      console.log('window.electronAPI is undefined')
      try {
        connectToSerialPort();
      } catch (error) {
        console.error('There was an error:', error);        
      }
    }else {
      //@ts-ignore
      window.electronAPI.onImageData((event, data) => {
        // console.log('event', event)
        // if(!data) return
        // if data is binary, it will be base64 encoded
        setImageData(imageData + data);
      });
      // Listen for data from the serial port
      //@ts-ignore
      window.electronAPI.onSerialData((data) => {
        // data = JSON.parse(data)
        setResponse(data.message);
        for (const key in data) {
          console.log(key, data[key]);
        }
      });

      // Listen for new staff data
      //@ts-ignore
      window.electronAPI.onNewStaff((data) => {
        console.log('New staff data received:', data);
        setStaffCount((prevCount) => prevCount === null ? 1 : prevCount + 1);
        // Handle the new staff data here
        // You can update state, navigate, or perform other actions
      });
    }
  }, []);
  
  const sendCommand = (command: any) => {
    //@ts-ignore
    window.electronAPI.sendSerialCommand(command);
  };
  const theme = useTheme();
  const matchDownMd = useMediaQuery(theme.breakpoints.down('md'));
  // Handle left drawer
  const leftDrawerOpened = useSelector((state: any) => state.customization.opened);
  const dispatch = useDispatch();
  const handleLeftDrawerToggle = () => {
    dispatch({ type: SET_MENU, opened: !leftDrawerOpened });
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      {/* header */}
      <AppBar
        enableColorOnDark
        position="fixed"
        color="inherit"
        elevation={0}
        sx={{
          bgcolor: theme.palette.background.default,
          transition: leftDrawerOpened ? theme.transitions.create('width') : 'none'
        }}
      >
        <Toolbar>
          <Header handleLeftDrawerToggle={handleLeftDrawerToggle} />
        </Toolbar>
      </AppBar>

      {/* drawer */}
      <Sidebar drawerOpen={!matchDownMd ? leftDrawerOpened : !leftDrawerOpened} drawerToggle={handleLeftDrawerToggle} />

      {/* main content */}
      {/* @ts-ignore */}
      <Main theme={theme} open={leftDrawerOpened}>
        {/* breadcrumb */}
      {/* @ts-ignore */}
        <Breadcrumbs separator={ChevronRightIcon} navigation={navigation} icon title rightAlign />
        <Outlet />
      </Main>
        {/* if staff count is zero, add a Mui Backdrop that covers the whole app till it becomes greater than zero (a staff have been enrolled) */}
      {/* <Customization /> */}
    </Box>
  );
};

export default MainLayout;
