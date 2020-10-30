import React from 'react';
import { ThemeProvider } from 'emotion-theming';
import { AvatarUploader } from './components/AvatarUploader';
import { AppContainer } from './components/AppContainer';
import { theme } from './utils/theme';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <AppContainer bg="surface">
          <AvatarUploader data-testid="avatar-uploader" />
      </AppContainer>
    </ThemeProvider>
  );
}

export default App;
