import React, { useCallback, useEffect, useRef, useState } from 'react';
import { httpErrorToHuman } from '@/api/http';
import { CSSTransition } from 'react-transition-group';
import Spinner from '@/components/elements/Spinner';
import FileObjectRow from '@/components/server/files/FileObjectRow';
import FileGrid from '@/components/server/files/FileGrid';
import FileManagerBreadcrumbs from '@/components/server/files/FileManagerBreadcrumbs';
import { FileObject } from '@/api/server/files/loadDirectory';
import NewDirectoryButton from '@/components/server/files/NewDirectoryButton';
import PullFileModal from '@/components/server/files/PullFileModal';
import { NavLink } from 'react-router-dom';
import Can from '@/components/elements/Can';
import { ServerError } from '@/components/elements/ScreenBlock';
import tw from 'twin.macro';
import { Button } from '@/components/elements/button/index';
import { ServerContext } from '@/state/server';
import useFileManagerSwr from '@/plugins/useFileManagerSwr';
import FileManagerStatus from '@/components/server/files/FileManagerStatus';
import MassActionsBar from '@/components/server/files/MassActionsBar';
import UploadButton from '@/components/server/files/UploadButton';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import { useStoreActions } from '@/state/hooks';
import useFlash from '@/plugins/useFlash';
import ErrorBoundary from '@/components/elements/ErrorBoundary';
import { FileActionCheckbox } from '@/components/server/files/SelectFileCheckbox';
import getFileContents from '@/api/server/files/getFileContents';
import saveFileContents from '@/api/server/files/saveFileContents';
import deleteFiles from '@/api/server/files/deleteFiles';
import CodemirrorEditor from '@/components/elements/CodemirrorEditor';
import ImageViewer from '@/components/server/files/ImageViewer';
import FileTree from '@/components/server/files/FileTree';
import TabBar from '@/components/server/files/TabBar';
import ContextMenuHost from '@/components/server/files/ContextMenuHost';
import { Dialog } from '@/components/elements/dialog';
import Select from '@/components/elements/Select';
import modes from '@/modes';
import { encodePathSegments, hashToPath } from '@/helpers';

import BeforeContent from '@blueprint/components/Server/Files/Browse/BeforeContent';
import FileButtons from '@blueprint/components/Server/Files/Browse/FileButtons';
import AfterContent from '@blueprint/components/Server/Files/Browse/AfterContent';

const sortFiles = (files: FileObject[]): FileObject[] => {
    const sortedFiles: FileObject[] = files
        .sort((a, b) => a.name.localeCompare(b.name))
        .sort((a, b) => (a.isFile === b.isFile ? 0 : a.isFile ? 1 : -1));
    return sortedFiles.filter((file, index) => index === 0 || file.name !== sortedFiles[index - 1].name);
};

const findModeByPath = (path: string): string => {
    const filename = path.split('/').pop() || '';
    for (let i = 0; i < modes.length; i++) {
        const info = modes[i];
        if (info.file && info.file.test(filename)) {
            return info.mime;
        }
    }
    const dot = filename.lastIndexOf('.');
    const ext = dot > -1 ? filename.substring(dot + 1) : '';
    if (ext) {
        for (let i = 0; i < modes.length; i++) {
            const info = modes[i];
            if (info.ext) {
                for (let j = 0; j < info.ext.length; j++) {
                    if (info.ext[j] === ext) return info.mime;
                }
            }
        }
    }
    return 'text/plain';
};

export default () => {
    const id = ServerContext.useStoreState((state) => state.server.data!.id);
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const { data: files, error, mutate } = useFileManagerSwr();
    const directory = ServerContext.useStoreState((state) => state.files.directory);
    const tabs = ServerContext.useStoreState((state) => state.files.tabs);
    const activeTabId = ServerContext.useStoreState((state) => state.files.activeTabId);
    const clearFlashes = useStoreActions((actions) => actions.flashes.clearFlashes);

    const setSelectedFiles = ServerContext.useStoreActions((actions) => actions.files.setSelectedFiles);
    const setDirectory = ServerContext.useStoreActions((actions) => actions.files.setDirectory);
    const selectedFilesLength = ServerContext.useStoreState((state) => state.files.selectedFiles.length);
    const openBrowserTab = ServerContext.useStoreActions((a) => a.files.openBrowserTab);
    const openEditorTab = ServerContext.useStoreActions((a) => a.files.openEditorTab);
    const setActiveTab = ServerContext.useStoreActions((a) => a.files.setActiveTab);

    const [showMobileTree, setShowMobileTree] = useState(false);
    const [editorContent, setEditorContent] = useState('');
    const [editorMode, setEditorMode] = useState('text/plain');
    const [editorLoading, setEditorLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const fetchFileContentRef = useRef<(() => Promise<string>) | null>(null);
    const viewMode = ServerContext.useStoreState((state) => state.files.viewMode);
    const setViewMode = ServerContext.useStoreActions((actions) => actions.files.setViewMode);

    const skipHashSync = useRef(false);

    useEffect(() => {
        if (tabs.length > 0) return;
        const hash = window.location.hash;
        if (hash.startsWith('#browser:')) {
            openBrowserTab(hashToPath(hash.replace('#browser:', '')));
        } else if (hash.startsWith('#editor:')) {
            const path = hashToPath(hash.replace('#editor:', ''));
            openEditorTab({
                path,
                name: path.split('/').filter(Boolean).pop() || path,
                mode: 'text/plain',
            });
        } else {
            openBrowserTab('/');
        }
    }, [tabs.length, openBrowserTab, openEditorTab]);

    useEffect(() => {
        clearFlashes('files');
        setSelectedFiles([]);
    }, [tabs]);

    const onSelectAllClick = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedFiles(e.currentTarget.checked ? files?.map((file) => file.name) || [] : []);
    };

    const openFile = useCallback(
        (path: string, name: string) => {
            const mode = findModeByPath(path);
            openEditorTab({ path, name, mode });
        },
        [openEditorTab],
    );

    const activeTab = tabs.find((t) => t.id === activeTabId) || null;

    useEffect(() => {
        if (!activeTab || activeTab.type !== 'editor') return;

        setEditorMode(activeTab.mode || 'text/plain');
        setEditorLoading(true);
        getFileContents(uuid, activeTab.path)
            .then(setEditorContent)
            .catch(() => setEditorContent(''))
            .finally(() => setEditorLoading(false));
    }, [activeTab?.id, uuid]);

    const save = useCallback(() => {
        if (!activeTab || activeTab.type !== 'editor' || !fetchFileContentRef.current) return;
        setSaving(true);
        fetchFileContentRef
            .current()
            .then((content) => saveFileContents(uuid, activeTab.path, content))
            .catch(() => {})
            .finally(() => setSaving(false));
    }, [uuid, activeTab?.id, activeTab?.type]);

    const isInTrash = directory === '.trash' || directory.startsWith('.trash/');
    const showEditor = activeTab?.type === 'editor';

    const { clearFlashes: clearFileFlashes, clearAndAddHttpError } = useFlash();
    const [showEmptyTrashConfirm, setShowEmptyTrashConfirm] = useState(false);

    const emptyTrash = () => {
        if (!files || files.length === 0) return;
        setShowEmptyTrashConfirm(false);
        setSaving(true);
        clearFileFlashes('files');
        deleteFiles(uuid, directory, files.map((f) => f.name))
            .then(() => mutate())
            .catch((error) => clearAndAddHttpError({ key: 'files', error }))
            .then(() => setSaving(false));
    };

    return (
        <ServerContentBlock title={'File Manager'} showFlashKey={'files'}>
            <ErrorBoundary>
                <BeforeContent />
                <div css={tw`flex gap-2`} style={{ minHeight: 'calc(100vh - 14rem)' }}>
                    {/* Desktop sidebar — hidden on mobile */}
                    <div css={tw`hidden md:block flex-shrink-0 bg-neutral-800 rounded overflow-hidden`} style={{ width: '240px' }}>
                        <div css={tw`px-2 py-1.5 text-xs font-medium text-neutral-300 border-b border-neutral-700`}>
                            Files
                        </div>
                        <FileTree onOpenFile={openFile} />
                    </div>

                    {/* Mobile tree overlay */}
                    {showMobileTree && (
                        <div css={tw`fixed inset-0 z-50 md:hidden`} onClick={() => setShowMobileTree(false)}>
                            <div css={tw`absolute inset-0 bg-black/50`} />
                            <div css={tw`absolute left-0 top-0 bottom-0 w-64 bg-neutral-800 shadow-xl flex flex-col`} onClick={(e) => e.stopPropagation()}>
                                <div css={tw`flex items-center justify-between px-3 py-2 text-xs font-medium text-neutral-300 border-b border-neutral-700`}>
                                    <span>Files</span>
                                    <button type="button" onClick={() => setShowMobileTree(false)} css={tw`text-neutral-500 hover:text-neutral-200`}>
                                        <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" aria-label="Close tree"><path d="M10 8.586L4.707 3.293a1 1 0 00-1.414 1.414L8.586 10l-5.293 5.293a1 1 0 101.414 1.414L10 11.414l5.293 5.293a1 1 0 001.414-1.414L11.414 10l5.293-5.293a1 1 0 00-1.414-1.414L10 8.586z"/></svg>
                                    </button>
                                </div>
                                <div css={tw`flex-1 overflow-y-auto`}>
                                    <FileTree onOpenFile={(p, n) => { openFile(p, n); setShowMobileTree(false); }} />
                                </div>
                            </div>
                        </div>
                    )}

                    <div css={tw`flex-1 flex flex-col min-w-0`}>
                        {/* Mobile toggle button */}
                        <button
                            type="button"
                            css={tw`md:hidden flex items-center gap-1.5 px-2 py-1.5 text-xs text-neutral-400 hover:text-neutral-200 bg-neutral-800 rounded-t border-b border-neutral-700 w-full`}
                            onClick={() => setShowMobileTree(true)}
                        >
                            <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" aria-label="Open file tree">
                                <path d="M3 5h14a1 1 0 110 2H3a1 1 0 010-2zm0 4h14a1 1 0 110 2H3a1 1 0 010-2zm0 4h14a1 1 0 110 2H3a1 1 0 010-2z" />
                            </svg>
                            <span>Files</span>
                        </button>
                        <TabBar />
                        {activeTab?.type === 'browser' ? (
                            <>
                                <div className={'flex flex-wrap-reverse md:flex-nowrap mb-4'}>
                                    <FileManagerBreadcrumbs
                                        renderLeft={
                                            <FileActionCheckbox
                                                type={'checkbox'}
                                                css={tw`mx-4`}
                                                checked={
                                                    selectedFilesLength ===
                                                    (files?.length === 0 ? -1 : files?.length)
                                                }
                                                onChange={onSelectAllClick}
                                            />
                                        }
                                    />
                                    <Can action={'file.create'}>
                                        <div className={'grid grid-cols-2 sm:grid-cols-3 w-full gap-4 mb-4 md:flex md:flex-1 md:justify-end md:mb-0'}>
                                            <FileManagerStatus />
                                            <FileButtons />
                                            <button
                                                type={'button'}
                                                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                                                css={tw`px-3 py-2 text-xs font-medium rounded bg-neutral-700 hover:bg-neutral-600 text-neutral-200 transition-colors`}
                                                title={viewMode === 'grid' ? 'List view' : 'Grid view'}
                                            >
                                                {viewMode === 'grid' ? 'List' : 'Grid'}
                                            </button>
                                            <PullFileModal />
                                            <NewDirectoryButton />
                                            <UploadButton />
                                            <NavLink to={`/server/${id}/files/new#${encodePathSegments(directory)}`}>
                                                <Button>New File</Button>
                                            </NavLink>
                                        </div>
                                    </Can>
                                </div>
                                {isInTrash && (
                                    <div css={tw`rounded bg-red-900/30 border border-red-700 mb-2 p-3 flex items-center justify-between`}>
                                        <div>
                                            <p css={tw`text-red-200 text-sm font-medium`}>Trash</p>
                                            <p css={tw`text-red-300 text-xs`}>
                                                Files moved here are kept until you permanently delete them.
                                            </p>
                                        </div>
                                        <Button.Danger
                                            variant={Button.Variants.Secondary}
                                            onClick={() => setShowEmptyTrashConfirm(true)}
                                            disabled={!files || files.length === 0}
                                        >
                                            Empty Trash
                                        </Button.Danger>
                                    </div>
                                )}
                                {!files ? (
                                    <Spinner size={'large'} centered />
                                ) : (
                                    <>
                                        {!files.length ? (
                                            <p css={tw`text-sm text-neutral-400 text-center`}>
                                                This directory seems to be empty.
                                            </p>
                                        ) : (
                                            <CSSTransition classNames={'fade'} timeout={150} appear in>
                                                <div>
                                                    {files.length > 250 && (
                                                        <div css={tw`rounded bg-yellow-400 mb-px p-3`}>
                                                            <p css={tw`text-yellow-900 text-sm text-center`}>
                                                                This directory is too large to display in the browser,
                                                                limiting the output to the first 250 files.
                                                            </p>
                                                        </div>
                                                    )}
                                                    {viewMode === 'grid' ? (
                                                        <FileGrid
                                                            files={sortFiles(files.slice(0, 250))}
                                                            onOpenFile={openFile}
                                                        />
                                                    ) : (
                                                        sortFiles(files.slice(0, 250)).map((file) => (
                                                            <FileObjectRow
                                                                key={file.key}
                                                                file={file}
                                                                onOpenFile={
                                                                    file.isFile && file.isEditable()
                                                                        ? (p, n) => openFile(p, n)
                                                                        : undefined
                                                                }
                                                            />
                                                        ))
                                                    )}
                                                    <MassActionsBar />
                                                </div>
                                            </CSSTransition>
                                        )}
                                    </>
                                )}
                                <Dialog.Confirm
                                    open={showEmptyTrashConfirm}
                                    onClose={() => setShowEmptyTrashConfirm(false)}
                                    title={'Empty Trash'}
                                    confirm={'Empty Trash'}
                                    onConfirmed={emptyTrash}
                                >
                                    Permanently delete all files in the trash? This cannot be undone.
                                </Dialog.Confirm>
                            </>
                        ) : activeTab?.type === 'image' ? (
                            activeTab && <ImageViewer path={activeTab.path} name={activeTab.name} />
                        ) : showEditor ? (
                            <div>
                                <div css={tw`bg-neutral-800 rounded-b border-t border-neutral-700 relative`}>
                                    {editorLoading && (
                                        <div
                                            css={tw`absolute inset-0 z-10 flex items-center justify-center bg-neutral-800/75`}
                                        >
                                            <Spinner size={'small'} />
                                        </div>
                                    )}
                                    <CodemirrorEditor
                                        mode={editorMode}
                                        filename={activeTab?.path || ''}
                                        onModeChanged={setEditorMode}
                                        initialContent={editorContent}
                                        fetchContent={(value) => {
                                            fetchFileContentRef.current = value;
                                        }}
                                        onContentSaved={save}
                                    />
                                    <div css={tw`flex justify-end p-2 border-t border-neutral-700`}>
                                        <div css={tw`rounded bg-neutral-900 mr-2`}>
                                            <Select
                                                value={editorMode}
                                                onChange={(e) => setEditorMode(e.currentTarget.value)}
                                            >
                                                {modes.map((mode) => (
                                                    <option key={`${mode.name}_${mode.mime}`} value={mode.mime}>
                                                        {mode.name}
                                                    </option>
                                                ))}
                                            </Select>
                                        </div>
                                        <Can action={'file.update'}>
                                            <Button onClick={save} disabled={saving}>
                                                {saving ? 'Saving...' : 'Save Content'}
                                            </Button>
                                        </Can>
                                    </div>
                                </div>
                            </div>
                        ) : tabs.length === 0 ? (
                            <p css={tw`text-sm text-neutral-400 text-center mt-8`}>
                                Open a folder from the file tree to get started.
                            </p>
                        ) : (
                            <Spinner size={'large'} centered />
                        )}
                    </div>
                </div>
            </ErrorBoundary>
            <ContextMenuHost />
            <AfterContent />
        </ServerContentBlock>
    );
};
