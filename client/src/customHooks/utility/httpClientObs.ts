import { Observable } from 'rxjs';

interface HttpConfig {
    headers?: {[key: string]: string}
}

class HttpClientObs {
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