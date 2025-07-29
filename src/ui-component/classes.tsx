import * as React from 'react';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import { Display } from '../utils/device';
import {
  AppBar,
  Backdrop,
  Button,
  Card,
  CardHeader,
  Checkbox,
  CircularProgress,
  ClickAwayListener,
  Divider,
  Fab,
  FormControl,
  Grid,
  InputLabel,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Slide,
  Tab,
  Tabs,
  Alert,
  AlertTitle,
  Collapse,
  IconButton
} from '@mui/material';
import { Box, Stack, useTheme } from '@mui/system';
import { port } from '../config';
import TrapFocus from '@mui/material/Unstable_TrapFocus';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
// import { TabPanelProps } from '@mui/base';
import theme from '../themes';
import CaptureFinger from '../views/captureFinger';
import { TransitionProps } from '@mui/material/transitions/transition';
import { Delete, Edit, Fingerprint } from '@mui/icons-material';

function not(a: readonly string[], b: readonly string[]) {
  return a.filter((value) => !b.includes(value));
}

function intersection(a: readonly string[], b: readonly string[]) {
  return a.filter((value) => b.includes(value));
}

function union(a: readonly string[], b: readonly string[]) {
  return [...a, ...not(b, a)];
}

export function SelectAllTransferList({
  enrolledStudents,
  updateStudents
}: {
  enrolledStudents: string[];
  updateStudents: (students: string[]) => void;
}) {
  const [checked, setChecked] = React.useState<readonly string[]>([]);
  const [students, setStudents] = React.useState<string[]>(enrolledStudents);
  const [availableStudents, setAvailableStudents] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string>('');
  const [success, setSuccess] = React.useState<string>('');

  React.useEffect(() => {
    if (!error) return;
    setTimeout(() => {
      setError('');
    }, 5000);
  });
  React.useEffect(() => {
    if (!success) return;
    setTimeout(() => {
      setSuccess('');
    }, 5000);
  });

  const reset = () => {
    setStudents(enrolledStudents);
  };

  const fetchLevelStudents = async (level: number) => {
    setLoading(true);
    // @ts-ignore
    const nstudents = await window.electronAPI.getStudentsFromLevel(level);
    const studentMatrics = nstudents.map((student: any) => student.matric);
    if (!nstudents || nstudents.length === 0) {
      setError(`No students found in ${level} level`);
      setLoading(false);
      return;
    }
    let available = studentMatrics.filter((student: string) => !students.includes(student));
    if (available.length === 0) {
      setError(`All students in level ${level} are already enrolled in this course`);
      setLoading(false);
      return;
    }
    // let enrolled = studentMatrics.filter((student: string) => students.includes(student));
    setAvailableStudents(available);
    // setStudents(enrolled);
    setLoading(false);
  };

  const leftChecked = intersection(checked, availableStudents);
  const rightChecked = intersection(checked, students);

  const handleToggle = (value: string) => () => {
    const currentIndex = checked.indexOf(value);
    const newChecked = [...checked];

    if (currentIndex === -1) {
      newChecked.push(value);
    } else {
      newChecked.splice(currentIndex, 1);
    }

    setChecked(newChecked);
  };

  const numberOfChecked = (items: readonly string[]) => intersection(checked, items).length;

  const handleToggleAll = (items: readonly string[]) => () => {
    if (numberOfChecked(items) === items.length) {
      setChecked(not(checked, items));
    } else {
      setChecked(union(checked, items));
    }
  };

  const handleCheckedRight = () => {
    setStudents(students.concat(leftChecked));
    setAvailableStudents(not(availableStudents, leftChecked));
    setChecked(not(checked, leftChecked));
  };

  const handleCheckedLeft = () => {
    setAvailableStudents(availableStudents.concat(rightChecked));
    setStudents(not(students, rightChecked));
    setChecked(not(checked, rightChecked));
  };

  const customList = (title: React.ReactNode, items: readonly string[]) => (
    <Card>
      <CardHeader
        sx={{ px: 2, py: 1 }}
        avatar={
          <Checkbox
            onClick={handleToggleAll(items)}
            checked={numberOfChecked(items) === items.length && items.length !== 0}
            indeterminate={numberOfChecked(items) !== items.length && numberOfChecked(items) !== 0}
            disabled={items.length === 0}
            inputProps={{
              'aria-label': 'all items selected'
            }}
          />
        }
        title={title}
        subheader={`${numberOfChecked(items)}/${items.length} selected`}
      />

      <Divider />
      <List
        sx={{
          width: 200,
          height: '300px',
          bgcolor: 'background.paper',
          overflow: 'auto'
        }}
        dense
        component="div"
        role="list"
      >
        {items.map((value: string) => {
          const labelId = `transfer-list-all-item-${value}-label`;

          return (
            <ListItemButton key={value} role="listitem" onClick={handleToggle(value)}>
              <ListItemIcon>
                <Checkbox
                  checked={checked.includes(value)}
                  tabIndex={-1}
                  disableRipple
                  inputProps={{
                    'aria-labelledby': labelId
                  }}
                />
              </ListItemIcon>
              <ListItemText id={labelId} primary={value} />
            </ListItemButton>
          );
        })}
      </List>
    </Card>
  );

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'flex-start',
        alignItems: 'center',
        flexDirection: 'column',
        gap: 2,
        p: 2,
        width: '100%',
        height: '100%',
        position: 'relative'
      }}
    >
      <FormControl margin="normal" sx={{ width: '50%' }}>
        <InputLabel id="level-label">Select level to fetch students</InputLabel>
        <Select
          labelId="level-label"
          id="level"
          name="level"
          value={'level'}
          onChange={(event: any) => fetchLevelStudents(event.target.value)}
          // onBlur=
          label="Select level to fetch students"
        >
          <MenuItem value={100}>100</MenuItem>
          <MenuItem value={200}>200</MenuItem>
          <MenuItem value={300}>300</MenuItem>
          <MenuItem value={400}>400</MenuItem>
          <MenuItem value={500}>500</MenuItem>
        </Select>
      </FormControl>
      <Grid container spacing={2} sx={{ justifyContent: 'center', alignItems: 'center' }}>
        <Grid item>{customList('Avalailable Students', availableStudents)}</Grid>
        <Grid item>
          <Grid container direction="column" sx={{ alignItems: 'center' }}>
            <Button
              sx={{ my: 0.5 }}
              variant="outlined"
              size="small"
              onClick={handleCheckedRight}
              disabled={leftChecked.length === 0}
              aria-label="move selected right"
            >
              &gt;
            </Button>
            <Button
              sx={{ my: 0.5 }}
              variant="outlined"
              size="small"
              onClick={handleCheckedLeft}
              disabled={rightChecked.length === 0}
              aria-label="move selected left"
            >
              &lt;
            </Button>
          </Grid>
        </Grid>
        <Grid item>{customList('Enrolled Students', students)}</Grid>
      </Grid>
      <Stack sx={{ width: 'auto', position: 'fixed', bottom: 0, left: 0, p: 2, zIndex: 1000, background: 'none' }} gap={2}>
        <Collapse in={!!success || !!error}>
          <Alert severity="success" sx={{ display: success ? 'flex' : 'none' }}>
            <AlertTitle>Update Student</AlertTitle>
            {success}
          </Alert>
        </Collapse>

        <Collapse in={!!success || !!error}>
          <Alert severity="error" sx={{ display: error ? 'flex' : 'none' }}>
            <AlertTitle>Update Student</AlertTitle>
            {error}
          </Alert>
        </Collapse>
      </Stack>
      <Fab
        variant="extended"
        color="secondary"
        onClick={() => {
          updateStudents(students);
          setSuccess('Students updated successfully');
        }}
      >
        Save
      </Fab>
    </Box>
  );
}

export const ClassStudentsAccordion = ({ matrics, courseCode, isAbsent, attendanceDate, markAttendance }: { matrics: string[]; courseCode?: string; isAbsent?: boolean; attendanceDate?: Date; markAttendance?: (matric: string) => void }) => {
  const [expanded, setExpanded] = React.useState(-1);
  const [loading, setLoading] = React.useState(false);
  const [manuallyMarkingAttendance, setManuallyMarkingAttendance] = React.useState(false);
  const [manipulativeMatrics, setManipulativeMatrics] = React.useState(matrics);
  const [confirmDialog, setConfirmDialog] = React.useState<{open: boolean, studentMatric: string, action: 'mark-attendance' | 'clear-fid' | 'delete' | null}>({open: false, studentMatric: '', action: null});
  const fetchedStudentsREF = React.useRef<{ [key: string]: any }>({});

  const fetchStudent = async (matric: string) => {
    if (fetchedStudentsREF.current[matric]) return fetchedStudentsREF.current[matric];
    setLoading(true);
    // @ts-ignore
    const student = await window.electronAPI.getStudentByMatric(matric);
    setLoading(false);
    fetchedStudentsREF.current[matric] = student;
    return student;
  };

  const handleMarkAsPresent = (studentMatric: string) => {
    console.log('Marking as present for:', studentMatric);
    setManuallyMarkingAttendance(true);
    //@ts-ignore
    window.electronAPI.markManualAttendance(
      studentMatric,
      courseCode,
      attendanceDate // Send just the date part
    ).then((response: any) => {
      setManuallyMarkingAttendance(false);
      // remove the student from the list of absent students
      markAttendance && markAttendance(studentMatric);
      setConfirmDialog({open: false, studentMatric: '', action: null});
    }).catch((error: any) => {
      setManuallyMarkingAttendance(false);
      console.error('Error marking manual attendance:', error);
    });
  };

  const clearFid = async(matric: string)=> {
    console.log("clearing student matric", matric)
    setManuallyMarkingAttendance(true);
    // @ts-ignore
    window.electronAPI.clearStudentFids(matric)
      .then((result: any) => {
        console.log("cleared student matric", matric);
        setManuallyMarkingAttendance(false);
        setConfirmDialog({open: false, studentMatric: '', action: null});
      })
      .catch((error: any) => {
        console.error("Error clearing student matric:", error);
        setManuallyMarkingAttendance(false);
      });
  }

  const deleteStudent = async(matric: string)=> {
    console.log("deleting student: ", matric)
    setManuallyMarkingAttendance(true);
    // @ts-ignore
    window.electronAPI.deleteStudentByMatric(matric)
      .then((result: any) => {
        console.log("deleted student: ", matric);
        // remove the student from the list
        setManipulativeMatrics(prevMatrics => prevMatrics.filter(m => m !== matric));
        setManuallyMarkingAttendance(false);
        setConfirmDialog({open: false, studentMatric: '', action: null});
      })
      .catch((error: any) => {
        console.error("Error deleting student:", error);
        setManuallyMarkingAttendance(false);
      });
  }

  const handleConfirmAction = () => {
    if (!confirmDialog.action || !confirmDialog.studentMatric) return;
    
    switch (confirmDialog.action) {
      case 'mark-attendance':
        handleMarkAsPresent(confirmDialog.studentMatric);
        break;
      case 'clear-fid':
        clearFid(confirmDialog.studentMatric);
        break;
      case 'delete':
        deleteStudent(confirmDialog.studentMatric);
        break;
      default:
        console.error('Unknown action:', confirmDialog.action);
    }
  };

  const getDialogContent = () => {
    const { action, studentMatric } = confirmDialog;
    
    switch (action) {
      case 'mark-attendance':
        return {
          title: 'Confirm Manual Attendance',
          content: `Are you sure you want to mark ${studentMatric} as present for this attendance session?`,
          confirmText: 'Mark as Present',
          confirmColor: 'error' as const
        };
      case 'clear-fid':
        return {
          title: 'Clear Fingerprints',
          content: `Are you sure you want to clear all fingerprint data for ${studentMatric}? This action cannot be undone and the student will need to re-enroll their fingerprints.`,
          confirmText: 'Clear Fingerprints',
          confirmColor: 'warning' as const
        };
      case 'delete':
        return {
          title: 'Delete Student',
          content: `Are you sure you want to permanently delete ${studentMatric}? This action cannot be undone and will remove all student data including attendance records.`,
          confirmText: 'Delete Student',
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
  return manipulativeMatrics.map((matric, index) => {
    let student = fetchedStudentsREF.current[matric];

    return (
      <Accordion
        key={index}
        expanded={expanded === index}
        onChange={async (event, isExpanded) => {
          event.stopPropagation();
          setExpanded(isExpanded ? index : -1);
          if (!student) student = await fetchStudent(matric);
        }}
        sx={{ m: 2, backgroundColor: 'whitesmoke', borderRadius: 2, width: '100%', alignSelf: 'center' }}
        elevation={expanded === index ? 4 : 0}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls={`panel${index}-content`}
          id={`panel${index}-header`}
          onClick={async (e) => {
            e.stopPropagation();
            if (!student) student = await fetchStudent(matric);
          }}
          sx={{ backgroundColor: expanded !== index ? 'whitesmoke' : 'secondary.light', borderRadius: 2 }}
        >
          <Typography>{matric}</Typography>
        </AccordionSummary>
        <AccordionDetails>
          {student ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {Object.keys(student).map((key, index) => {
                // if (key === '_id' || key === 'fid1' || key === 'fid2' || key === 'fid3') return null;
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
                        {key === 'createdAt' ? new Date(student[key]).toDateString() : !key.startsWith("fid") ? student[key] : student[key] || "No Fignerprint" }
                      </Typography>{' '}
                    </Box>
                    <Divider color="secondary" sx={{}} />
                  </>
                );
              })}
              {
                courseCode && isAbsent && attendanceDate ? (
                  <Button
                    variant="contained"
                    color="error"
                    disabled={manuallyMarkingAttendance}
                    onClick={() => {
                      setConfirmDialog({open: true, studentMatric: matric, action: 'mark-attendance'});
                    }}
                  >
                    {manuallyMarkingAttendance ? 'Marking...' : 'Mark as Present'}
                  </Button>
                ) : (
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
                      // Navigate to student update page
                      // @ts-ignore
                      window.electronAPI.createNewWindow(`http://localhost:${port}/enroll/student?studentMatric=${matric}`, 800, 1000);
                    }}
                  >
                    <Edit /> Edit Student
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    onClick={() => {
                      setConfirmDialog({open: true, studentMatric: matric, action: 'delete'});
                    }}
                  >
                    <Delete /> Remove Student
                  </Button>
                  
                  <Button
                    variant="contained"
                    color="warning"
                    onClick={() => {
                      setConfirmDialog({open: true, studentMatric: matric, action: 'clear-fid'});
                    }}
                  >
                    <Fingerprint /> Clear Fingerprints
                  </Button>
                  </Box>
                )
              }
                    {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({open: false, studentMatric: '', action: null})}
        aria-labelledby="confirm-dialog"
      >
        <DialogTitle id="confirm-dialog">
          {confirmDialog.open && getDialogContent().title}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {confirmDialog.open && getDialogContent().content}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setConfirmDialog({open: false, studentMatric: '', action: null})} 
            color="primary"
            variant="outlined"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmAction}
            color={confirmDialog.open ? getDialogContent().confirmColor : 'primary'}
            variant="contained"
            disabled={manuallyMarkingAttendance}
          >
            {manuallyMarkingAttendance ? 'Processing...' : (confirmDialog.open ? getDialogContent().confirmText : 'Confirm')}
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
  });

  return (
    <>
      {manipulativeMatrics.map((matric, index) => {
        let student = fetchedStudentsREF.current[matric];

        return (
          <Accordion
            key={index}
            expanded={expanded === index}
            onChange={async (event, isExpanded) => {
              event.stopPropagation();
              setExpanded(isExpanded ? index : -1);
              if (!student) student = await fetchStudent(matric);
            }}
            sx={{ m: 2, backgroundColor: 'whitesmoke', borderRadius: 2, width: '100%', alignSelf: 'center' }}
            elevation={expanded === index ? 4 : 0}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls={`panel${index}-content`}
              id={`panel${index}-header`}
              onClick={async (e) => {
                e.stopPropagation();
                if (!student) student = await fetchStudent(matric);
              }}
              sx={{ backgroundColor: expanded !== index ? 'whitesmoke' : 'secondary.light', borderRadius: 2 }}
            >
              <Typography>{matric}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {student ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {Object.keys(student).map((key, index) => {
                    if (key === '_id' || key === 'fid1' || key === 'fid2' || key === 'fid3') return null;
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
                            {key === 'createdAt' ? new Date(student[key]).toDateString() : student[key]}
                          </Typography>{' '}
                        </Box>
                        <Divider color="secondary" sx={{}} />
                      </>
                    );
                  })}
                  {
                    courseCode && isAbsent && attendanceDate && (
                      <Button
                        variant="contained"
                        color="error"
                        disabled={manuallyMarkingAttendance}
                        onClick={() => {
                          setConfirmDialog({open: true, studentMatric: matric, action: 'mark-attendance'});
                        }}
                      >
                        {manuallyMarkingAttendance ? 'Marking...' : 'Mark as Present'}
                      </Button>
                    )
                  }
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
      })}
    </>
  );
};

export function AttendanceBackdrop({
  open,
  setOpen,
  course,
  attendanceIndex
}: {
  open: boolean;
  setOpen: any;
  course: any;
  attendanceIndex: number;
}) {
  const [value, setValue] = React.useState(0);
  const [updateAbleCourse, setUpdateAbleCourse] = React.useState<any>(course);
  const [absentStudents, setAbsentStudents] = React.useState<string[]>([]);
  React.useEffect(() => {
    if (!updateAbleCourse || !updateAbleCourse.attendance || !updateAbleCourse.attendance[attendanceIndex]) return
    setAbsentStudents(
      updateAbleCourse.attendance[attendanceIndex].students.length
        ? updateAbleCourse.students?.filter((student: string) => !updateAbleCourse?.attendance[attendanceIndex].students.includes(student))
        : []
    );
  }, [updateAbleCourse, attendanceIndex]);

  const markAttendance = (matric: string) => {
    setUpdateAbleCourse((prev: any) => {
      const updatedAttendance = [...prev.attendance];
      const foundIndex = updatedAttendance.findIndex((a: any) => a.date === prev.attendance[attendanceIndex].date);
      if (foundIndex !== -1) {
        updatedAttendance[foundIndex] = {
          ...updatedAttendance[foundIndex],
          students: [...updatedAttendance[foundIndex].students, matric]
        };
      }
      return {
        ...prev,
        attendance: updatedAttendance
      };
    });
    setAbsentStudents((prev) => prev.filter((student) => student !== matric));
    
  }
  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    event.stopPropagation();
    setValue(newValue);
  };

  const theme = useTheme();

  interface TabPanelProps {
    children?: React.ReactNode;
    dir?: string;
    index: number;
    value: number;
  }

  function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
      <div
        role="tabpanel"
        hidden={value !== index}
        id={`full-width-tabpanel-${index}`}
        aria-labelledby={`full-width-tab-${index}`}
        {...other}
      >
        {value === index && (
          <Box sx={{ p: 3 }}>
            <Typography>{children}</Typography>
          </Box>
        )}
      </div>
    );
  }

  function AProps(index: number) {
    return {
      id: `full-width-tab-${index}`,
      'aria-controls': `full-width-tabpanel-${index}`
    };
  }

  return (
    <Backdrop
      sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
      open={open}
      onClick={(e) => {
        e.stopPropagation();
        setOpen(false);
      }}
    >
      <Paper
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <Typography px={5} pt={4} pb={1} variant="h4" gutterBottom>
          {' '}
          {course.courseTitle} Attendance held on {course.attendance[attendanceIndex].date}
          {' '}
          <IconButton
            color="error"
            onClick={() => {
              setOpen(false);
            }}
            
          >
            <Delete />
          </IconButton>
        </Typography>
        <Divider />
        <Box
          sx={{
            // display: 'flex',
            // flexDirection: 'column',
            // alignItems: 'center',
            // justifyContent: 'center',
            width: '100%',
            height: 500,
            overflow: 'auto'
          }}
        >
          {/* <CircularProgress color="inherit" />
    <Typography variant="h5" gutterBottom>
      Loading...
    </Typography> */}
          <AppBar position="static" sx={{ backgroundColor: 'secondary.main' }}>
            <Tabs
              value={value}
              onChange={handleChange}
              indicatorColor="secondary"
              textColor="inherit"
              variant="fullWidth"
              aria-label="full width tabs example"
              sx={{
                // add a white shadow to the background of the active tab. the background should have opacity of 0.5
                '.Mui-selected': {
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  color: 'secondary.main'
                }
              }}
            >
              <Tab label={course.attendance[attendanceIndex].students.length + ' Students Present'} {...AProps(0)} />
              <Tab label={absentStudents.length + ' Absent Students'} {...AProps(1)} />
              {/* <Tab label="Item Three" {...AProps(2)} /> */}
            </Tabs>
          </AppBar>
          <TabPanel value={value} index={0} dir={theme.direction}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, p: 2 }}>
              <ClassStudentsAccordion matrics={updateAbleCourse.attendance[attendanceIndex].students} />
            </Box>
          </TabPanel>
          <TabPanel value={value} index={1} dir={theme.direction}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, p: 2 }}>
              <ClassStudentsAccordion matrics={absentStudents} courseCode={updateAbleCourse.courseCode} isAbsent attendanceDate={updateAbleCourse.attendance[attendanceIndex].date} markAttendance={markAttendance} />
            </Box>
          </TabPanel>
        </Box>
      </Paper>
    </Backdrop>
  );
}

export default function ClassesAccordion() {
  const { isMobile, isTablet, isDesktop } = Display();
  const [expanded, setExpanded] = React.useState(-1);
  const [classes, setClasses] = React.useState<{ courseCode: string; courseTitle: string; attendance: any }[]>([]);
  const [bannerOpen, setBannerOpen] = React.useState(false);
  const [selectedClass, setSelectedClass] = React.useState<any>();
  const [showAttendanceDialog, setShowAttendanceDialog] = React.useState(false);
  const [attendanceIndex, setAttendanceIndex] = React.useState(0);
  const [action, setAction] = React.useState<'new-attendance' | 'view' | 'edit' | 'delete' | 'exam-attendance'>('view');
  const [result, setResult] = React.useState<any>();
  const [scannerAvailable, setScannerAvailable] = React.useState(false);
  const [showStudentsBackdrop, setShowStudentsBackdrop] = React.useState(false);
  const [takingAttendance, setTakingAttendance] = React.useState(false);
  const [updateCourseStudents, setUpdateCourseStudents] = React.useState(false);
  const [deleteCourse, setDeleteCourse] = React.useState(false);
  const [error, setError] = React.useState<string>('');
  const [success, setSuccess] = React.useState<string>('');

  React.useEffect(() => {
    if (!error) return;
    setTimeout(() => {
      setError('');
    }, 5000);
  });
  React.useEffect(() => {
    if (!success) return;
    setTimeout(() => {
      setSuccess('');
    }, 5000);
  });

  const Transition = React.forwardRef(function Transition(
    props: TransitionProps & {
      children: React.ReactElement<any, any>;
    },
    ref: React.Ref<unknown>
  ) {
    return <Slide direction="up" ref={ref} {...props} />;
  });

  function AlertDialogSlide() {
    const handleClickOpen = () => {
      setDeleteCourse(true);
    };

    const handleClose = () => {
      setDeleteCourse(false);
    };

    return (
      <React.Fragment>
        <Dialog open={deleteCourse} TransitionComponent={Transition} keepMounted onClose={handleClose} aria-describedby="delete-course">
          <DialogTitle>{`Delete ${selectedClass?.courseCode} course`}</DialogTitle>
          <DialogContent color="secondary">
            <DialogContentText id="delete-course-description">
              Are you sure you want to delete <strong>{selectedClass?.courseCode}</strong> titled{' '}
              <strong>{selectedClass.courseTitle.toUpperCase()}</strong>? This action cannot be undone.
              <br />
              All attendance records for this course will not be lost but the course will be removed from the list of courses.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose} color="success" variant="outlined">
              Cancel
            </Button>
            <Button onClick={deleteCourseFromDatabase} color="error">
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </React.Fragment>
    );
  }

  // scanner info effect
  React.useEffect(() => {
    // @ts-ignore
    window.electronAPI.onScannerAvailable((available) => {
      setScannerAvailable(available);
    });
    //@ts-ignore
    window.electronAPI
      .getScannerState()
      .then((response: { connected: boolean; inUse: boolean }) => {
        setScannerAvailable(response.connected);
      })
      .catch((error: any) => {
        console.log('get scanner state error', error);
      });
  }, []);

  const closeBanner = () => {
    setBannerOpen(false);
  };

  const deleteCourseFromDatabase = () => {
    // @ts-ignore
    window.electronAPI.deleteCourse(selectedClass.courseCode).then((response: any) => {
      if (response.error) return setError(response.error.message || response.error);
      setClasses((prevClasses) => prevClasses.filter((course) => course.courseCode !== selectedClass.courseCode));
      setDeleteCourse(false);
      setSuccess(`${selectedClass.courseCode} deleted successfully`);
      // setSelectedClass(null);
    });
  };

  const updateStudents = (students: string[]) => {
    if (!selectedClass) return;
    let stringedStudents = JSON.stringify(students);
    // @ts-ignore
    window.electronAPI.updateCourseStudents(selectedClass.courseCode, stringedStudents).then((response: any) => {
      if (response.error) return setError(response.error);
      setSelectedClass((prev: any) => {
        prev.students = students;
        return prev;
      });
      // setUpdateCourseStudents(false);
    });
  };
  // fetch classes effect
  React.useEffect(() => {
    // Fetch courses
    // @ts-ignore
    window.electronAPI
      .getCourses()
      .then((courses: any) => {
        // Fetch attendance for each course
        const attendancePromises = courses.map((course: { students: any; attendance: any; courseCode: string }) => {
          if (!course.courseCode) return Promise.resolve((course.attendance = []));
          // @ts-ignore
          return window.electronAPI
            .getCourseAttendance(course.courseCode)
            .then((attendance: any) => {
              // Group individual attendance records by date to create sessions
              const groupedAttendance: { [key: string]: any } = {};
              
              if (attendance && attendance.length > 0) {
                attendance.forEach((record: any) => {
                  const date = record.date;
                  if (!groupedAttendance[date]) {
                    groupedAttendance[date] = {
                      date: date,
                      students: [],
                      timestamp: record.timestamp,
                      courseCode: record.courseCode
                    };
                  }
                  // Add student to the session if not already present
                  if (!groupedAttendance[date].students.includes(record.studentMatric)) {
                    groupedAttendance[date].students.push(record.studentMatric);
                  }
                });
              }
              
              // Convert grouped object to array and sort by date (newest first)
              course.attendance = Object.values(groupedAttendance).sort((a: any, b: any) => 
                new Date(b.date).getTime() - new Date(a.date).getTime()
              );
              
              course.students = JSON.parse(course.students || '[]');
              return course;
            })
            .catch((error: any) => {
              course.attendance = [];
              return course;
            });
        });

        // Wait for all attendance data to be fetched
        Promise.all(attendancePromises)
          .then((updatedCourses) => {
            setClasses(updatedCourses);
          })
          .catch((error) => {
            console.log('error fetching courses with attendance', error);
          });
      })
      .catch((error: any) => {
        console.log('fetch courses error', error);
      });

    // Listen for new course and add it to the list
    // @ts-ignore
    window.electronAPI.onNewCourse((course: any) => {
      course.students = JSON.parse(course.students || '[]');
      setClasses((prevClasses) => [...prevClasses, course]);
    });
  }, []);

  React.useEffect(() => {
    if (!result) return;
    
    // Handle new atomic attendance record format
    const attendanceRecord = result;
    const date = attendanceRecord.date;
    const studentMatric = attendanceRecord.studentMatric;
    
    // Update the classes array with the new attendance record
    const updatedClasses = classes.map((course) => {
      if (course.courseCode === selectedClass.courseCode) {
        // Find existing session for this date or create new one
        const existingSessionIndex = course.attendance.findIndex((session: any) => session.date === date);
        
        if (existingSessionIndex !== -1) {
          // Session exists, add student if not already present
          if (!course.attendance[existingSessionIndex].students.includes(studentMatric)) {
            course.attendance[existingSessionIndex].students.push(studentMatric);
          }
        } else {
          // Create new session for this date
          const newSession = {
            date: date,
            students: [studentMatric],
            timestamp: attendanceRecord.timestamp,
            courseCode: attendanceRecord.courseCode
          };
          // Add new session and keep sorted by date (newest first)
          course.attendance = [newSession, ...course.attendance].sort((a: any, b: any) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
          );
        }
      }
      return course;
    });
    
    // Also update selectedClass to reflect changes immediately
    setSelectedClass((prev: any) => {
      if (!prev || prev.courseCode !== attendanceRecord.courseCode) return prev;
      
      const existingSessionIndex = prev.attendance.findIndex((session: any) => session.date === date);
      
      if (existingSessionIndex !== -1) {
        // Session exists, add student if not already present
        if (!prev.attendance[existingSessionIndex].students.includes(studentMatric)) {
          prev.attendance[existingSessionIndex].students.push(studentMatric);
        }
      } else {
        // Create new session for this date
        const newSession = {
          date: date,
          students: [studentMatric],
          timestamp: attendanceRecord.timestamp,
          courseCode: attendanceRecord.courseCode
        };
        prev.attendance = [newSession, ...prev.attendance].sort((a: any, b: any) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
      }
      
      return { ...prev };
    });
    
    setClasses(updatedClasses);
  }, [result]);
  return (
    <div>
      {classes.length ? (
        classes.map((item: any, index: number) => {
          item.attendance = item.attendance || [];
          return (
            <>
              <Accordion
                key={index}
                defaultExpanded={!isMobile}
                expanded={!isMobile || expanded === index}
                onChange={(event, isExpanded) => {
                  if (!isMobile) return;
                  setExpanded(isExpanded ? index : -1);
                }}
                sx={{
                  position: 'relative',
                }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls={`panel${index}-content`} id={`panel${index}-header`}>
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      width: '100%'
                    }}
                  >
                    <Typography variant="h4">{item.courseCode}</Typography>
                    <Button
                      variant="text"
                      color="secondary"
                      onClick={(e) => {
                        setSelectedClass(item);
                        setAction('view');
                        setBannerOpen(true);
                        e.stopPropagation();
                        // e.preventDefault();
                        // @ts-ignore
                        // window.electronAPI.createNewWindow(`http://localhost:${port}/attendance/${item.courseCode}`, 800, 1000, 'Attendance');
                      }}
                      disabled={item.attendance?.length === 0 || !item.attendance}
                    >
                      {item.attendance.length + ' sessions held'}
                    </Button>
                    <Button
                      variant="text"
                      color="secondary"
                      onClick={(e) => {
                        setSelectedClass(item);
                        setShowStudentsBackdrop(true);
                        e.stopPropagation();
                        // e.preventDefault();
                        // @ts-ignore
                        // window.electronAPI.createNewWindow(`http://localhost:${port}/attendance/${item.courseCode}`, 800, 1000, 'Attendance');
                      }}
                      disabled={item.students.length === 0}
                    >
                      {item.students.length + ' students'}
                    </Button>
                    {/* <Typography variant="h4">{item.students.length + ' students'} </Typography> */}
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography width="18%">{item.courseTitle}</Typography>
                  {/* {takingAttendance && selectedClass.courseCode === item.courseCode && (
                    <Button
                      variant="text"
                      color="error"
                      onClick={() => {
                        // @ts-ignore
                        window.electronAPI.stopMarkingAttendance();
                        setBannerOpen(false);
                        setTakingAttendance(false);
                        return;
                      }}
                    >
                      Stop Taking Attendance
                    </Button>
                  )} */}
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => {
                      setSelectedClass(item);
                      setDeleteCourse(true);
                    }}
                  >
                    Delete course
                  </Button>
                  <Button
                    variant="text"
                    color={takingAttendance && selectedClass.courseCode === item.courseCode ? 'error' : 'secondary'}
                    onClick={() => {
                      if(takingAttendance && selectedClass.courseCode === item.courseCode){
                        // @ts-ignore
                        window.electronAPI.stopMarkingAttendance();
                        setBannerOpen(false);
                        setTakingAttendance(false);
                      } else {
                        setTakingAttendance(true);
                        setSelectedClass(item);
                        setAction('new-attendance');
                        setBannerOpen(true);
                      }
                    }}
                  >
                    {takingAttendance && selectedClass.courseCode === item.courseCode ? 'Stop Taking Attendance' : 'Start Taking Attendance'}
                  </Button>
                </AccordionDetails>
                <Button
                  color="secondary"
                  size="medium"
                  variant="contained"
                  sx={{
                    margin: 2,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedClass(item);
                    setAction('edit');
                    // @ts-ignore
                    window.electronAPI.createNewWindow(`http://localhost:${port}/enroll/course/?course-code=${item.courseCode}`, 800, 1000, 'Edit Course');
                  }}
                  >
                    Update Course Data
                  </Button>
                <Button
                  color="secondary"
                  size="medium"
                  variant="contained"
                  sx={{
                    margin: 2,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedClass(item);
                    setTakingAttendance(true);
                        setSelectedClass(item);
                        setAction('exam-attendance');
                        setBannerOpen(true);
                  }}
                  >
                    Mark Exam Attendance
                  </Button>
              </Accordion>
            </>
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
          <Typography gutterBottom>No classes found. click the button below to add a class.</Typography>
          <Button
            variant="contained"
            color="secondary"
            onClick={() => {
              // @ts-ignore
              window.electronAPI.createNewWindow(`http://localhost:${port}/enroll/course`, 800, 1000, 'Create A Class');
            }}
            endIcon={<AddIcon />}
          >
            {' '}
            Add Class{' '}
          </Button>
        </Box>
      )}
      {selectedClass && (
        <>
          {bannerOpen && (
            <>
              <TrapFocus open disableAutoFocus disableEnforceFocus>
                <Slide appear={true} in={bannerOpen} direction="up">
                  <Paper
                    role="dialog"
                    aria-modal="false"
                    aria-label="Cookie banner"
                    square
                    variant="elevation"
                    elevation={4}
                    tabIndex={-1}
                    sx={{
                      position: 'fixed',
                      bottom: 0,
                      // left: 0,
                      right: 0,
                      m: 0,
                      p: 2,
                      borderWidth: 0,
                      borderTopWidth: 1,
                      zIndex: 1,
                      width: '450px'
                    }}
                  >
                    <ClickAwayListener onClickAway={closeBanner}>
                      <Stack direction={{ xs: 'column', sm: 'column' }} sx={{ justifyContent: 'space-between', gap: 2 }}>
                        {action === 'view' ? (
                          selectedClass.attendance.map((session: any, index: number) => {
                            // session.students = JSON.parse(session.students);
                            let percentage = (session.students.length / selectedClass.students.length) * 100;
                            return (
                              <>
                                {index === 0 && (
                                  <Box sx={{ flexShrink: 1, alignSelf: { xs: 'flex-start', sm: 'center' } }}>
                                    <Typography sx={{ fontWeight: 'bold' }}>{selectedClass.courseTitle} Attendance</Typography>
                                    <Typography variant="body2">
                                      Bellow are the attendance records for {selectedClass.courseCode}
                                    </Typography>
                                  </Box>
                                )}
                                <Box
                                  key={index}
                                  sx={{
                                    display: 'flex',
                                    flexDirection: 'row',
                                    gap: 1,
                                    backgroundColor: 'whitesmoke',
                                    p: 2,
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                  }}
                                >
                                  <Typography>{session.date}</Typography>
                                  <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                                    <CircularProgress
                                      variant="determinate"
                                      value={percentage}
                                      size={73}
                                      color={percentage > 70 ? 'success' : percentage > 50 ? 'warning' : 'error'}
                                    />
                                    <Box
                                      sx={{
                                        top: 0,
                                        left: 0,
                                        bottom: 0,
                                        right: 0,
                                        position: 'absolute',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                      }}
                                    >
                                      <Typography variant="caption" component="div" sx={{ color: 'text.secondary', textAlign: 'center' }}>
                                        {`${Math.round(percentage)}%`}
                                        <br />
                                        Marked
                                      </Typography>
                                    </Box>
                                  </Box>
                                  <Typography>{session.students.length + ' students present'}</Typography>
                                  <Button
                                    variant="text"
                                    color="secondary"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setAttendanceIndex(index);
                                      setShowAttendanceDialog(true);
                                    }}
                                  >
                                    View
                                  </Button>
                                </Box>
                              </>
                            );
                          })
                        ) : (action === 'new-attendance' || action === 'exam-attendance') ? (
                          <CaptureFinger
                            action={action === 'exam-attendance' ? 'exam-attendance' : 'attendance'}
                            courseCode={selectedClass.courseCode}
                            setResult={setResult}
                            setError={(error: any) => null}
                            scannerAvailable={scannerAvailable}
                          />
                        ) : null}
                      </Stack>
                    </ClickAwayListener>
                  </Paper>
                </Slide>
              </TrapFocus>
              {selectedClass.attendance.length > 0 && (
                <AttendanceBackdrop
                  open={showAttendanceDialog}
                  setOpen={() => setShowAttendanceDialog(false)}
                  course={selectedClass}
                  attendanceIndex={attendanceIndex}
                />
              )}
            </>
          )}
          <AlertDialogSlide />
          <Backdrop
            sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, overflow: 'hidden' }}
            open={showStudentsBackdrop}
            onClick={(e) => {
              e.stopPropagation();
              setShowStudentsBackdrop(false);
              setUpdateCourseStudents(false);
            }}
          >
            {!updateCourseStudents ? (
              <Slide in={showStudentsBackdrop && !updateCourseStudents} direction="right">
                <Paper
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  sx={{ width: '60%', height: '80%', overflow: 'auto', minWidth: '450px', maxWidth: '550px' }}
                >
                  <Box px={5} pt={4} pb={1} height={30} alignItems={'center'}>
                    <Typography variant="h4" gutterBottom textAlign={'center'}>
                      {selectedClass?.courseTitle} Students{' '}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, p: 2 }}>
                    <ClassStudentsAccordion matrics={selectedClass.students} />
                  </Box>
                </Paper>
              </Slide>
            ) : (
              <Slide in={showStudentsBackdrop && updateCourseStudents} direction="left">
                <Paper
                  sx={{
                    width: '70%',
                    height: '60%',
                    overflow: 'auto',
                    minWidth: '450px',
                    minHeight: '550px',
                    pt: 4,
                    justifyContent: 'center'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <SelectAllTransferList enrolledStudents={selectedClass.students} updateStudents={updateStudents} />
                </Paper>
              </Slide>
            )}
            <Fab
              sx={{ position: 'fixed', bottom: 16, right: 16 }}
              color="secondary"
              onClick={(e) => {
                e.stopPropagation();
                setUpdateCourseStudents(!updateCourseStudents);
              }}
              variant="extended"
            >
              {updateCourseStudents ? 'View Students' : 'Update Students'}
            </Fab>
          </Backdrop>
        </>
      )}
      { success || error && (
          <Stack sx={{ width: 'auto', position: 'fixed', bottom: 0, left: 0, p: 2, background: 'none' }} gap={2}>
        <Collapse in={!!success || !!error}>
          <Alert severity="success" sx={{ display: success ? 'flex' : 'none' }}>
            <AlertTitle>Update Student</AlertTitle>
            {success}
          </Alert>
        </Collapse>

        <Collapse in={!!success || !!error}>
          <Alert severity="error" sx={{ display: error ? 'flex' : 'none' }}>
            <AlertTitle>Update Student</AlertTitle>
            {error}
          </Alert>
        </Collapse>
      </Stack>
      )}
    </div>
  );
}
