import React, { useCallback, useEffect, useRef, useState } from 'react';
import { httpErrorToHuman } from '@/api/http';
import { CSSTransition } from 'react-transition-group';
import Spinner from '@/components/elements/Spinner';
import FileObjectRow from '@/components/server/files/FileObjectRow';
import FileManagerBreadcrumbs from '@/components/server/files/FileManagerBreadcrumbs';
import { FileObject } from '@/api/server/files/loadDirectory';
import NewDirectoryButton from '@/components/server/files/NewDirectoryButton';
import { NavLink, useLocation } from 'react-router-dom';
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
import ErrorBoundary from '@/components/elements/ErrorBoundary';
import { FileActionCheckbox } from '@/components/server/files/SelectFileCheckbox';
import { hashToPath } from '@/helpers';
import getFileContents from '@/api/server/files/getFileContents';
import saveFileContents from '@/api/server/files/saveFileContents';
import CodemirrorEditor from '@/components/elements/CodemirrorEditor';
import FileTree from '@/components/server/files/FileTree';
import EditorTabBar from '@/components/server/files/EditorTabBar';
import Select from '@/components/elements/Select';
import modes from '@/modes';
import { encodePathSegments } from '@/helpers';
import style from './style.module.css';

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
    const { hash } = useLocation();
    const { data: files, error, mutate } = useFileManagerSwr();
    const directory = ServerContext.useStoreState((state) => state.files.directory);
    const clearFlashes = useStoreActions((actions) => actions.flashes.clearFlashes);
    const setDirectory = ServerContext.useStoreActions((actions) => actions.files.setDirectory);

    const setSelectedFiles = ServerContext.useStoreActions((actions) => actions.files.setSelectedFiles);
    const selectedFilesLength = ServerContext.useStoreState((state) => state.files.selectedFiles.length);

    const editorTabs = ServerContext.useStoreState((s) => s.files.editorTabs);
    const activeTab = ServerContext.useStoreState((s) => s.files.activeTab);
    const openEditorTab = ServerContext.useStoreActions((a) => a.files.openEditorTab);
    const closeEditorTab = ServerContext.useStoreActions((a) => a.files.closeEditorTab);
    const setActiveTab = ServerContext.useStoreActions((a) => a.files.setActiveTab);

    const [editorContent, setEditorContent] = useState('');
    const [editorMode, setEditorMode] = useState('text/plain');
    const [editorLoading, setEditorLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const fetchFileContentRef = useRef<(() => Promise<string>) | null>(null);

    useEffect(() => {
        clearFlashes('files');
        setSelectedFiles([]);
        setDirectory(hashToPath(hash));
    }, [hash]);

    useEffect(() => {
        mutate();
    }, [directory]);

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

    useEffect(() => {
        if (!activeTab) return;
        const tab = editorTabs.find((t) => t.path === activeTab);
        if (!tab) return;

        setEditorMode(tab.mode);
        setEditorLoading(true);
        getFileContents(uuid, activeTab)
            .then(setEditorContent)
            .catch(() => setEditorContent(''))
            .finally(() => setEditorLoading(false));
    }, [activeTab, editorTabs.length]);

    const save = useCallback(() => {
        if (!activeTab || !fetchFileContentRef.current) return;
        setSaving(true);
        fetchFileContentRef
            .current()
            .then((content) => saveFileContents(uuid, activeTab, content))
            .catch(() => {})
            .finally(() => setSaving(false));
    }, [uuid, activeTab]);

    if (error) {
        return <ServerError message={httpErrorToHuman(error)} onRetry={() => mutate()} />;
    }

    const showEditor = activeTab && editorTabs.length > 0;

    return (
        <ServerContentBlock title={'File Manager'} showFlashKey={'files'}>
            <ErrorBoundary>
                <BeforeContent />
                <div css={tw`flex gap-2`} style={{ minHeight: 'calc(100vh - 14rem)' }}>
                    <div css={tw`flex-shrink-0 bg-neutral-800 rounded overflow-hidden`} style={{ width: '240px' }}>
                        <div css={tw`px-2 py-1.5 text-xs font-medium text-neutral-300 border-b border-neutral-700`}>
                            Files
                        </div>
                        <FileTree onOpenFile={openFile} />
                    </div>
                    <div css={tw`flex-1 flex flex-col min-w-0`}>
                        <div className={'flex flex-wrap-reverse md:flex-nowrap mb-4'}>
                            <FileManagerBreadcrumbs
                                renderLeft={
                                    <FileActionCheckbox
                                        type={'checkbox'}
                                        css={tw`mx-4`}
                                        checked={selectedFilesLength === (files?.length === 0 ? -1 : files?.length)}
                                        onChange={onSelectAllClick}
                                    />
                                }
                            />
                            <Can action={'file.create'}>
                                <div className={style.manager_actions}>
                                    <FileManagerStatus />
                                    <FileButtons />
                                    <NewDirectoryButton />
                                    <UploadButton />
                                    <NavLink to={`/server/${id}/files/new${window.location.hash}`}>
                                        <Button>New File</Button>
                                    </NavLink>
                                </div>
                            </Can>
                        </div>
                        {showEditor && (
                            <div css={tw`mb-4`}>
                                <EditorTabBar />
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
                                        filename={activeTab || ''}
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
                                                        This directory is too large to display in the browser, limiting
                                                        the output to the first 250 files.
                                                    </p>
                                                </div>
                                            )}
                                            {sortFiles(files.slice(0, 250)).map((file) => (
                                                <FileObjectRow
                                                    key={file.key}
                                                    file={file}
                                                    onOpenFile={
                                                        file.isFile && file.isEditable()
                                                            ? (p, n) => openFile(p, n)
                                                            : undefined
                                                    }
                                                />
                                            ))}
                                            <MassActionsBar />
                                        </div>
                                    </CSSTransition>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </ErrorBoundary>
            <AfterContent />
        </ServerContentBlock>
    );
};
