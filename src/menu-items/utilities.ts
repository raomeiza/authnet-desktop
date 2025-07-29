// assets
import TypographyIcon from '@mui/icons-material/TextFields';
import PaletteIcon from '@mui/icons-material/Palette';
import TonalityIcon from '@mui/icons-material/Tonality';
import WindmillIcon from '@mui/icons-material/Attractions';
import { CloudDownload } from '@mui/icons-material';
// constant
const icons = {
  IconTypography: TypographyIcon,
  IconPalette: PaletteIcon,
  IconShadow: TonalityIcon,
  IconWindmill: WindmillIcon
};

// ==============================|| UTILITIES MENU ITEMS ||============================== //

const utilities = {
  id: 'Exports',
  title: 'Exports',
  type: 'group',
  // caption: 'Export data to CSV',
  children: [
    {
      id: 'util-typography',
      title: 'Export Courses',
      type: 'item',
      url: '/utils/util-typography',
      icon: CloudDownload,
      breadcrumbs: false
    },
    {
      id: 'util-color',
      title: 'Export Students',
      type: 'item',
      url: '/utils/util-color',
      icon: CloudDownload,
      breadcrumbs: false
    },
    {
      id: 'util-shadow',
      title: 'Export Attendance',
      type: 'item',
      url: '/utils/util-shadow',
      icon: CloudDownload,
      breadcrumbs: false
    }
  ]
};

export const commands = {
  id: "commands",
  title: "Commands",
  type: "group",
  caption: "Issue commands",
  children: [
    {
      id: 'util-typography',
      title: 'More',
      type: 'item',
      url: '/commands',
      icon: CloudDownload,
      breadcrumbs: false
    },
  ]
}
export default utilities;
