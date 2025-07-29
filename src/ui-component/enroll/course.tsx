import * as React from 'react';
import { styled } from '@mui/material/styles';
import Stack from '@mui/material/Stack';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Check from '@mui/icons-material/Check';
import StepConnector, { stepConnectorClasses } from '@mui/material/StepConnector';
import { StepIconProps } from '@mui/material/StepIcon';
import MainCard from '../cards/MainCard';
import { CourseForms } from './course-forms';

import BadgeIcon from '@mui/icons-material/Badge';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import Box from '@mui/material/Box';

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
    4: <DoneAllIcon />
  };

  return (
    <ColorlibStepIconRoot ownerState={{ completed, active }} className={className}>
      {icons[String(props.icon)]}
    </ColorlibStepIconRoot>
  );
}

export const steps = ['Basic', 'Other', 'Summary'];

export default function CourseEnrollment() {
  const [activeStep, setActiveStep] = React.useState(0);
  const [completed, setCompleted] = React.useState<{ [k: number]: boolean }>({ 0: false, 1: false, 2: false });
  const isStepCompleted = (step: number) => {
    return completed[step] === true;
  };

  const [courseCode, setCourseCode] = React.useState<string | null>(null);
  const [courseData, setCourseData] = React.useState<any | null>(null);
  // let get the url. if we are to update a course and the course code is in the url, we will fetch the course data and set it as the initial values
  React.useLayoutEffect(() => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get('course-code');
    if (code) {
      setCourseCode(code);
      // fetch the course data from the backend
      // @ts-ignore
      window.electronAPI.getCourse(code).then((response) => {
        setCourseData(response);
      }).catch((error: any) => {
        console.error('Error fetching course data:', error);
      });
    }
  }, []);

  return (
    <Box sx={{ width: '100%', height: '95vh', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center' }}>
      <MainCard title={courseCode ? "Update Course" : "Create A Class"} sx={{ width: { xs: '90%', md: '50%' }, margin: 'auto', height: '80vh', overflowY: 'scroll' }}>
        <CourseForms 
          activeStep={activeStep} 
          setActiveStep={setActiveStep} 
          completed={completed} 
          setCompleted={setCompleted} 
          courseData={courseData} 
          isUpdate={!!courseCode}
        />
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
    </Box>
  );
}
