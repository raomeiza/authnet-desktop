import { lazy } from 'react';

// project imports
import MainLayout from '../layout/MainLayout';
import Loadable from '../ui-component/Loadable';
import { Button } from '@mui/material';
import { CloudDownload } from '@mui/icons-material';

// dashboard routing
const DashboardDefault = Loadable(lazy(() => import('../views/dashboard')));

// utilities routing
const UtilsTypography = Loadable(lazy(() => import('../views/utilities/Typography')));
const UtilsColor = Loadable(lazy(() => import('../views/utilities/Color')));
const UtilsShadow = Loadable(lazy(() => import('../views/utilities/Shadow')));
// const UtilsMaterialIcons = Loadable(lazy(() => import('views/utilities/MaterialIcons')));
// const UtilsTablerIcons = Loadable(lazy(() => import('views/utilities/TablerIcons')));

// sample page routing
const SamplePage = Loadable(lazy(() => import('../views/student-enrollment-page')));
const CommandsPage = Loadable(lazy(() => import('../views/commands')));

// ==============================|| MAIN ROUTING ||============================== //

const MainRoutes = {
  path: '/',
  element: <MainLayout />,
  children: [
    {
      path: '/',
      element: <DashboardDefault />
    },
    {
      path: 'dashboard',
      children: [
        {
          path: 'default',
          element: <DashboardDefault />
        }
      ]
    },
    {
      path: 'utils',
      children: [
        {
          path: 'util-typography',
          element: <Button
          variant="contained"
          color="secondary"
          size="large"
          endIcon={<CloudDownload />}
          onClick={() => {
            // @ts-ignore
            window.electronAPI.exportCoursesToCSV().then((res) => {
              console.log(res);
            })
          }}
          sx={{justifySelf: 'center', alignSelf: 'center'}}
        >
          Export Courses
        </Button>
        }
      ]
    },
    {
      path: 'utils',
      children: [
        {
          path: 'util-color',
          element: <Button
          variant="contained"
          color="secondary"
          size="large"
          endIcon={<CloudDownload />}
          onClick={() => {
            // @ts-ignore
            window.electronAPI.exportStudentsToCSV().then((res) => {
              console.log(res);
            })
          }}
          sx={{justifySelf: 'center', alignSelf: 'center'}}
        >
          Export Students
        </Button>
        }
      ]
    },
    {
      path: 'utils',
      children: [
        {
          path: 'util-shadow',
          element: <Button
          variant="contained"
          color="secondary"
          size="large"
          endIcon={<CloudDownload />}
          onClick={() => {
            // @ts-ignore
            window.electronAPI.exportAttendanceToCSV().then((res) => {
              console.log(res);
              // navigate to the previos page
              window.history.back();
            })
          }}
          sx={{justifySelf: 'center', alignSelf: 'center'}}
        >
          Export Attendance
        </Button>
        }
      ]
    },
    // {
    //   path: 'icons',
    //   children: [
    //     {
    //       path: 'tabler-icons',
    //       element: <UtilsTablerIcons />
    //     }
    //   ]
    // },
    // {
    //   path: 'icons',
    //   children: [
    //     {
    //       path: 'material-icons',
    //       element: <UtilsMaterialIcons />
    //     }
    //   ]
    // },
    {
      path: 'sample-page',
      element: <SamplePage />
    },
    {
      path: 'commands',
      element: <CommandsPage />
    }
  ]
};

export default MainRoutes;
