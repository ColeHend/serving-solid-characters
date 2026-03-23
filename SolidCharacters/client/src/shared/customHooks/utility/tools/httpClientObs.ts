import { Observable } from 'rxjs';
import { Accessor, createSignal } from 'solid-js';

interface HttpConfig {
  headers?: Record<string, string>;
  nocors?: boolean;
}

class HttpClientObs {
  private server = window.location.origin;

  //–– Signals for auth headers and raw token
  private loggedInHeaders: Accessor<Record<string, string>>;
  private setLoggedInHeaders: (h: Record<string, string>) => Record<string, string>;
  private tokenValue: Accessor<string>;
  private setTokenValue: (v: string) => string;

  constructor() {
    // initialize with empty header / token
    [this.loggedInHeaders, this.setLoggedInHeaders] = createSignal({});
    [this.tokenValue,    this.setTokenValue]    = createSignal('');
  }

  /**
   * Update the bearer token and auto‐inject Authorization header
   */
  public set token(val: string) {
    this.setTokenValue(val);
    this.setLoggedInHeaders({ Authorization: `Bearer ${val}` });
  }

  /**
   * Read the current token directly (no extra () call)
   */
  public get token(): string {
    return this.tokenValue();
  }

  /**
   * Drop the stored token and headers
   */
  public clearToken(): void {
    this.setTokenValue('');
    this.setLoggedInHeaders({});
  }

  /**
   * Core request invoker. All public verbs bubble here.
   */
  private request<T>(
    method: string,
    url: string,
    body?: any,
    config?: HttpConfig
  ): Observable<T> {
    const fullUrl = url.startsWith('/api')
      ? `${this.server}${url}`
      : url;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...config?.headers,
      ...this.loggedInHeaders(),
    };

    const opts: RequestInit = {
      method,
      headers,  
      // only attach body if present
      ...(body !== undefined
        ? { body: JSON.stringify(body) }
        : {}),
    };
    if (!config?.nocors) {
      opts.mode = 'cors';
    }

    return new Observable<T>((observer) => {
      fetch(fullUrl, opts)
        .then(async res => {
          const text = await res.text();
          if (!res.ok) {
            console.error('HTTP error', res.status, res.statusText, text);
            throw new Error(`HTTP ${res.status} ${res.statusText} – ${text}`);
          }
          return text ? JSON.parse(text) : undefined as any;
        })
        .then((data) => {
          observer.next(data);
          observer.complete();
        })
        .catch((err) => observer.error(err));
    });
  }

  /** GET wrapper */
  public get<T>(url: string, config?: HttpConfig): Observable<T> {
    return this.request<T>('GET', url, undefined, config);
  }

  /** POST wrapper */
  public post<T>(url: string, body: any, config?: HttpConfig): Observable<T> {
    return this.request<T>('POST', url, body, config);
  }

  /** PUT wrapper */
  public put<T>(url: string, body: any, config?: HttpConfig): Observable<T> {
    return this.request<T>('PUT', url, body, config);
  }

  /** PATCH wrapper */
  public patch<T>(url: string, body: any, config?: HttpConfig): Observable<T> {
    return this.request<T>('PATCH', url, body, config);
  }

  /** DELETE wrapper */
  public delete<T>(url: string, config?: HttpConfig): Observable<T> {
    return this.request<T>('DELETE', url, undefined, config);
  }

  public toObservable<T>(promise: Promise<T>): Observable<T> {
    return new Observable<T>((observer) => {
      promise
        .then((data) => {
          observer.next(data);
          observer.complete();
        })
        .catch((err) => observer.error(err));
    });
  }

  public streamText(url: string, options: Omit<RequestInit, 'method'>): Observable<StreamResponse<string>> {
    return new Observable<StreamResponse<string>>((observer) => {
      streamText(url, {
        onChunk: (chunk) => observer.next({ value: chunk }),
        onError: (err) => observer.error(err),
        onDone: () => observer.complete(),
        onProgress: (progress) => observer.next({ value: '', metadata: {
          percentComplete: progress.percent ?? undefined,
          totalBytes: progress.totalBytes ?? undefined,
          receivedBytes: progress.receivedBytes,
        } }),
        ...options,
      })
    });
  }

  public fetchJsonWithProgress<T>(url: string, options: Omit<RequestInit, 'method'>): Observable<StreamResponse<T>> {
    return new Observable<StreamResponse<T>>((observer) => {
      fetchJsonWithProgress<T>(url, {
        onProgress: (progress) => observer.next({ value: null as any, metadata: {
          percentComplete: progress.percent ?? undefined,
          totalBytes: progress.totalBytes ?? undefined,
          receivedBytes: progress.receivedBytes,
        } }),
        onError: (err) => observer.error(err),
        ...options,
      })
        .then((data) => {
          observer.next({ value: data });
          observer.complete();
        })
        .catch((err) => observer.error(err));
    });
  }
}
interface StreamResponse<T> {
  value: T;
  metadata?: {
    percentComplete?: number;
    totalBytes?: number;
    receivedBytes?: number;
  }
}
// export a single shared instance
export default new HttpClientObs();

export type FetchJsonProgress = {
  receivedBytes: number;
  totalBytes: number | null;
  percent: number | null;
};

type FetchJsonOptions = RequestInit & {
  onProgress?: (progress: FetchJsonProgress) => void;
  onError?: (error: unknown) => void;
};

async function fetchJsonWithProgress<T>(
  input: RequestInfo | URL,
  options: FetchJsonOptions = {}
): Promise<T> {
  const { onProgress, onError, ...requestInit } = options;

  try {
    const response = await fetch(input, requestInit);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error("Response body is empty.");
    }

    const totalBytesHeader = response.headers.get("Content-Length");
    const totalBytes = totalBytesHeader ? Number(totalBytesHeader) : null;

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let receivedBytes = 0;
    let text = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (!value) continue;

        receivedBytes += value.byteLength;
        text += decoder.decode(value, { stream: true });

        onProgress?.({
          receivedBytes,
          totalBytes,
          percent:
            totalBytes && totalBytes > 0
              ? Math.min(100, (receivedBytes / totalBytes) * 100)
              : null,
        });
      }

      text += decoder.decode();

      return JSON.parse(text) as T;
    } finally {
      reader.releaseLock();
    }
  } catch (error) {
    onError?.(error);
    throw error;
  }
}

export type StreamProgress = {
  receivedBytes: number;
  totalBytes: number | null;
  percent: number | null;
};

type StreamTextOptions = RequestInit & {
  onChunk: (chunk: string) => void;
  onProgress?: (progress: StreamProgress) => void;
  onDone?: () => void;
  onError?: (error: unknown) => void;
};

async function streamText(
  input: RequestInfo | URL,
  options: StreamTextOptions
): Promise<void> {
  const { onChunk, onProgress, onDone, onError, ...requestInit } = options;

  try {
    const response = await fetch(input, requestInit);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error("Response body is empty or streaming is unsupported.");
    }

    const totalBytesHeader = response.headers.get("Content-Length");
    const totalBytes = totalBytesHeader ? Number(totalBytesHeader) : null;

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let receivedBytes = 0;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (!value) continue;

        receivedBytes += value.byteLength;

        const chunk = decoder.decode(value, { stream: true });
        if (chunk) onChunk(chunk);

        onProgress?.({
          receivedBytes,
          totalBytes,
          percent:
            totalBytes && totalBytes > 0
              ? Math.min(100, (receivedBytes / totalBytes) * 100)
              : null,
        });
      }

      const tail = decoder.decode();
      if (tail) {
        onChunk(tail);
      }

      onDone?.();
    } finally {
      reader.releaseLock();
    }
  } catch (error) {
    onError?.(error);
    throw error;
  }
}
