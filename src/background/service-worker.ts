import { NetworkMonitor } from './network-monitor';
import { MessageHandler } from './message-handler';
import { MessageType } from '@types/extension';

class BackgroundService {
  private networkMonitor: NetworkMonitor;
  private messageHandler: MessageHandler;

  constructor() {
    this.networkMonitor = new NetworkMonitor();
    this.messageHandler = new MessageHandler();
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    chrome.runtime.onInstalled.addListener(this.handleInstalled.bind(this));
    chrome.tabs.onUpdated.addListener(this.handleTabUpdated.bind(this));
    chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
    chrome.action.onClicked.addListener(this.handleActionClick.bind(this));
  }

  private async handleInstalled(details: chrome.runtime.InstalledDetails): Promise<void> {
    if (details.reason === 'install') {
      await this.initializeExtension();
    }
  }

  private async initializeExtension(): Promise<void> {
    await chrome.storage.local.set({
      settings: {
        overlayPosition: { x: 20, y: 20 },
        overlaySize: { width: 400, height: 600 },
        autoHide: false,
        maxRequestHistory: 1000,
        theme: 'auto'
      }
    });
    this.networkMonitor.start();
  }

  private async handleTabUpdated(
    tabId: number, 
    changeInfo: chrome.tabs.TabChangeInfo, 
    tab: chrome.tabs.Tab
  ): Promise<void> {
    if (changeInfo.status === 'loading' && tab.url) {
      await this.networkMonitor.resetForTab(tabId);
    }
  }

  private async handleMessage(
    message: any,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
  ): Promise<void> {
    try {
      const response = await this.messageHandler.handle(message, sender);
      sendResponse(response);
    } catch (error) {
      console.error('Error handling message:', error);
      sendResponse({ error: error.message });
    }
  }

  private async handleActionClick(tab: chrome.tabs.Tab): Promise<void> {
    if (tab.id) {
      const message = {
        type: MessageType.TOGGLE_OVERLAY,
        timestamp: Date.now()
      };
      await chrome.tabs.sendMessage(tab.id, message);
    }
  }
}

new BackgroundService();