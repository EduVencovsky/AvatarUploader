import React from 'react';
import { AvatarUploader } from './components/AvatarUploader';
import { AppContainer } from './components/AppContainer';
import { sleep } from './utils/mock';
import { ThemeProvider } from './components/ThemeProvider';

function App() {
  return (
    <ThemeProvider>
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
