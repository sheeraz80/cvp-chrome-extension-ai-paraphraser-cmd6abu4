export class NetworkInterceptor {
  private originalFetch: typeof window.fetch;
  private originalXHROpen: typeof XMLHttpRequest.prototype.open;
  private originalXHRSend: typeof XMLHttpRequest.prototype.send;
  private onRequestCallback: ((request: any) => void) | null = null;

  constructor() {
    this.originalFetch = window.fetch.bind(window);
    this.originalXHROpen = XMLHttpRequest.prototype.open;
    this.originalXHRSend = XMLHttpRequest.prototype.send;
  }

  start(onRequest: (request: any) => void): void {
    this.onRequestCallback = onRequest;
    this.interceptFetch();
    this.interceptXHR();
  }

  stop(): void {
    this.onRequestCallback = null;
    this.restoreFetch();
    this.restoreXHR();
  }

  private interceptFetch(): void {
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const startTime = performance.now();
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      const method = init?.method || 'GET';

      try {
        const response = await this.originalFetch(input, init);
        const endTime = performance.now();
        
        const clonedResponse = response.clone();
        const responseBody = await this.getResponseBody(clonedResponse);

        const request = {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          method,
          url,
          status: response.status,
          statusText: response.statusText,
          requestHeaders: this.getRequestHeaders(init?.headers),
          responseHeaders: this.getResponseHeaders(response.headers),
          requestBody: init?.body as string,
          responseBody,
          responseTime: Math.round(endTime - startTime),
          responseSize: responseBody ? new Blob([responseBody]).size : 0,
          requestSize: init?.body ? new Blob([init.body]).size : 0,
          mimeType: response.headers.get('content-type') || 'text/plain',
          initiator: { type: 'fetch' },
          timing: {
            requestStart: startTime,
            responseStart: endTime - 1,
            responseEnd: endTime,
            totalTime: endTime - startTime
          }
        };

        this.onRequestCallback?.(request);
        return response;
      } catch (error) {
        const endTime = performance.now();
        
        const request = {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          method,
          url,
          status: 0,
          statusText: 'Network Error',
          requestHeaders: this.getRequestHeaders(init?.headers),
          responseHeaders: {},
          requestBody: init?.body as string,
          responseTime: Math.round(endTime - startTime),
          responseSize: 0,
          requestSize: init?.body ? new Blob([init.body]).size : 0,
          mimeType: 'text/plain',
          initiator: { type: 'fetch' },
          timing: {
            requestStart: startTime,
            responseStart: 0,
            responseEnd: endTime,
            totalTime: endTime - startTime
          },
          error: { message: error.message, type: 'NetworkError' }
        };

        this.onRequestCallback?.(request);
        throw error;
      }
    };
  }

  private interceptXHR(): void {
    const self = this;
    
    XMLHttpRequest.prototype.open = function(method: string, url: string | URL, async?: boolean) {
      (this as any)._xhr_inspector = {
        method,
        url: typeof url === 'string' ? url : url.href,
        startTime: 0,
        requestHeaders: {}
      };
      return self.originalXHROpen.call(this, method, url, async);
    };

    XMLHttpRequest.prototype.send = function(body?: Document | XMLHttpRequestBodyInit | null) {
      const xhrData = (this as any)._xhr_inspector;
      if (!xhrData) {
        return self.originalXHRSend.call(this, body);
      }

      xhrData.startTime = performance.now();
      xhrData.requestBody = body;

      this.addEventListener('loadend', () => {
        const endTime = performance.now();
        
        const request = {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          method: xhrData.method,
          url: xhrData.url,
          status: this.status,
          statusText: this.statusText,
          requestHeaders: xhrData.requestHeaders,
          responseHeaders: self.parseResponseHeaders(this.getAllResponseHeaders()),
          requestBody: xhrData.requestBody,
          responseBody: this.responseText,
          responseTime: Math.round(endTime - xhrData.startTime),
          responseSize: this.responseText ? new Blob([this.responseText]).size : 0,
          requestSize: xhrData.requestBody ? new Blob([xhrData.requestBody]).size : 0,
          mimeType: this.getResponseHeader('content-type') || 'text/plain',
          initiator: { type: 'xhr' },
          timing: {
            requestStart: xhrData.startTime,
            responseStart: endTime - 1,
            responseEnd: endTime,
            totalTime: endTime - xhrData.startTime
          }
        };

        if (this.status === 0 && this.statusText === '') {
          request.error = { message: 'Network request failed', type: 'NetworkError' };
        }

        self.onRequestCallback?.(request);
      });

      return self.originalXHRSend.call(this, body);
    };
  }

  private async getResponseBody(response: Response): Promise<string> {
    try {
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        return JSON.stringify(await response.json());
      } else if (contentType.includes('text/')) {
        return await response.text();
      } else {
        return '[Binary Data]';
      }
    } catch {
      return '[Could not read response]';
    }
  }

  private getRequestHeaders(headers?: HeadersInit): Record<string, string> {
    const result: Record<string, string> = {};
    if (!headers) return result;
    
    if (headers instanceof Headers) {
      headers.forEach((value, key) => {
        result[key] = value;
      });
    } else if (Array.isArray(headers)) {
      headers.forEach(([key, value]) => {
        result[key] = value;
      });
    } else {
      Object.assign(result, headers);
    }
    return result;
  }

  private getResponseHeaders(headers: Headers): Record<string, string> {
    const result: Record<string, string> = {};
    headers.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  private parseResponseHeaders(headersString: string): Record<string, string> {
    const result: Record<string, string> = {};
    headersString.split('\r\n').forEach(line => {
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const key = line.substring(0, colonIndex).trim();
        const value = line.substring(colonIndex + 1).trim();
        result[key] = value;
      }
    });
    return result;
  }

  private restoreFetch(): void {
    window.fetch = this.originalFetch;
  }

  private restoreXHR(): void {
    XMLHttpRequest.prototype.open = this.originalXHROpen;
    XMLHttpRequest.prototype.send = this.originalXHRSend;
  }
}