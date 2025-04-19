import { Observable } from 'rxjs';
import { Accessor, createSignal } from 'solid-js';

interface HttpConfig {
  headers?: Record<string, string>;
}

class HttpClientObs {
  private server = 'https://192.168.1.100:5000';

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
      mode: 'cors' ,
      credentials: 'include',    // <- if you ever need cookies/auth
      // only attach body if present
      ...(body !== undefined
        ? { body: JSON.stringify(body) }
        : {}),
    };

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
}

// export a single shared instance
export default new HttpClientObs();
