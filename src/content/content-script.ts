import { OverlayManager } from './overlay-manager';
import { NetworkInterceptor } from './network-interceptor';

class ContentScript {
  private overlayManager: OverlayManager;
  private networkInterceptor: NetworkInterceptor;
  private isEnabled = false;

  constructor() {
    this.overlayManager = new OverlayManager();
    this.networkInterceptor = new NetworkInterceptor();
    this.setupMessageListener();
    this.initializeOnLoad();
  }

  private setupMessageListener(): void {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true;
    });
  }

  private async initializeOnLoad(): Promise<void> {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initialize());
    } else {
      await this.initialize();
    }
  }

  private async initialize(): Promise<void> {
    const { settings } = await chrome.storage.local.get('settings');
    
    this.networkInterceptor.start((request) => {
      this.overlayManager.addRequest(request);
    });

    if (settings?.autoShow) {
      this.enableOverlay();
    }
  }

  private async handleMessage(message: any, sender: any, sendResponse: any): Promise<void> {
    switch (message.type) {
      case 'TOGGLE_OVERLAY':
        this.toggleOverlay();
        sendResponse({ success: true });
        break;
      case 'NETWORK_REQUEST':
        if (message.data) {
          this.overlayManager.addRequest(message.data);
        }
        sendResponse({ success: true });
        break;
      case 'CLEAR_REQUESTS':
        this.overlayManager.clearRequests();
        sendResponse({ success: true });
        break;
      default:
        sendResponse({ error: 'Unknown message type' });
    }
  }

  private toggleOverlay(): void {
    if (this.isEnabled) {
      this.disableOverlay();
    } else {
      this.enableOverlay();
    }
  }

  private enableOverlay(): void {
    this.isEnabled = true;
    this.overlayManager.show();
  }

  private disableOverlay(): void {
    this.isEnabled = false;
    this.overlayManager.hide();
  }
}

new ContentScript();