import React from 'react';
import { createRoot } from 'react-dom/client';

const Options: React.FC = () => {
  const [settings, setSettings] = React.useState({
    overlayPosition: { x: 20, y: 20 },
    overlaySize: { width: 400, height: 600 },
    autoHide: false,
    maxRequestHistory: 1000,
    theme: 'auto'
  });

  React.useEffect(() => {
    // Load settings from storage
    chrome.storage.local.get('settings').then((result) => {
      if (result.settings) {
        setSettings(result.settings);
      }
    });
  }, []);

  const saveSettings = async () => {
    await chrome.storage.local.set({ settings });
    alert('Settings saved!');
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px' }}>
      <h1>Chrome Extension - Options</h1>
      
      <h3>Extension Settings</h3>
      <div style={{ marginBottom: '20px' }}>
        <label>
          <input
            type="checkbox"
            checked={settings.autoHide}
            onChange={(e) => setSettings({ ...settings, autoHide: e.target.checked })}
          />
          Auto-hide overlay when not in use
        </label>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label>
          Max request history:
          <input
            type="number"
            value={settings.maxRequestHistory}
            onChange={(e) => setSettings({ ...settings, maxRequestHistory: parseInt(e.target.value) })}
            style={{ marginLeft: '10px', width: '100px' }}
          />
        </label>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label>
          Theme:
          <select
            value={settings.theme}
            onChange={(e) => setSettings({ ...settings, theme: e.target.value })}
            style={{ marginLeft: '10px' }}
          >
            <option value="auto">Auto</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </label>
      </div>

      <button onClick={saveSettings} style={{ 
        padding: '10px 20px', 
        backgroundColor: '#16a34a', 
        color: 'white', 
        border: 'none', 
        borderRadius: '6px',
        cursor: 'pointer'
      }}>
        Save Settings
      </button>
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<Options />);
}