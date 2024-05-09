import { Observable } from 'rxjs';
import { Accessor, createSignal } from 'solid-js';

interface HttpConfig {
    headers?: {[key: string]: string}
}

class HttpClientObs {
    private loggedIn = createSignal<{[key: string]: string}>({});
    private tokenValue = createSignal<string>("");

    public set token(val: string) {
        this.tokenValue[1](val);
        this.loggedIn[1]({
            Authorization: `Bearer ${val}`
        })
    }

    public get token(): Accessor<string>{
        return this.tokenValue[0];
    }
    
    public clearToken() {
        this.loggedIn[1]({
            Authorization: ``
        });
    }
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