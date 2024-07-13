class HttpClient {
    constructor() {}
    public post(url: string, data: Object = {}) {
        return fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        })
    }
    public get(url: string) {
        return fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        })
    }
}
export default new HttpClient();