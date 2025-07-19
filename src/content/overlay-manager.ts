export class OverlayManager {
  private shadowHost: HTMLElement | null = null;
  private shadowRoot: ShadowRoot | null = null;
  private requests: any[] = [];
  private isVisible = false;

  show(): void {
    if (this.isVisible) return;
    
    this.createShadowHost();
    this.attachShadowDOM();
    this.injectStyles();
    this.renderUI();
    this.isVisible = true;
  }

  hide(): void {
    if (!this.isVisible || !this.shadowHost) return;
    
    this.shadowHost.remove();
    this.shadowHost = null;
    this.shadowRoot = null;
    this.isVisible = false;
  }

  addRequest(request: any): void {
    this.requests.unshift(request);
    if (this.requests.length > 1000) {
      this.requests = this.requests.slice(0, 1000);
    }
    if (this.isVisible) {
      this.updateRequestList();
    }
  }

  clearRequests(): void {
    this.requests = [];
    if (this.isVisible) {
      this.updateRequestList();
    }
  }

  getRequests(): any[] {
    return [...this.requests];
  }

  private createShadowHost(): void {
    this.shadowHost = document.createElement('div');
    this.shadowHost.id = 'xhr-inspector-overlay';
    this.shadowHost.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 2147483647;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui;
      pointer-events: auto;
    `;
    document.body.appendChild(this.shadowHost);
  }

  private attachShadowDOM(): void {
    if (!this.shadowHost) return;
    this.shadowRoot = this.shadowHost.attachShadow({ mode: 'closed' });
    const container = document.createElement('div');
    container.id = 'overlay-container';
    this.shadowRoot.appendChild(container);
  }

  private injectStyles(): void {
    if (!this.shadowRoot) return;
    const style = document.createElement('style');
    style.textContent = `
      :host { all: initial; display: block; }
      #overlay-container {
        width: 400px; height: 600px; background: white;
        border: 1px solid #e5e7eb; border-radius: 8px;
        box-shadow: 0 10px 25px -3px rgba(0, 0, 0, 0.1);
        overflow: hidden; display: flex; flex-direction: column;
        font-size: 14px; line-height: 1.5;
      }
      .overlay-header {
        padding: 12px 16px; background: #f9fafb;
        border-bottom: 1px solid #e5e7eb; display: flex;
        align-items: center; justify-content: space-between;
      }
      .overlay-title { font-weight: 600; color: #374151; margin: 0; font-size: 14px; }
      .overlay-content { flex: 1; overflow: auto; padding: 0; }
      .request-item {
        padding: 12px 16px; border-bottom: 1px solid #f3f4f6;
        cursor: pointer; transition: background-color 0.15s;
      }
      .request-item:hover { background: #f9fafb; }
      .request-method {
        display: inline-block; padding: 2px 6px; border-radius: 4px;
        font-size: 11px; font-weight: 600; margin-right: 8px;
        min-width: 45px; text-align: center;
      }
      .method-get { background: #dbeafe; color: #1e40af; }
      .method-post { background: #dcfce7; color: #166534; }
      .method-put { background: #fef3c7; color: #92400e; }
      .method-delete { background: #fee2e2; color: #dc2626; }
      .request-url { color: #374151; font-size: 13px; word-break: break-all; }
      .request-status { font-size: 12px; color: #6b7280; margin-top: 4px; }
      .status-2xx { color: #16a34a; }
      .status-3xx { color: #eab308; }
      .status-4xx { color: #dc2626; }
      .status-5xx { color: #dc2626; }
      .close-button {
        background: none; border: none; font-size: 18px;
        color: #6b7280; cursor: pointer; padding: 4px; line-height: 1;
      }
      .close-button:hover { color: #374151; }
      .empty-state { padding: 40px 20px; text-align: center; color: #6b7280; }
    `;
    this.shadowRoot.appendChild(style);
  }

  private renderUI(): void {
    if (!this.shadowRoot) return;
    const container = this.shadowRoot.getElementById('overlay-container');
    if (!container) return;

    container.innerHTML = `
      <div class="overlay-header">
        <h3 class="overlay-title">XHR Inspector</h3>
        <button class="close-button" onclick="this.getRootNode().host.style.display='none'">×</button>
      </div>
      <div class="overlay-content" id="request-list">
        <div class="empty-state">
          Monitoring network requests...<br>
          Make some AJAX calls to see them here.
        </div>
      </div>
    `;
    this.updateRequestList();
  }

  private updateRequestList(): void {
    if (!this.shadowRoot) return;
    const requestList = this.shadowRoot.getElementById('request-list');
    if (!requestList) return;

    if (this.requests.length === 0) {
      requestList.innerHTML = `
        <div class="empty-state">
          Monitoring network requests...<br>
          Make some AJAX calls to see them here.
        </div>
      `;
      return;
    }

    requestList.innerHTML = this.requests.map(request => `
      <div class="request-item" data-request-id="${request.id}">
        <div>
          <span class="request-method method-${request.method.toLowerCase()}">${request.method}</span>
          <span class="request-url">${this.truncateUrl(request.url)}</span>
        </div>
        <div class="request-status status-${Math.floor(request.status / 100)}xx">
          ${request.status} ${request.statusText} • ${request.responseTime}ms • ${this.formatSize(request.responseSize)}
        </div>
      </div>
    `).join('');
  }

  private truncateUrl(url: string): string {
    if (url.length <= 50) return url;
    return url.substring(0, 47) + '...';
  }

  private formatSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
}