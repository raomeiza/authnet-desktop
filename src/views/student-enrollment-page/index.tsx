// material-ui
import Typography from '@mui/material/Typography';

// project imports
import StudentEnrollment from '../../ui-component/enroll/student';
import AuthWrapper1 from '../pages/AuthWrapper1';

// ==============================|| SAMPLE PAGE ||============================== //

const StudentEnrollmentPage = ({type}:{type: 'student' | 'staff'}) => (
  <AuthWrapper1>
    <StudentEnrollment type={type} />
  </AuthWrapper1>
);

export default StudentEnrollmentPage;
