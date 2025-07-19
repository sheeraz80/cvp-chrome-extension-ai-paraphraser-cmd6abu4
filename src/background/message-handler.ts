export class MessageHandler {
  async handle(message: any, sender: chrome.runtime.MessageSender): Promise<any> {
    switch (message.type) {
      case 'GET_SETTINGS':
        return await this.getSettings();
      case 'UPDATE_SETTINGS':
        return await this.updateSettings(message.data);
      case 'GET_REQUESTS':
        return await this.getRequests(message.tabId);
      default:
        return { error: 'Unknown message type' };
    }
  }

  private async getSettings(): Promise<any> {
    const { settings } = await chrome.storage.local.get('settings');
    return { settings };
  }

  private async updateSettings(newSettings: any): Promise<any> {
    await chrome.storage.local.set({ settings: newSettings });
    return { success: true };
  }

  private async getRequests(tabId?: number): Promise<any> {
    // Implementation would retrieve requests for specific tab
    return { requests: [] };
  }
}