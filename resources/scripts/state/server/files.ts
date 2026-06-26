import { action, Action } from 'easy-peasy';

export interface FileUploadData {
    loaded: number;
    readonly abort: AbortController;
    readonly total: number;
}

export interface Tab {
    id: string;
    type: 'browser' | 'editor' | 'image';
    path: string;
    name: string;
    mode?: string;
}

export interface ServerFileStore {
    tabs: Tab[];
    activeTabId: string | null;
    directory: string;
    selectedFiles: string[];
    uploads: Record<string, FileUploadData>;
    viewMode: 'list' | 'grid';

    setDirectory: Action<ServerFileStore, string>;
    setSelectedFiles: Action<ServerFileStore, string[]>;
    appendSelectedFile: Action<ServerFileStore, string>;
    removeSelectedFile: Action<ServerFileStore, string>;
    setViewMode: Action<ServerFileStore, 'list' | 'grid'>;

    pushFileUpload: Action<ServerFileStore, { name: string; data: FileUploadData }>;
    setUploadProgress: Action<ServerFileStore, { name: string; loaded: number }>;
    clearFileUploads: Action<ServerFileStore>;
    removeFileUpload: Action<ServerFileStore, string>;
    cancelFileUpload: Action<ServerFileStore, string>;

    openBrowserTab: Action<ServerFileStore, string>;
    openEditorTab: Action<ServerFileStore, { path: string; name: string; mode: string }>;
    openImageTab: Action<ServerFileStore, { path: string; name: string }>;
    closeTab: Action<ServerFileStore, string>;
    setActiveTab: Action<ServerFileStore, string>;
    navigateBrowserTab: Action<ServerFileStore, string>;
}

let nextId = 1;
const uniqueId = (): string => `tab-${nextId++}`;

const tabName = (path: string): string => {
    if (path === '/' || !path) return '/';
    return path.split('/').filter(Boolean).pop() || path;
};

const files: ServerFileStore = {
    tabs: [],
    activeTabId: null,
    directory: '/',
    selectedFiles: [],
    uploads: {},
    viewMode: 'list',

    setDirectory: action((state, payload) => {
        state.directory = payload;
    }),

    setSelectedFiles: action((state, payload) => {
        state.selectedFiles = payload;
    }),

    appendSelectedFile: action((state, payload) => {
        state.selectedFiles = state.selectedFiles.filter((f) => f !== payload).concat(payload);
    }),

    removeSelectedFile: action((state, payload) => {
        state.selectedFiles = state.selectedFiles.filter((f) => f !== payload);
    }),

    setViewMode: action((state, payload) => {
        state.viewMode = payload;
    }),

    pushFileUpload: action((state, payload) => {
        state.uploads[payload.name] = payload.data;
    }),

    setUploadProgress: action((state, { name, loaded }) => {
        if (state.uploads[name]) {
            state.uploads[name].loaded = loaded;
        }
    }),

    clearFileUploads: action((state) => {
        for (const upload of Object.values(state.uploads)) {
            upload.abort.abort();
        }

        state.uploads = {};
    }),

    removeFileUpload: action((state, payload) => {
        if (state.uploads[payload]) {
            delete state.uploads[payload];
        }
    }),

    cancelFileUpload: action((state, payload) => {
        if (state.uploads[payload]) {
            state.uploads[payload].abort.abort();

            delete state.uploads[payload];
        }
    }),

    openBrowserTab: action((state, path) => {
        const id = uniqueId();
        state.tabs = [...state.tabs, { id, type: 'browser', path, name: tabName(path) }];
        state.activeTabId = id;
        state.directory = path;
    }),

    openEditorTab: action((state, { path, name, mode }) => {
        const id = uniqueId();
        state.tabs = [...state.tabs, { id, type: 'editor', path, name, mode }];
        state.activeTabId = id;
    }),

    openImageTab: action((state, { path, name }) => {
        const id = uniqueId();
        state.tabs = [...state.tabs, { id, type: 'image', path, name }];
        state.activeTabId = id;
    }),

    closeTab: action((state, tabId) => {
        const idx = state.tabs.findIndex((t) => t.id === tabId);
        if (idx === -1) return;

        state.tabs = state.tabs.filter((t) => t.id !== tabId);

        if (state.activeTabId === tabId) {
            if (state.tabs.length > 0) {
                const nextTab = state.tabs[Math.min(idx, state.tabs.length - 1)];
                state.activeTabId = nextTab.id;
                if (nextTab.type === 'browser') {
                    state.directory = nextTab.path;
                }
            } else {
                state.activeTabId = null;
            }
        }
    }),

    setActiveTab: action((state, tabId) => {
        state.activeTabId = tabId;
        const tab = state.tabs.find((t) => t.id === tabId);
        if (tab?.type === 'browser') {
            state.directory = tab.path;
        }
    }),

    navigateBrowserTab: action((state, path) => {
        const active = state.tabs.find((t) => t.id === state.activeTabId);
        if (!active || active.type !== 'browser') return;

        active.path = path;
        active.name = tabName(path);
        state.directory = path;
    }),
};

export default files;
