import { createTheme, ThemeProvider } from '@mui/material/styles';
import App from './App';

const theme = createTheme({
  palette: {
    primary: { main: '#1976d2' }, // Blau
    secondary: { main: '#ff9800' } // Orange
  },
  shape: { borderRadius: 12 },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <ThemeProvider theme={theme}>
    <App />
  </ThemeProvider>
);
