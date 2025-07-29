import { Typography, Button, Divider } from '@mui/material';
import { borderRadius, Container } from '@mui/system';
import { useEffect, useState } from 'react';
//@ts-ignore
import scanningGif from '../assets/images/scanning3.gif';
//@ts-ignore
import successGif from '../assets/images/scaned.gif';
//@ts-ignore
import errorGif from '../assets/images/scan-error.gif';
//@ts-ignore
import fingerprintSVG from '../assets/images/fingerprint.svg';

export default function CaptureFinger({
  action,
  userId,
  setResult,
  setError,
  scannerAvailable,
  courseCode,
  preventDuplicate = true
}: {
  action: 'enroll' | 'verify' | 'delete' | 'search' | 'login' | 'attendance' | 'exam-attendance';
  userId?: string;
  setResult: any;
  setError: (error: string) => void;
  scannerAvailable: boolean;
  courseCode?: string;
  preventDuplicate?: boolean; // only used for enroll action when a student or staff is actually being updated
}) {
  const [response, setResponse] = useState('Press the button above to start scanning');
  const [command, setCommand] = useState('');
  const [sensorActive, setSensorActive] = useState(false);
  const [sensorAvailable, setSensorAvailable] = useState(false);
  const [showScanning, setShowScanning] = useState(true);
  const [scanStatus, setScanStatus] = useState('none');

  useEffect(() => {
    // Listen for data from the serial port
    // @ts-ignore
    window.electronAPI.onSerialData((data) => {
      // data = JSON.parse(data)
      // if(data.command === command) {
      if (data.event && (data.event === 'result' || data.event === 'error')) {
        if (data.event === 'result') {
          setResult(true);
          setScanStatus('success');
          setShowScanning(true);
        } else {
          alert(JSON.stringify(data));
          setScanStatus('error');
          setError(data.error?.message || data.error);
        }
        setSensorActive(false);
      } else if (data.event && data.event === 'message') {
        setSensorActive(true);
        setShowScanning(true);
        setScanStatus('scanning');
      }
      setResponse(data.message);
      // }
    });
  }, []);

  // for every change in scanner state, reset the response message
  useEffect(() => {
    setResponse('Press the button above to start scanning');
    setSensorAvailable(scannerAvailable);
    setScanStatus('none');
  }, [scannerAvailable]);

  const sendCommand = (command: string, identifier?: string) => {
    setCommand(command);
    setSensorActive(true);
    // if command starts with 'enroll' or 'verify' show scanning image
    if (command.startsWith('enroll') || command.startsWith('match') || command.startsWith('search')) {
      setShowScanning(true);
      setScanStatus('scanning');
    }
    // @ts-ignore
    window.electronAPI.sendSerialCommand(command, identifier, preventDuplicate);
  };

  const login = async () => {
    try {
      // @ts-ignore
      const response = await window.electronAPI.staffFingerPrintLogin();
      setResponse(`welcome back! ${response.fullName}`);
      
        setScanStatus('success');
        setResult(response);

    } catch (error: any) {
      setError('Error logging in');
      setResponse(error.message || error);
      setScanStatus('error');
    }
  }

  const markAttendace = async () => {
      // @ts-ignore
      window.electronAPI.markAttendance(courseCode).then((response)=>{
      setResponse(response.message);
      setScanStatus('success');
      setResult(response.data);
      })
      .catch ((error: any)=> {
      console.log('error', error)
      setError('Error marking attendance');
      setResponse(error.error?.message || error.message || error);
      setScanStatus('error');
    })
  }

  const markExamAttendance = async () => {
    // @ts-ignore
    window.electronAPI.markExamAttendance(courseCode).then((response)=>{
      console.log('response', response);
      setResponse(response.message);
      setScanStatus('success');
      setResult(response.data);
    })
    .catch ((error: any)=> {
      console.log('error', error)
      setError('Error marking exam attendance');
      setResponse(error.error?.message || error.message || error);
      setScanStatus('error');
    })
  }

  if(scannerAvailable) return (
    <Container
      sx={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}
      // disable clicking on the content bubling to the parent container
      onClick={(e) => e.stopPropagation()}
    >
      {/* create an image container and place the scanningImage on it */}
      {showScanning &&
        (scanStatus === 'scanning' ? (
          <img src={scanningGif} alt="scanning" width={200} height={200} style={{ borderRadius: '50%' }} />
        ) : scanStatus === 'success' ? (
          <img src={successGif} alt="success" width={200} height={200} style={{ borderRadius: '50%', backgroundColor: "whitesmoke" }} />
        ) : scanStatus === 'error' ? (
          <img src={errorGif} alt="error" width={200} height={200} style={{ borderRadius: '50%' }} />
        ) : (
          <div style={{ width: 200, height: 200, borderRadius: '50%', padding: "5%", backgroundColor: "whitesmoke" }}>
            <img src={fingerprintSVG} alt="Fingerprint" style={{ width: '100%', height: '100%' }} />
          </div>
        ))}{' '}
      {action === 'enroll' && (
        <Button
          variant="contained"
          disabled={scanStatus === 'success' || scanStatus === 'scanning'}
          color="secondary"
          onClick={() => sendCommand('enroll', userId)}
        >
          Scan Fingerprint
        </Button>
      )}
      {action === 'verify' && (
        <Button variant="contained" color="secondary" onClick={() => sendCommand('match 2')}>
          Verify Fingerprint
        </Button>
      )}{' '}
      {action === 'delete' && (
        <Button variant="contained" color="error" onClick={() => sendCommand('delete 9')}>
          Delete Fingerprint
        </Button>
      )}{' '}
      {action === 'search' && (
        <Button variant="contained" color="info" onClick={() => sendCommand('search')}>
          Find Fingerprint
        </Button>
      )}{' '}
      {action === 'login' && (
        <Button variant="contained" onClick={login} disabled={scanStatus === 'scanning'} color="secondary">
          Scan Finger to Login
        </Button>
      )}
      {action === 'attendance' && (
        <Button variant="contained" onClick={markAttendace} disabled={scanStatus === 'scanning'} color="secondary">
          Scan Finger for Attendance
        </Button>
      )}
      {action === 'exam-attendance' && (
        <Button variant="contained" onClick={markExamAttendance} disabled={scanStatus === 'scanning'} color="secondary">
          Scan Finger for Exam Attendance
        </Button>
      )}
      <Typography variant="h4" gutterBottom color={scanStatus === 'error' ? 'error' : scanStatus === 'success' ? 'success' : 'text.secondary'}>
        {response}
      </Typography>
      <Divider />
    </Container>
  )
  else return (
    <Container
      sx={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, height: '50vh', color: 'text.secondary', width: { xs: '80%', sm: "70", md: '50%' } }}
    >
      <Typography variant="h4" gutterBottom>
        No Fingerprint Scanner Found. Please connect a fingerprint scanner to continue.
      </Typography>
    </Container>
  )
}
