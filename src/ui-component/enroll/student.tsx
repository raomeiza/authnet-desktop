import * as React from 'react';
import { styled } from '@mui/material/styles';
import Stack from '@mui/material/Stack';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Check from '@mui/icons-material/Check';
import SettingsIcon from '@mui/icons-material/Settings';
import VideoLabelIcon from '@mui/icons-material/VideoLabel';
import StepConnector, { stepConnectorClasses } from '@mui/material/StepConnector';
import { StepIconProps } from '@mui/material/StepIcon';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import MainCard from '../cards/MainCard';
import { StudentForms } from './student-forms';

import BadgeIcon from '@mui/icons-material/Badge';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import PersonPinIcon from '@mui/icons-material/PersonPin';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import Box from '@mui/material/Box';
import { height } from '@mui/system';
import { Backdrop, Button, Paper } from '@mui/material';
import { Typography } from '@mui/material';

const QontoConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 10,
    left: 'calc(-50% + 16px)',
    right: 'calc(50% + 16px)'
  },
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      borderColor: '#784af4'
    }
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      borderColor: '#784af4'
    }
  },
  [`& .${stepConnectorClasses.line}`]: {
    borderColor: '#eaeaf0',
    borderTopWidth: 3,
    borderRadius: 1,
    ...theme.applyStyles('dark', {
      borderColor: theme.palette.grey[800]
    })
  }
}));

const QontoStepIconRoot = styled('div')<{ ownerState: { active?: boolean } }>(({ theme }) => ({
  color: '#eaeaf0',
  display: 'flex',
  height: 22,
  alignItems: 'center',
  '& .QontoStepIcon-completedIcon': {
    color: '#784af4',
    zIndex: 1,
    fontSize: 18
  },
  '& .QontoStepIcon-circle': {
    width: 8,
    height: 8,
    borderRadius: '50%',
    backgroundColor: 'currentColor'
  },
  ...theme.applyStyles('dark', {
    color: theme.palette.grey[700]
  }),
  variants: [
    {
      props: ({ ownerState }) => ownerState.active,
      style: {
        color: '#784af4'
      }
    }
  ]
}));

function QontoStepIcon(props: StepIconProps) {
  const { active, completed, className } = props;

  return (
    <QontoStepIconRoot ownerState={{ active }} className={className}>
      {completed ? <Check className="QontoStepIcon-completedIcon" /> : <div className="QontoStepIcon-circle" />}
    </QontoStepIconRoot>
  );
}

const ColorlibConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 22
  },
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      backgroundImage: 'linear-gradient( 95deg,rgb(242,113,33) 0%,rgb(233,64,87) 50%,rgb(138,35,135) 100%)'
    }
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      backgroundImage: 'linear-gradient( 95deg,rgb(242,113,33) 0%,rgb(233,64,87) 50%,rgb(138,35,135) 100%)'
    }
  },
  [`& .${stepConnectorClasses.line}`]: {
    height: 3,
    border: 0,
    backgroundColor: '#eaeaf0',
    borderRadius: 1,
    ...theme.applyStyles('dark', {
      backgroundColor: theme.palette.grey[800]
    })
  }
}));

const ColorlibStepIconRoot = styled('div')<{
  ownerState: { completed?: boolean; active?: boolean };
}>(({ theme }) => ({
  backgroundColor: '#ccc',
  zIndex: 1,
  color: '#fff',
  width: 50,
  height: 50,
  display: 'flex',
  borderRadius: '50%',
  justifyContent: 'center',
  alignItems: 'center',
  ...theme.applyStyles('dark', {
    backgroundColor: theme.palette.grey[700]
  }),
  variants: [
    {
      props: ({ ownerState }) => ownerState.active,
      style: {
        backgroundImage: 'linear-gradient( 136deg, rgb(242,113,33) 0%, rgb(233,64,87) 50%, rgb(138,35,135) 100%)',
        boxShadow: '0 4px 10px 0 rgba(0,0,0,.25)'
      }
    },
    {
      props: ({ ownerState }) => ownerState.completed,
      style: {
        backgroundImage: 'linear-gradient( 136deg, rgb(242,113,33) 0%, rgb(233,64,87) 50%, rgb(138,35,135) 100%)'
      }
    }
  ]
}));

function ColorlibStepIcon(props: StepIconProps) {
  const { active, completed, className } = props;
  const icons: { [index: string]: React.ReactElement<unknown> } = {
    1: <BadgeIcon />,
    2: <AssignmentIndIcon />,
    3: <FingerprintIcon />,
    4: <DoneAllIcon />
  };

  return (
    <ColorlibStepIconRoot ownerState={{ completed, active }} className={className}>
      {icons[String(props.icon)]}
    </ColorlibStepIconRoot>
  );
}

export const steps = ['Basic', 'Other', 'Fingerprint', 'Summary'];

export default function StudentEnrollment({ type }: { type: 'student' | 'staff' }) {
  const [activeStep, setActiveStep] = React.useState(0);
  const [firstRun, setFirstRun] = React.useState(false);
  const [studentMatric, setStudentMatric] = React.useState<string | null>(null);
  const [updateStudentData, setUpdateStudentData] = React.useState<any>(null);
  const [completed, setCompleted] = React.useState<{ [k: number]: boolean }>({ 0: false, 1: false, 2: false, 3: updateStudentData?.fid1 ? true : false });
  const [staffId, setStaffId] = React.useState<string | null>(null);
  // if studentMatric, that means we are updating a student, so lets get the student data from the electron API
  React.useEffect(() => {
    if (studentMatric) {
      //@ts-ignore
      window.electronAPI.getStudentByMatric(studentMatric).then((data: any) => {
        setUpdateStudentData(data);
        if( data.fid1) {
          setCompleted((prevCompleted: any) => ({ ...prevCompleted, 2: true }));
        }
      })
      .catch((error: any) => {
        console.error('Error fetching student data:', error);
      });
    }
  }, [studentMatric]);

  // if staffId, that means we are updating a staff, so lets get the staff data from the electron API
  React.useEffect(() => {
    if (staffId) {
      //@ts-ignore
      window.electronAPI.getStaffById(staffId).then((data: any) => {
        setUpdateStudentData(data);
      })
      .catch((error: any) => {
        console.error('Error fetching staff data:', error);
      });
    }
  }, [staffId]);
  React.useLayoutEffect(() => {
    // get message from req query
    const urlParams = new URLSearchParams(window.location.search);
    const message = urlParams.get('message');
    const updateStudentMatric = urlParams.get('studentMatric');
    const staffId = urlParams.get('staffId');
    if (staffId && type === 'staff') {
      setStaffId(staffId);
    }
    if (updateStudentMatric) {
      setStudentMatric(updateStudentMatric);
    }
    if (message === 'first') {
      setFirstRun(true);
      // remove the message from the url
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      setFirstRun(false);
    }
  }, []);

  const isStepCompleted = (step: number) => {
    return completed[step] === true;
  };

  return (
    <Box
      sx={{
        width: '100%',
        height: '95vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}
    >
      <MainCard
        title={type === 'staff' ? 'Create A Staff Account' : 'Enroll A Student'}
        sx={{ width: { xs: '90%', md: '50%' }, margin: 'auto', height: '80vh', overflowY: 'scroll' }}
      >
        <StudentForms activeStep={activeStep} setActiveStep={setActiveStep} completed={completed} setCompleted={setCompleted} type={type} isUpdate={!!studentMatric || !!staffId} updateData={updateStudentData} />
      </MainCard>
      <Stack sx={{ width: '100%' }} spacing={4}>
        <Stepper alternativeLabel activeStep={activeStep} connector={<ColorlibConnector />}>
          {steps.map((label, index) => (
            <Step
              key={label}
              completed={isStepCompleted(index)}
              onClick={() => {
                // if stet is not completed, return
                if (!isStepCompleted(index)) return;
                // set this as the active step
                setActiveStep(index);
              }}
            >
              <StepLabel StepIconComponent={ColorlibStepIcon}>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Stack>
      <Backdrop
        open={firstRun}
        sx={{ zIndex: 9999 }}
        // onClick={() => setFirstRun(false)}
      >
        <Paper
          sx={{
            color: 'text.primary',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: 4,
            textAlign: 'center',
            boxShadow: 24,
            borderRadius: 2,
            backgroundColor: 'background.paper',
            maxWidth: { xs: '90vw', md: '50vw' },
            margin: 'auto',
            zIndex: 1000,
          }}
        >
          <Typography variant="h4" gutterBottom>
            Welcome to BioAS (Biometric Attendance System), Your comprehensive solution for managing student attendance.
          </Typography>
          <Typography variant="body1" gutterBottom>
            This is your first time of running the app and as such, you need to enroll a staff member first (create an account as a staff).
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              setFirstRun(false);
              setActiveStep(0);
            }}
          >
            Start Enrollment
          </Button>
        </Paper>
      </Backdrop>
    </Box>
  );
}
