import * as React from 'react';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import { Display } from '../utils/device';
import { port } from '../config';
import { Button, Paper } from '@mui/material';
import { Box } from '@mui/system';
import { ClassStudentsAccordion } from './classes';

export default function StudentsAccordion() {
  const [matrics, setMatrics] = React.useState<string[]>([]);

  //once students are populated, populate matrics
  React.useEffect(() => {
    // @ts-ignore
    window.electronAPI.getStudents()
      .then((result: any) => {
        // setStudents(result);
        let allMatrics: string[] = [];
        result.forEach((student: any) => {
          allMatrics.push(student.matric);
        });
        setMatrics(allMatrics);
      })
      .catch((error: any) => {
        console.log('fetch courses error', error);
      });
  
    // listen for new course and add it to the list
    // @ts-ignore
    window.electronAPI.onNewStudent((student: any) => {
      setMatrics([...matrics, student.matric]);
    });
  }, []);

  return (
    <div>
      {
        matrics.length ? <Paper sx={{ width: "100%", padding: 2, height: '73vh', overflowY:'scroll', overflowX: 'hidden', justifyContent:'center' }}><ClassStudentsAccordion matrics={matrics} /> </Paper> :
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '50vh',
            color: 'text.secondary',
          }}>
            <Typography gutterBottom>
              No students found. Click on the button below to add a student.
            </Typography>
            <Button variant="contained" color="secondary" size="large" onClick={() => {
              // @ts-ignore
              window.electronAPI.createNewWindow(`http://localhost:${port}/enroll/student`, 800, 1000);
            }}
            endIcon={<AddIcon />}
            >
              Add Student
            </Button>
          </Box>
      }
    </div>
  );
}
