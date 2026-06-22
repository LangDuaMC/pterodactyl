import Sockette from 'sockette';

type Listener = (...args: any[]) => void;

export class Websocket {
    private socket: Sockette | null = null;
    private url: string | null = null;
    private token = '';
    private listeners = new Map<string, Set<Listener>>();

    on(event: string, listener: Listener): this {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event)!.add(listener);
        return this;
    }

    addListener(event: string, listener: Listener): this {
        return this.on(event, listener);
    }

    removeAllListeners() {
        this.listeners.clear();
    }

    removeListener(event: string, listener: Listener): this {
        this.listeners.get(event)?.delete(listener);
        return this;
    }

    private emit(event: string, ...args: any[]) {
        this.listeners.get(event)?.forEach((fn) => {
            fn(...args);
        });
    }

    connect(url: string): this {
        this.url = url;

        this.socket = new Sockette(`${this.url}`, {
            timeout: 1000,
            maxAttempts: 20,
            onmessage: (e) => {
                try {
                    const { event, args } = JSON.parse(e.data);
                    args ? this.emit(event, ...args) : this.emit(event);
                } catch (ex) {
                    console.warn('Failed to parse incoming websocket message.', ex);
                }
            },
            onopen: () => {
                this.emit('SOCKET_OPEN');
                this.authenticate();
            },
            onreconnect: (evt) => {
                const ev = evt as CloseEvent;
                if (ev.code === 4409 || ev.code === 4400) {
                    this.close(1000);
                } else {
                    this.emit('SOCKET_RECONNECT');
                }
            },
            onclose: () => this.emit('SOCKET_CLOSE'),
            onerror: (error) => this.emit('SOCKET_ERROR', error),
            onmaximum: () => this.emit('SOCKET_CONNECT_ERROR'),
        });

        return this;
    }

    setToken(token: string, isUpdate = false): this {
        this.token = token;

        if (isUpdate) {
            this.authenticate();
        }

        return this;
    }

    authenticate() {
        if (this.url && this.token) {
            this.send('auth', this.token);
        }
    }

    close(code?: number, reason?: string) {
        this.url = null;
        this.token = '';
        this.socket?.close(code, reason);
    }

    open() {
        this.socket?.open();
    }

    reconnect() {
        this.socket?.reconnect();
    }

    send(event: string, payload?: string | string[]) {
        this.socket?.json({ event, args: Array.isArray(payload) ? payload : [payload] });
    }
}
