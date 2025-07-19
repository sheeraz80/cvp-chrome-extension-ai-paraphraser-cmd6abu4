import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NetworkInterceptor } from '../../src/content/network-interceptor';

describe('NetworkInterceptor', () => {
  let interceptor: NetworkInterceptor;
  let mockCallback: vi.MockedFunction<(request: any) => void>;

  beforeEach(() => {
    interceptor = new NetworkInterceptor();
    mockCallback = vi.fn();
  });

  afterEach(() => {
    interceptor.stop();
  });

  it('should intercept fetch requests', async () => {
    const mockResponse = {
      status: 200,
      statusText: 'OK',
      headers: new Headers({ 'content-type': 'application/json' }),
      clone: () => ({
        json: () => Promise.resolve({ success: true }),
        text: () => Promise.resolve('{"success": true}')
      })
    };

    global.fetch = vi.fn().mockResolvedValue(mockResponse);
    interceptor.start(mockCallback);

    await fetch('/api/test', {
      method: 'POST',
      body: JSON.stringify({ test: true })
    });

    expect(mockCallback).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        url: '/api/test',
        status: 200,
        statusText: 'OK'
      })
    );
  });

  it('should handle network errors', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network failure'));
    interceptor.start(mockCallback);

    try {
      await fetch('/api/fail');
    } catch {}

    expect(mockCallback).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/api/fail',
        status: 0,
        statusText: 'Network Error',
        error: expect.objectContaining({
          message: 'Network failure',
          type: 'NetworkError'
        })
      })
    );
  });
});