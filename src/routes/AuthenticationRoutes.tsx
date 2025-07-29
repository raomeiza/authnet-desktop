import { lazy } from 'react';

// project imports
import Loadable from '../ui-component/Loadable';
import MinimalLayout from '../layout/MinimalLayout';
import CousrePage from '../views/course-enrollment-page';

// login option 3 routing
const AuthLogin3 = Loadable(lazy(() => import('../views/pages/authentication3/Login3')));
// sample page routing
const SamplePage = Loadable(lazy(() => import('../views/student-enrollment-page')));

// ==============================|| AUTHENTICATION ROUTING ||============================== //

const AuthenticationRoutes = {
  path: '/',
  element: <MinimalLayout />,
  children: [
    {
      path: '/login',
      element: <AuthLogin3 />
    },
    {
      path: '/enroll/student',
      element: <SamplePage type='student' />
    },
    {
      path: '/enroll/staff',
      element: <SamplePage type='staff' />
    },
    {
      path: '/enroll/course',
      element: <CousrePage />
    }
  ]
};

export default AuthenticationRoutes;
