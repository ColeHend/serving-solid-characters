import { Observable } from 'rxjs';
import { Accessor, createSignal } from 'solid-js';

interface HttpConfig {
    headers?: {[key: string]: string}
}

/**
 * Represents an HTTP client with observables.
 * This class provides methods for making HTTP requests and returning the response as an observable.
 */
class HttpClientObs {
    private loggedIn = createSignal<{[key: string]: string}>({});
    private tokenValue = createSignal<string>("");

    /**
     * Sets the token value and updates the authorization header.
     * 
     * @param {string} val - The token value.
     * @returns {void}
     */
    public set token(val: string) {
        this.tokenValue[1](val);
        this.loggedIn[1]({
            Authorization: `Bearer ${val}`
        })
    }

    /**
     * Gets the token value.
     *
     * @returns The token value.
     */
    public get token(): Accessor<string>{
        return this.tokenValue[0];
    }
    
    /**
     * Clears the token by setting the Authorization header to an empty string.
     */
    public clearToken() {
        this.loggedIn[1]({
            Authorization: ``
        });
    }
    
    /**
     * Converts a Promise to an Observable.
     * 
     * @template T - The type of the response data.
     * @param {Promise<T>} promise - The promise to convert to an Observable.
     * @returns {Observable<T>} An Observable that emits the response data.
     */
    public toObservable<T>(promise: Promise<T>) {
        return new Observable<T>((observer) => {
            promise
                .then((data) => {
                    observer.next(data);
                })
                .catch((error) => observer.error(error))
                .finally(() => observer.complete());
        });
    }
    /**
     * 
     * @param url - The URL to send the POST request to.
     * @param body - The body of the POST request.
     * @param config - Optional configuration for the request.
     * @returns {Observable<T>} An Observable that emits the response data.
     */
    public post<T>(url: string, body: any, config?: HttpConfig): Observable<T> {
        return new Observable<T>((observer) => {
            fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...config?.headers,
                    ...this.loggedIn[0]()
                },
                body: JSON.stringify(body),
            })
                .then((response) => {
                    if (!response.ok) {
                        throw new Error(response.statusText);
                    }
                    return response.json();
                })
                .then((data) => {
                    observer.next(data);
                })
                .catch((error) => observer.error(error))
                .finally(() => observer.complete());
        })};

    /**
     * Sends a GET request to the specified URL and returns an Observable that emits the response data.
     * @template T - The type of the response data.
     * @param {string} url - The URL to send the GET request to.
     * @param {HttpConfig} [config] - Optional configuration for the request.
     * @returns {Observable<T>} An Observable that emits the response data.
     */
    public get<T>(url: string, config?: HttpConfig): Observable<T> {
        return new Observable<T>((observer) => {
            fetch(url, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    ...config?.headers,
                    ...this.loggedIn[0]()
                },
            })
                .then((response) => {
                    if (!response.ok) {
                        throw new Error(response.statusText);
                    }
                    return response.json();
                })
                .then((data) => {
                    observer.next(data);
                })
                .catch((error) => observer.error(error))
                .finally(() => observer.complete());
        })};
}
export default new HttpClientObs();