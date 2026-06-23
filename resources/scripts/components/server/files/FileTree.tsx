import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faChevronRight,
    faChevronDown,
} from '@fortawesome/free-solid-svg-icons';
import loadDirectory, { FileObject } from '@/api/server/files/loadDirectory';
import { ServerContext } from '@/state/server';
import { join } from 'pathe';
import tw from 'twin.macro';
import styled from 'styled-components/macro';
import SelectFileCheckbox from '@/components/server/files/SelectFileCheckbox';
import FileIcon from '@/components/server/files/FileIcon';
import { openContextMenu } from '@/components/server/files/ContextMenuHost';

const TreeContainer = styled.div`
    ${tw`text-sm overflow-y-auto overflow-x-hidden select-none`}
    min-height: 0;
    height: 100%;
    font-size: 12px;

    &::-webkit-scrollbar {
        width: 4px;
    }
`;

interface TreeNodeProps {
    depth: number;
    file: FileObject;
    path: string;
    currentDirectory: string;
    onOpenFile: (path: string, name: string) => void;
    onOpenBrowserTab: (path: string) => void;
}

const TreeNode = React.memo(
    ({
        depth,
        file,
        path,
        currentDirectory,
        onOpenFile,
        onOpenBrowserTab,
    }: TreeNodeProps) => {
        const [expanded, setExpanded] = useState(
            currentDirectory.startsWith(path + '/') || currentDirectory === path,
        );
        const [children, setChildren] = useState<FileObject[] | null>(null);
        const [loading, setLoading] = useState(false);
        const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);

        useEffect(() => {
            if (file.isFile) return;
            setExpanded(
                (prev) => prev || currentDirectory.startsWith(path + '/') || currentDirectory === path,
            );
        }, [currentDirectory, path, file.isFile]);

        const loadChildren = useCallback(() => {
            if (children === null) {
                setLoading(true);
                loadDirectory(uuid, path)
                    .then(setChildren)
                    .catch(() => setChildren([]))
                    .finally(() => setLoading(false));
            }
        }, [path, uuid, children]);

        const handleToggle = useCallback(() => {
            if (!file.isFile) {
                loadChildren();
                setExpanded((prev) => !prev);
            }
        }, [file.isFile, loadChildren]);

        const handleNameClick = useCallback((e: React.MouseEvent) => {
            e.stopPropagation();
            if (file.isFile) {
                onOpenFile(path, file.name);
            } else {
                handleToggle();
                onOpenBrowserTab(path);
            }
        }, [file.isFile, path, file.name, onOpenFile, handleToggle, onOpenBrowserTab]);

        const handleChevronClick = useCallback((e: React.MouseEvent) => {
            e.stopPropagation();
            handleToggle();
        }, [handleToggle]);

        const isActive = !file.isFile && currentDirectory === path;

        return (
            <>
                <div
                    css={[
                        tw`flex items-center gap-1 px-1 py-0.5 rounded whitespace-nowrap cursor-default`,
                        isActive && tw`bg-neutral-600 text-neutral-100`,
                        !isActive && tw`text-neutral-400 hover:bg-neutral-700/60 hover:text-neutral-200`,
                    ]}
                    style={{ paddingLeft: `${depth * 16 + 4}px` }}
                    onContextMenu={(e) => {
                        e.preventDefault();
                        openContextMenu(file, e.clientX, e.clientY);
                    }}
                >
                    {/* Chevron: click to expand/collapse */}
                    <span
                        css={tw`w-5 flex-shrink-0 flex items-center justify-center text-neutral-500 cursor-pointer py-1 -my-1`}
                        onClick={handleChevronClick}
                    >
                        {!file.isFile && (
                            <FontAwesomeIcon icon={expanded ? faChevronDown : faChevronRight} size='xs' />
                        )}
                    </span>

                    {/* Selection area: checkbox for folders */}
                    <span css={tw`w-4 flex-shrink-0 flex items-center justify-center`}>
                        {!file.isFile && <SelectFileCheckbox name={file.name} />}
                    </span>

                    {/* File/folder icon + name: navigate (for folders: expands + opens tab) */}
                    <span
                        css={[
                            tw`flex items-center gap-1 truncate cursor-pointer py-1 -my-1 flex-1 min-w-0`,
                            !file.isFile && tw`text-neutral-300`,
                            file.isFile && tw`text-neutral-400`,
                        ]}
                        onClick={handleNameClick}
                    >
                        <span css={tw`w-4 flex-shrink-0 flex items-center justify-center`}>
                            <FileIcon
                                name={file.name}
                                isFile={file.isFile}
                                isSymlink={file.isSymlink}
                                isArchive={file.isArchiveType()}
                                isExpanded={expanded}
                                size={14}
                            />
                        </span>
                        <span css={tw`truncate`}>{file.name}</span>
                    </span>

                    {loading && <span css={tw`text-neutral-600 text-xs flex-shrink-0`}>...</span>}
                </div>
                {!file.isFile && expanded && children && (
                    <>
                        {children.map((child) => (
                            <TreeNode
                                key={child.key}
                                depth={depth + 1}
                                file={child}
                                path={join(path, child.name)}
                                currentDirectory={currentDirectory}
                                onOpenFile={onOpenFile}
                                onOpenBrowserTab={onOpenBrowserTab}
                            />
                        ))}
                    </>
                )}
            </>
        );
    },
);

const FileTree: React.FC<{
    onOpenFile: (path: string, name: string) => void;
}> = memo(({ onOpenFile }) => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const directory = ServerContext.useStoreState((state) => state.files.directory);
    const [roots, setRoots] = useState<FileObject[] | null>(null);
    const openBrowserTab = ServerContext.useStoreActions((a) => a.files.openBrowserTab);

    const rootFile: FileObject = {
        key: 'dir_/',
        name: '/',
        mode: 'drwxr-xr-x',
        modeBits: '0755',
        size: 0,
        isFile: false,
        isSymlink: false,
        mimetype: '',
        createdAt: new Date(),
        modifiedAt: new Date(),
        isArchiveType: () => false,
        isEditable: () => false,
    };

    useEffect(() => {
        loadDirectory(uuid, '/')
            .then(setRoots)
            .catch(() => setRoots([]));
    }, [uuid]);

    if (!roots) {
        return (
            <TreeContainer>
                <div css={tw`text-neutral-500 text-xs p-2`}>Loading...</div>
            </TreeContainer>
        );
    }

    return (
        <TreeContainer>
            <div
                css={tw`flex items-center gap-1 px-2 py-0.5 text-neutral-300 cursor-pointer hover:bg-neutral-700/60 hover:text-neutral-100`}
                onClick={() => openBrowserTab('/')}
                onContextMenu={(e) => {
                    e.preventDefault();
                    openContextMenu(rootFile, e.clientX, e.clientY, true);
                }}
            >
                <FileIcon name='/' isFile={false} isExpanded size={14} />
                <span css={tw`text-xs font-medium`}>/ (root)</span>
            </div>
            {roots.map((root) => (
                <TreeNode
                    key={root.key}
                    depth={0}
                    file={root}
                    path={root.name}
                    currentDirectory={directory}
                    onOpenFile={onOpenFile}
                    onOpenBrowserTab={(path) => openBrowserTab(path)}
                />
            ))}
        </TreeContainer>
    );
});

export default FileTree;
