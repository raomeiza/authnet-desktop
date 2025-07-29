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
import { Backdrop, Button, Typography } from '@mui/material';

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

export const studentSteps = ['School', 'Personal', 'Fingerprint', 'Submit'];

export default function StaffEnrollment() {
  const [activeStep, setActiveStep] = React.useState(0);
  const [completed, setCompleted] = React.useState<{ [k: number]: boolean }>({ 0: false, 1: false, 2: false, 3: false });
  const [firstRun, setFirstRun] = React.useState(false);
  const [staffId, setStaffId] = React.useState<string | null>(null);
  const [updateStaffData, setUpdateStaffData] = React.useState<any>(null);
  // if staffId, that means we are updating a staff, so lets get the staff data from the electron API
  React.useEffect(() => {
    if (staffId) {
      //@ts-ignore
      window.electronAPI.getStaffById(staffId).then((data: any) => {
        setUpdateStaffData(data);
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
    const updateStaffId = urlParams.get('staffId');
    if (updateStaffId) {
      setStaffId(updateStaffId);
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
    <Box sx={{ width: '100%', height: '95vh', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center' }}>
      <MainCard title="Student enrollment2" sx={{ width: { xs: '90%', md: '50%' }, margin: 'auto', height: '80vh', overflowY: 'scroll' }}>
        <StudentForms activeStep={activeStep} setActiveStep={setActiveStep} completed={completed} setCompleted={setCompleted} type='staff' updateData={updateStaffData} isUpdate={!!staffId} />
      </MainCard>
      <Stack sx={{ width: '100%' }} spacing={4}>
        <Stepper alternativeLabel activeStep={activeStep} connector={<ColorlibConnector />}>
          {studentSteps.map((label, index) => (
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
        // onClick={() => setFirstRun(false)}
      >
        <Box sx={{ color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Typography variant="h4" gutterBottom>
            Welcome to BAS (Biometric Attendance System), Your comprehensive solution for managing student attendance.
          </Typography>
          <Typography variant="body1" gutterBottom>
            This is your first time of running the app and as such, you need to enroll a staff member first.
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
        </Box>
      </Backdrop>
    </Box>
  );
}
