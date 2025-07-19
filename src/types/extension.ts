export interface NetworkRequest {
  id: string;
  timestamp: number;
  method: HTTPMethod;
  url: string;
  status: number;
  statusText: string;
  requestHeaders: Record<string, string>;
  responseHeaders: Record<string, string>;
  requestBody?: string;
  responseBody?: string;
  responseTime: number;
  responseSize: number;
  requestSize: number;
  mimeType: string;
  initiator: RequestInitiator;
  timing: PerformanceTiming;
}

export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

export interface RequestInitiator {
  type: 'script' | 'fetch' | 'xhr' | 'navigation' | 'other';
  stack?: string[];
  lineNumber?: number;
  columnNumber?: number;
  url?: string;
}

export interface PerformanceTiming {
  requestStart: number;
  responseStart: number;
  responseEnd: number;
  totalTime: number;
}

export enum MessageType {
  NETWORK_REQUEST = 'network_request',
  TOGGLE_OVERLAY = 'toggle_overlay',
  EXPORT_DATA = 'export_data',
  UPDATE_SETTINGS = 'update_settings',
  GET_REQUESTS = 'get_requests',
  CLEAR_REQUESTS = 'clear_requests'
}