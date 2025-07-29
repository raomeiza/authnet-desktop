// material-ui
import Typography from '@mui/material/Typography';

// project imports
import AuthWrapper1 from '../pages/AuthWrapper1';
import { Backdrop, Box, Button, CircularProgress, TextField } from '@mui/material';
import { Delete, DeleteForever, DoNotTouch, SendToMobile } from '@mui/icons-material';
import { useState } from 'react';

// ==============================|| SAMPLE PAGE ||============================== //

const CommandsPage = () => {
  const [action, setAction] = useState<'delete-fid' | 'clear-fingerprint-scanner' | 'clear-database' | null>(null);

  const ActionBackdrop = () => {
    const [password, setPassword] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [fingerprintId, setFingerprintId] = useState<number | null>(null);
    return (
      <Backdrop
        open={action !== null}
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          color: '#fff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: 450,
            minHeight: 250,
            padding: 2,
            backgroundColor: 'background.paper',
            borderRadius: 1
          }}
        >
          <Typography id="title" variant="h4" gutterBottom textAlign={'center'} sx={{ textDecoration: 'underline' }}>
            {action?.replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
          </Typography>
          <Typography variant="body1" gutterBottom id="description" color={error ? 'error.main' : 'text.primary'} sx={{ marginTop: 2 }}>
            {action === 'clear-database' ? (
              <>
                Are you sure you want to clear the database? This action is irreversible and will delete all data including students, staff,
                courses, and attendance records.
                <br />
                <br />
                <strong>Note:</strong> This action will not delete the fingerprint scanner data, but it will clear the database. If you want
                to clear the fingerprint scanner data, please use the "Clear Fingerprint Scanner" option.
              </>
            ) : action === 'delete-fid' ? (
              <>
                Are you sure you want to delete the fingerprint with ID <strong>{fingerprintId}</strong>? This action is irreversible and
                will delete the fingerprint from the database.
                <br />
                <br />
                <strong>Note:</strong> This action will not delete the student or staff record, but it will remove the fingerprint data.
              </>
            ) : (
              <>
                Are you sure you want to clear the fingerprint scanner? This action is irreversible and will delete all fingerprint data
                from the scanner.
                <br />
                <br />
                <strong>Note:</strong> This action will not delete the database, but it will clear the fingerprint data from the scanner
                making all enrolled fingerprints invalid. You will need to re-enroll them.
              </>
            )}
          </Typography>
          <TextField
            type={action === 'delete-fid' ? 'text' : 'password'}
            label={action === 'delete-fid' ? 'Enter Fingerprint ID' : 'Password'}
            variant="outlined"
            fullWidth
            value={action === 'delete-fid' ? fingerprintId : password}
            disabled={loading}
            error={!!error}
            onChange={(e) => {
              if (action === 'delete-fid') {
                // if its not a number, set error
                if (isNaN(Number(e.target.value))) {
                  setError('Fingerprint ID must be a number');
                  return;
                }
                setFingerprintId(Number(e.target.value));
              } else {
                setPassword(e.target.value);
              }
              setError(null);
              setSuccess(null);
            }}
            sx={{ marginTop: 2 }}
            helperText={error ? error : action === 'delete-fid' ? 'Enter the fingerprint ID to delete' : 'Enter your password to confirm'}
          />
          <Box
            id="actions"
            sx={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'flex-end',
              justifyContent: 'flex-end',
              width: '100%',
              marginTop: 2
              // marginLeft: 10,
            }}
          >
            <Button
              variant="outlined"
              color="primary"
              onClick={() => {
                setAction(null);
                setPassword('');
                setError(null);
                setSuccess(null);
              }}
              // fullWidth
              sx={{ marginRight: 1 }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="error"
              // fullWidth
              sx={{ marginLeft: 1 }}
              onClick={async () => {
                setLoading(true);
                try {
                  if (action === 'clear-database') {
                    // @ts-ignore
                    const res = await window.electronAPI.clearDatabase(password);
                    console.log(res);
                    setLoading(false);
                    if (res.error) {
                      setError(res.error);
                    } else {
                      setSuccess('Database cleared successfully');
                      setAction(null);
                    }
                  } else if (action === 'delete-fid') {
                    if (fingerprintId === null) {
                      setError('Fingerprint ID is required');
                      setLoading(false);
                      return;
                    }
                    // @ts-ignore
                    const res = await window.electronAPI.deleteFID(fingerprintId);
                    console.log(res);
                    setLoading(false);
                    if (res.error) {
                      setError(res.error);
                    } else {
                      setSuccess('Fingerprint deleted successfully');
                      setAction(null);
                    }
                  } else if (action === 'clear-fingerprint-scanner') {
                    // @ts-ignore
                    const res = await window.electronAPI.clearFingerprintScanner(password);
                    console.log(res);
                    setLoading(false);
                    if (res.error) {
                      setError(res.error);
                    } else {
                      setSuccess('Fingerprint scanner cleared successfully');
                      setAction(null);
                    }
                  }
                } catch (err: any) {
                  console.error(err);
                  setLoading(false);
                  setError(err.message || err);
                }
              }}
            >
              {loading ? <CircularProgress size={24} /> : action?.replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
            </Button>
          </Box>
        </Box>
      </Backdrop>
    );
  };

  return (
    <AuthWrapper1>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          maxHeight: '950vh',
          // backgroundColor: 'background.paper',
          width: '100%',
          margin: 0,
          padding: 2,
          gap: 2,
          overflowY: 'auto'
        }}
      >
        <Typography variant="h3" gutterBottom sx={{ textDecoration: 'underline' }}>
          Run Commands
        </Typography>
                <Box
          sx={{
            border: '1px solid',
            borderColor: 'warning.main',
            borderRadius: 1,
            padding: 2
          }}
        >
          <Typography variant="h4" gutterBottom textAlign="center">
            Delete a Fingerprint
          </Typography>
          <br />
          <Typography variant="body1" gutterBottom>
            To delete a fingerprint, click the button below. This will remove the selected fingerprint from the database.
            <br />
            <br />
            This is usefull if at the course of enrollment, a student or staff's fingerprint was stored while the enrollment itself was not
            completed. <br />
            <br />
            Please note that for a registered student or staff, It is advised you use the clear fingerprint option on thier profile page
            instead of this option. This removes the fingerprint both from the database and the machine ensuring that you can easily
            re-enroll their fingerprint without issues.
          </Typography>
          <Button
            variant="contained"
            color="warning"
            fullWidth
            sx={{ mb: 2 }}
            size="large"
            endIcon={<Delete />}
            onClick={() => {
              setAction('delete-fid');
              // @ts-ignore
              // window.electronAPI.deleteFingerprint().then((res) => {
              //   console.log(res);
              // });
            }}
          >
            Delete a Fingerprint
          </Button>
        </Box>
        <Box
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            padding: 2
          }}
        >
          <Typography variant="h4" gutterBottom textAlign="center">
            Export Database
          </Typography>
          <br />
          <Typography variant="body1" gutterBottom>
            To export the database, click the button below. This will generate a CSV file with the current data.
            <br />
            This is especially useful for backup or data analysis purposes, reinstallation, or migration to another system. <br />
            <br />
            This allows you to restore your data in case of any issues or if you need to set up the application on a new machine with
            password and if the fingerprint scanner was not clear, student and staff fingerprints will still work just as before.
          </Typography>
          <Button
            variant="contained"
            color="secondary"
            fullWidth
            sx={{ mb: 2 }}
            size="large"
            endIcon={<SendToMobile />}
            onClick={() => {
              // @ts-ignore
              window.electronAPI.exportDatabase().then((res) => {
                console.log(res);
              });
            }}
          >
            Export Entire Database
          </Button>
        </Box>
        <Box
          sx={{
            border: '1px solid',
            borderColor: 'error.main',
            borderRadius: 1,
            padding: 2
          }}
        >
          <Typography variant="h4" gutterBottom textAlign="center">
            Clear Database
          </Typography>
          <br />
          <Typography variant="body1" gutterBottom>
            To clear the database, click the button below. This will remove all data from the database.
            <br />
            This is especially useful for resetting the application or starting fresh. <br />
            <br />
            Note that except you have a backup of the database, this action is irreversible and will delete all data including students,
            staff, courses, and attendance records.
          </Typography>
          <Button
            variant="contained"
            color="error"
            fullWidth
            sx={{ mb: 2 }}
            size="large"
            endIcon={<DeleteForever />}
            onClick={() => {
              setAction('clear-database');
              // @ts-ignore
              // window.electronAPI.exportDatabase().then((res) => {
              //   console.log(res);
              // });
            }}
          >
            Clear Database
          </Button>
        </Box>
        <Box
          sx={{
            border: '1px solid',
            borderColor: 'error.main',
            borderRadius: 1,
            padding: 2
          }}
        >
          <Typography variant="h4" gutterBottom textAlign="center">
            Clear Fingerprint Scanner
          </Typography>
          <br />
          <Typography variant="body1" gutterBottom>
            To clear the fingerprint scanner data, click the button below. This will remove all fingerprint data from the scanner.
            <br />
            This is especially useful for resetting the application or starting fresh. <br />
            <br />
            Note that this action will delete all fingerprint data from the scanner and will not delete the database your app database. but
            all enrolled fingerprints will become invalid and you will need to re-enroll them.
            <br />
            <br />
            <strong>Finally, the scanner must be connected to the machine for this action to work.</strong>
          </Typography>
          <Button
            variant="contained"
            color="error"
            fullWidth
            sx={{ mb: 2 }}
            size="large"
            endIcon={<DoNotTouch />}
            onClick={() => {
              setAction('clear-fingerprint-scanner');
              // @ts-ignore
              // window.electronAPI.exportDatabase().then((res) => {
              //   console.log(res);
              // });
            }}
          >
            Clear Fingerprint Scanner
          </Button>
        </Box>
      </Box>
      <ActionBackdrop />
    </AuthWrapper1>
  );
};

export default CommandsPage;
