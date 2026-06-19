import { action, Action } from 'easy-peasy';
import { cleanDirectoryPath } from '@/helpers';

export interface FileUploadData {
    loaded: number;
    readonly abort: AbortController;
    readonly total: number;
}

export interface EditorTab {
    path: string;
    name: string;
    mode: string;
}

export interface ServerFileStore {
    directory: string;
    selectedFiles: string[];
    uploads: Record<string, FileUploadData>;
    editorTabs: EditorTab[];
    activeTab: string | null;

    setDirectory: Action<ServerFileStore, string>;
    setSelectedFiles: Action<ServerFileStore, string[]>;
    appendSelectedFile: Action<ServerFileStore, string>;
    removeSelectedFile: Action<ServerFileStore, string>;

    pushFileUpload: Action<ServerFileStore, { name: string; data: FileUploadData }>;
    setUploadProgress: Action<ServerFileStore, { name: string; loaded: number }>;
    clearFileUploads: Action<ServerFileStore>;
    removeFileUpload: Action<ServerFileStore, string>;
    cancelFileUpload: Action<ServerFileStore, string>;

    openEditorTab: Action<ServerFileStore, EditorTab>;
    closeEditorTab: Action<ServerFileStore, string>;
    setActiveTab: Action<ServerFileStore, string | null>;
}

const files: ServerFileStore = {
    directory: '/',
    selectedFiles: [],
    uploads: {},
    editorTabs: [],
    activeTab: null,

    setDirectory: action((state, payload) => {
        state.directory = cleanDirectoryPath(payload);
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

    clearFileUploads: action((state) => {
        Object.values(state.uploads).forEach((upload) => upload.abort.abort());

        state.uploads = {};
    }),

    pushFileUpload: action((state, payload) => {
        state.uploads[payload.name] = payload.data;
    }),

    setUploadProgress: action((state, { name, loaded }) => {
        if (state.uploads[name]) {
            state.uploads[name].loaded = loaded;
        }
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

    openEditorTab: action((state, payload) => {
        const exists = state.editorTabs.find((t) => t.path === payload.path);
        if (!exists) {
            state.editorTabs = [...state.editorTabs, payload];
        }
        state.activeTab = payload.path;
    }),

    closeEditorTab: action((state, path) => {
        const idx = state.editorTabs.findIndex((t) => t.path === path);
        if (idx === -1) return;

        state.editorTabs = state.editorTabs.filter((t) => t.path !== path);

        if (state.activeTab === path) {
            if (state.editorTabs.length > 0) {
                state.activeTab = state.editorTabs[Math.min(idx, state.editorTabs.length - 1)].path;
            } else {
                state.activeTab = null;
            }
        }
    }),

    setActiveTab: action((state, payload) => {
        state.activeTab = payload;
    }),
};

export default files;
