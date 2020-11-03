import React from 'react';
import { ThemeProvider } from 'emotion-theming';
import { AvatarUploader } from './components/AvatarUploader';
import { AppContainer } from './components/AppContainer';
import { theme } from './utils/theme';
import { sleep } from './utils/mock';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <AppContainer bg="surface">
        <AvatarUploader
          chunkSize={1024 * 20}
          uploadChunk={async (chunk) => { await sleep(Math.random() * 2000); return { data: chunk, error: null }; }}
          data-testid="avatar-uploader"
        />
      </AppContainer>
    </ThemeProvider>
  );
}

export default App;
