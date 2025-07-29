// assets
import HelpIcon from '@mui/icons-material/Help';
import PublicIcon from '@mui/icons-material/Public';
import { port } from '../config';
// constant
const icons = { PublicIcon, HelpIcon };

// ==============================|| SAMPLE PAGE & DOCUMENTATION MENU ITEMS ||============================== //

const other = {
  id: 'sample-docs-roadmap',
  type: 'group',
  children: [
    // {
    //   id: 'enroll-student',
    //   title: 'Enroll student',
    //   type: 'item',
    //   url: '/sample-page',
    //   icon: icons.PublicIcon,
    //   external: true,
    //   target: true,
    //   breadcrumbs: false
    // },
    // {
    //   id: 'documentation',
    //   title: 'Documentation',
    //   type: 'item',
    //   url: 'http://localhost:'+ port + '/enroll/student',
    //   icon: icons.HelpIcon,
    //   external: true,
    //   target: true
    // }
  ]
};

export default other;
