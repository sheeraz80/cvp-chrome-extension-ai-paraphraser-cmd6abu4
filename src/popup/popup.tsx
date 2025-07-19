import React from 'react';
import { createRoot } from 'react-dom/client';

const Popup: React.FC = () => {
  const [isEnabled, setIsEnabled] = React.useState(false);

  const toggleOverlay = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab.id) {
      await chrome.tabs.sendMessage(tab.id, {
        type: 'TOGGLE_OVERLAY',
        timestamp: Date.now()
      });
      setIsEnabled(!isEnabled);
    }
  };

  return (
    <div style={{ width: '300px', padding: '20px' }}>
      <h2>XHR Inspector</h2>
      <p>Monitor AJAX/XHR requests in real-time</p>
      <button 
        onClick={toggleOverlay}
        style={{
          width: '100%',
          padding: '10px',
          backgroundColor: isEnabled ? '#dc2626' : '#16a34a',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer'
        }}
      >
        {isEnabled ? 'Disable' : 'Enable'} Overlay
      </button>
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<Popup />);
}