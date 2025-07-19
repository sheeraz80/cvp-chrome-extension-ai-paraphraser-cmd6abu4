export class NetworkMonitor {
  private isMonitoring = false;

  start(): void {
    if (this.isMonitoring) return;
    this.isMonitoring = true;
    this.setupNetworkListeners();
  }

  stop(): void {
    this.isMonitoring = false;
  }

  async resetForTab(tabId: number): Promise<void> {
    const message = {
      type: 'CLEAR_REQUESTS',
      tabId,
      timestamp: Date.now()
    };
    await chrome.tabs.sendMessage(tabId, message);
  }

  private setupNetworkListeners(): void {
    this.setupNetworkRules();
  }

  private async setupNetworkRules(): Promise<void> {
    const rules = [{
      id: 1,
      priority: 1,
      condition: {
        urlFilter: "*",
        resourceTypes: ["xmlhttprequest", "fetch"] as chrome.declarativeNetRequest.ResourceType[]
      },
      action: { 
        type: "allow" as chrome.declarativeNetRequest.RuleActionType 
      }
    }];

    await chrome.declarativeNetRequest.updateDynamicRules({
      addRules: rules,
      removeRuleIds: []
    });
  }
}