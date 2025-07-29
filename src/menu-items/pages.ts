// assets
import IconKey from '@mui/icons-material/VpnKey';
import { port } from '../config';

// constant
const icons = {
  IconKey
};

// ==============================|| EXTRA PAGES MENU ITEMS ||============================== //

const pages = {
  id: 'pages',
  title: 'Enrollment',
  caption: 'Enrollment pages',
  type: 'group',
  children: [
    // {
    //   id: 'authentication',
    //   title: 'Enrollment',
    //   type: 'collapse',
    //   icon: icons.IconKey,

    //   children: [
        // {
        //   id: 'login3',
        //   title: 'Login',
        //   type: 'item',
        //   url: 'http://localhost:'+port +'/enroll/student',
        //   target: true
        // },
        {
          id: 'enroll-student',
          title: 'Enroll student',
          type: 'item',
          url: 'http://localhost:'+port +'/enroll/student',
          target: true
        },
        {
          id: 'enroll-staff',
          title: 'Enroll Staff',
          type: 'item',
          url: 'http://localhost:'+port +'/enroll/staff',
          target: true
        },
        {
          id: 'enroll-course',
          title: 'Enroll Course',
          type: 'item',
          url: 'http://localhost:'+port +'/enroll/course',
          target: true
        }
    //   ]
    // }
  ]
};

export default pages;
