import '@fontsource/inter/300.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import './styles.css';

import React from 'react';
import { createRoot } from 'react-dom/client';
import { ConfigProvider } from 'antd';
import App from './App';

const theme = {
  token: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    fontSize: 14,
    colorPrimary: '#1677ff',
    borderRadius: 8,
    colorBgLayout: '#f5f6fa',
  },
};

createRoot(document.getElementById('root')).render(
  <ConfigProvider theme={theme}>
    <App />
  </ConfigProvider>
);
