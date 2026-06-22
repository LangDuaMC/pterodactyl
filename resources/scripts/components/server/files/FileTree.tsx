import React, { useCallback, useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faChevronRight,
    faChevronDown,
    faFileAlt,
    faFileArchive,
    faFileImport,
    faFolder,
    faFolderOpen,
} from '@fortawesome/free-solid-svg-icons';
import loadDirectory, { FileObject } from '@/api/server/files/loadDirectory';
import { ServerContext } from '@/state/server';
import { encodePathSegments } from '@/helpers';
import { join } from 'pathe';
import { useHistory, useRouteMatch } from 'react-router-dom';
import tw from 'twin.macro';
import styled from 'styled-components/macro';

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
    name: string;
    path: string;
    isFile: boolean;
    isSymlink: boolean;
    mimetype: string;
    isArchiveType: boolean;
    currentDirectory: string;
    onNavigate: (path: string) => void;
    onOpenFile: (path: string, name: string) => void;
}

const TreeNode = React.memo(
    ({
        depth,
        name,
        path,
        isFile,
        isSymlink,
        mimetype,
        isArchiveType: isArchive,
        currentDirectory,
        onNavigate,
        onOpenFile,
    }: TreeNodeProps) => {
        const [expanded, setExpanded] = useState(currentDirectory.startsWith(path + '/') || currentDirectory === path);
        const [children, setChildren] = useState<FileObject[] | null>(null);
        const [loading, setLoading] = useState(false);
        const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);

        useEffect(() => {
            if (isFile) return;
            setExpanded((prev) => prev || currentDirectory.startsWith(path + '/') || currentDirectory === path);
        }, [currentDirectory]);

        const toggle = useCallback(() => {
            if (!isFile) {
                setExpanded((prev) => {
                    if (!prev && children === null) {
                        setLoading(true);
                        loadDirectory(uuid, path)
                            .then(setChildren)
                            .catch(() => setChildren([]))
                            .finally(() => setLoading(false));
                    }
                    return !prev;
                });
            }
        }, [isFile, path, uuid, children]);

        const handleClick = useCallback(() => {
            if (isFile) {
                onOpenFile(path, name);
            } else {
                toggle();
            }
        }, [isFile, path, name, onOpenFile, toggle]);

        const icon = isFile
            ? isSymlink
                ? faFileImport
                : isArchive
                  ? faFileArchive
                  : faFileAlt
            : expanded
              ? faFolderOpen
              : faFolder;

        const isActive = !isFile && currentDirectory === path;

        return (
            <>
                <div
                    onClick={handleClick}
                    css={[
                        tw`flex items-center gap-1 px-1 py-0.5 rounded cursor-pointer whitespace-nowrap hover:bg-neutral-600`,
                        isActive && tw`bg-neutral-600 text-neutral-100`,
                        !isActive && tw`text-neutral-400 hover:text-neutral-200`,
                    ]}
                    style={{ paddingLeft: `${depth * 16 + 4}px` }}
                >
                    {!isFile && (
                        <span css={tw`w-3 flex-shrink-0 text-neutral-500`}>
                            <FontAwesomeIcon icon={expanded ? faChevronDown : faChevronRight} size='xs' />
                        </span>
                    )}
                    {isFile && <span css={tw`w-3 flex-shrink-0`} />}
                    <span css={tw`w-4 flex-shrink-0 text-neutral-500`}>
                        <FontAwesomeIcon icon={icon} size='sm' />
                    </span>
                    <span css={tw`truncate`}>{name}</span>
                    {loading && <span css={tw`text-neutral-600 text-xs`}>...</span>}
                </div>
                {!isFile && expanded && children && (
                    <>
                        {children.map((child) => (
                            <TreeNode
                                key={child.key}
                                depth={depth + 1}
                                name={child.name}
                                path={join(path, child.name)}
                                isFile={child.isFile}
                                isSymlink={child.isSymlink}
                                mimetype={child.mimetype}
                                isArchiveType={child.isArchiveType()}
                                currentDirectory={currentDirectory}
                                onNavigate={onNavigate}
                                onOpenFile={onOpenFile}
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
}> = ({ onOpenFile }) => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const directory = ServerContext.useStoreState((state) => state.files.directory);
    const [roots, setRoots] = useState<FileObject[] | null>(null);

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
                css={tw`flex items-center gap-1 px-2 py-0.5 text-neutral-300 cursor-pointer hover:text-neutral-100`}
                onClick={() => onOpenFile('/', '')}
            >
                <FontAwesomeIcon icon={faFolderOpen} size='sm' css={tw`mr-1`} />
                <span css={tw`text-xs font-medium`}>/ (root)</span>
            </div>
            {roots.map((root) => (
                <TreeNode
                    key={root.key}
                    depth={0}
                    name={root.name}
                    path={root.name}
                    isFile={root.isFile}
                    isSymlink={root.isSymlink}
                    mimetype={root.mimetype}
                    isArchiveType={root.isArchiveType()}
                    currentDirectory={directory}
                    onNavigate={() => {}}
                    onOpenFile={onOpenFile}
                />
            ))}
        </TreeContainer>
    );
};

export default FileTree;
