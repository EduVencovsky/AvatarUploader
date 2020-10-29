import React from 'react';
import { ThemeProvider } from 'emotion-theming';
import { AvatarUploader } from './components/AvatarUploader';
import { AppContainer } from './components/AppContainer';

const theme = {
  colors: {
    primary: '#4DD684',
    secondary: '#3F80FF',
    background: '#FFFFFF'
  },
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <AppContainer bg="background">
          <AvatarUploader data-testid="avatar-uploader" />
      </AppContainer>
    </ThemeProvider>
  );
}

export default App;
