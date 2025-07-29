import * as React from 'react';
import { useTheme } from '@mui/material/styles';
import AppBar from '@mui/material/AppBar';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import ClassesAccordion from '../../ui-component/classes';
import StudentsAccordion from '../../ui-component/students';
import { Fade, Paper, Button, Slide } from '@mui/material';
import { Stack } from '@mui/system';
import TrapFocus from '@mui/material/Unstable_TrapFocus';
import StaffsAccordion from '../../ui-component/staffs';


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
    'aria-controls': `full-width-tabpanel-${index}`,
  };
}

export default function FullWidthTabs() {
  const theme = useTheme();
  const [value, setValue] = React.useState(0);
  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  // setInterval(() => {
  //   setBannerOpen(!bannerOpen);
  // }, 5000); // 5 seconds

  return (
    <Box sx={{ width: 'auto' }}>
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
              backgroundColor: "rgba(255, 255, 255, 0.9)",
              color: 'secondary.main',
            },
          }}
        >
          <Tab label="Classes" {...AProps(0)} />
          <Tab label="Students" {...AProps(1)} />
          <Tab label="Staffs" {...AProps(2)} />
        </Tabs>
      </AppBar>
      <TabPanel value={value} index={0} dir={theme.direction}>
        <ClassesAccordion />
      </TabPanel>
        <TabPanel value={value} index={1} dir={theme.direction}>
          <StudentsAccordion />
        </TabPanel>
        <TabPanel value={value} index={2} dir={theme.direction}>
          <StaffsAccordion />
        </TabPanel>
    </Box>
  );
}
