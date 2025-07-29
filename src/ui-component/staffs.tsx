import * as React from 'react';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import { Display } from '../utils/device';
import { port } from '../config';
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Paper
} from '@mui/material';
import { Box } from '@mui/system';
import { ClassStudentsAccordion } from './classes';
import { Edit, Delete, Fingerprint } from '@mui/icons-material';

interface ISTAFF {
  createdAt: string;
  department: string;
  email: string;
  faculty: string;
  fid1: string;
  fid2: string;
  fullName: string;
  gender: string;
  id: number;
  password: string;
  phone: string;
  school: string;
  _id: null;
}

export const AccordionSection = ({
  staffs,
  setStaffs
}: {
  staffs: ISTAFF[];
  setStaffs: React.Dispatch<React.SetStateAction<ISTAFF[]>>;
}) => {
  console.log('staffs in accordion section', staffs);
  const [expanded, setExpanded] = React.useState(-1);
  const [loading, setLoading] = React.useState(false);
  const [confirmDialog, setConfirmDialog] = React.useState<{
    open: boolean;
    staffEmail: string | null;
    action: 'mark-attendance' | 'clear-fid' | 'delete' | null;
  }>({ open: false, staffEmail: null, action: null });
  const fetchedStudentsREF = React.useRef<{ [key: string]: any }>({});
  const [performingAction, setPerformingAction] = React.useState(false);
  // const fetchStudent = async (matric: string) => {
  //   if (fetchedStudentsREF.current[matric]) return fetchedStudentsREF.current[matric];
  //   setLoading(true);
  //   // @ts-ignore
  //   const student = await window.electronAPI.getStudentByMatric(matric);
  //   setLoading(false);
  //   fetchedStudentsREF.current[matric] = student;
  //   return student;
  // };

  const clearFid = async (staffEmail: string) => {
    console.log('clearing staff email', staffEmail);
    setPerformingAction(true);
    // @ts-ignore
    window.electronAPI
      .clearStaffFids(staffEmail)
      .then((result: any) => {
        console.log('cleared staff ID', staffEmail);
        setPerformingAction(false);
        setConfirmDialog({ open: false, staffEmail: null, action: null });
      })
      .catch((error: any) => {
        console.error('Error clearing staff ID:', error);
        setPerformingAction(false);
      });
  };

  const deleteStaff = async (email: string) => {
    console.log('deleting staff: ', email);
    setPerformingAction(true);
    // @ts-ignore
    window.electronAPI
      .deleteStaffById(email)
      .then((result: any) => {
        console.log('deleted staff: ', email);
        // remove the staff from the list
        setStaffs((prevStaffs) => prevStaffs.filter((s) => s.email !== email));
        setPerformingAction(false);
        setConfirmDialog({ open: false, staffEmail: null, action: null });
      })
      .catch((error: any) => {
        console.error('Error deleting staff:', error);
        setPerformingAction(false);
      });
  };

  const handleConfirmAction = () => {
    if (!confirmDialog.action || !confirmDialog.staffEmail) return;

    switch (confirmDialog.action) {
      case 'clear-fid':
        clearFid(confirmDialog.staffEmail);
        break;
      case 'delete':
        deleteStaff(confirmDialog.staffEmail);
        break;
      default:
        console.error('Unknown action:', confirmDialog.action);
    }
  };

  const getDialogContent = () => {
    const { action, staffEmail } = confirmDialog;
    if (!action || !staffEmail)
      return {
        title: 'Confirm Action',
        content: 'Are you sure you want to proceed?',
        confirmText: 'Confirm',
        confirmColor: 'primary' as const
      };
    switch (action) {
      case 'mark-attendance':
        return {
          title: 'Confirm Manual Attendance',
          content: `Are you sure you want to mark ${staffEmail} as present for this attendance session?`,
          confirmText: 'Mark as Present',
          confirmColor: 'error' as const
        };
      case 'clear-fid':
        return {
          title: 'Clear Fingerprints',
          content: `Are you sure you want to clear all fingerprint data for ${staffEmail}? This action cannot be undone and the staff will need to re-enroll their fingerprints.`,
          confirmText: 'Clear Fingerprints',
          confirmColor: 'warning' as const
        };
      case 'delete':
        return {
          title: 'Delete Staff',
          content: `Are you sure you want to permanently delete ${staffEmail}? This action cannot be undone and will remove all staff data including attendance records.`,
          confirmText: 'Delete Staff',
          confirmColor: 'error' as const
        };
      default:
        return {
          title: 'Confirm Action',
          content: 'Are you sure you want to proceed?',
          confirmText: 'Confirm',
          confirmColor: 'primary' as const
        };
    }
  };

  return staffs ? (
    staffs.map((staffMember, index) => {
      return (
        <Accordion
          key={index}
          expanded={expanded === index}
          onChange={async (event, isExpanded) => {
            event.stopPropagation();
            setExpanded(isExpanded ? index : -1);
          }}
          sx={{ m: 2, backgroundColor: 'whitesmoke', borderRadius: 2, width: '100%', alignSelf: 'center' }}
          elevation={expanded === index ? 4 : 0}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls={`panel${index}-content`}
            id={`panel${index}-header`}
            onClick={async (e) => {
              setExpanded(expanded === index ? -1 : index);
            }}
            sx={{ backgroundColor: expanded !== index ? 'whitesmoke' : 'secondary.light', borderRadius: 2 }}
          >
            <Typography
              variant="h5"
              sx={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                mr: 2
              }}
            >
              <span>{staffMember.fullName}</span>
              <span> ({staffMember.email})</span>
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            {staffMember ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {Object.keys(staffMember).map((key, index) => {
                  if (key === '_id') return null;
                  return (
                    <>
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'row',
                          gap: 1,
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          width: '100%',
                          p: 1
                        }}
                      >
                        <Typography variant="h4" key={index}>
                          {key + ': '}
                        </Typography>{' '}
                        <Typography variant="h5" key={index + 1}>
                          {key === 'createdAt'
                            ? new Date(staffMember[key as keyof typeof staffMember] as string).toDateString()
                            : key === 'password'
                              ? staffMember[key]
                                ? '••••••••'
                                : 'Password not set'
                              : staffMember[key as keyof typeof staffMember]}
                        </Typography>{' '}
                      </Box>
                      <Divider color="secondary" sx={{}} />
                    </>
                  );
                })}
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    gap: 1,
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    p: 1
                  }}
                >
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => {
                      // Navigate to staff update page
                      // @ts-ignore
                      window.electronAPI.createNewWindow(`http://localhost:${port}/enroll/staff?staffId=${staffMember.id}`, 800, 1000);
                    }}
                  >
                    <Edit /> Edit Staff
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    onClick={() => {
                      setConfirmDialog({ open: true, staffEmail: staffMember.email, action: 'delete' });
                    }}
                  >
                    <Delete /> Remove Staff
                  </Button>

                  <Button
                    variant="contained"
                    color="warning"
                    onClick={() => {
                      setConfirmDialog({ open: true, staffEmail: staffMember.email, action: 'clear-fid' });
                    }}
                  >
                    <Fingerprint /> Clear Fingerprints
                  </Button>
                </Box>
                <Dialog
                  open={confirmDialog.open}
                  onClose={() => setConfirmDialog({ open: false, staffEmail: null, action: null })}
                  aria-labelledby="confirm-dialog"
                >
                  <DialogTitle id="confirm-dialog">{confirmDialog.open && getDialogContent().title}</DialogTitle>
                  <DialogContent>
                    <DialogContentText>{confirmDialog.open && getDialogContent().content}</DialogContentText>
                  </DialogContent>
                  <DialogActions>
                    <Button
                      onClick={() => setConfirmDialog({ open: false, staffEmail: null, action: null })}
                      color="primary"
                      variant="outlined"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleConfirmAction}
                      color={confirmDialog.open ? getDialogContent().confirmColor : 'primary'}
                      variant="contained"
                      disabled={performingAction}
                    >
                      {performingAction ? 'Processing...' : confirmDialog.open ? getDialogContent().confirmText : 'Confirm'}
                    </Button>
                  </DialogActions>
                </Dialog>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <CircularProgress color="inherit" />
                <Typography variant="h5" gutterBottom>
                  Loading...
                </Typography>
              </Box>
            )}
          </AccordionDetails>
        </Accordion>
      );
    })
  ) : (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '50vh',
        color: 'text.secondary'
      }}
    >
      <Typography gutterBottom>No staffs found. Click on the button below to add a staff.</Typography>
      <Button
        variant="contained"
        color="secondary"
        size="large"
        onClick={() => {
          // @ts-ignore
          window.electronAPI.createNewWindow(`http://localhost:${port}/enroll/staff`, 800, 1000);
        }}
        endIcon={<AddIcon />}
      >
        Add Staff
      </Button>
    </Box>
  );
};

export default function StaffsAccordion() {
  const [staffs, setStaffs] = React.useState<any[]>([]);

  //once students are populated, populate staffs
  React.useEffect(() => {
    console.log('fetch staffs');
    // @ts-ignore
    window.electronAPI
      .getStaffs()
      .then((result: any) => {
        console.log('fetch staffs result', result);
        setStaffs(result);
      })
      .catch((error: any) => {
        console.log('fetch courses error', error);
      });

    // listen for new course and add it to the list
    // @ts-ignore
    window.electronAPI.onNewStaff((staff: any) => {
      setStaffs([...staffs, staff.matric]);
    });
  }, []);

  return (
    <div>
      {staffs.length ? (
        <Paper sx={{ width: '100%', padding: 2, height: '73vh', overflowY: 'scroll', overflowX: 'hidden', justifyContent: 'center' }}>
          <AccordionSection staffs={staffs as any} setStaffs={setStaffs} />
        </Paper>
      ) : (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '50vh',
            color: 'text.secondary'
          }}
        >
          <Typography gutterBottom>No students found. Click on the button below to add a staff.</Typography>
          <Button
            variant="contained"
            color="secondary"
            size="large"
            onClick={() => {
              // @ts-ignore
              window.electronAPI.createNewWindow(`http://localhost:${port}/enroll/staff`, 800, 1000);
            }}
            endIcon={<AddIcon />}
          >
            Add Student
          </Button>
        </Box>
      )}
    </div>
  );
}
