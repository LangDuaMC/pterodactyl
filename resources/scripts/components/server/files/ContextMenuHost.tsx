import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBoxOpen,
    faCopy,
    faExternalLinkAlt,
    faFileArchive,
    faFileCode,
    faFileDownload,
    faLevelUpAlt,
    faPencilAlt,
    faTrashAlt,
    faTrashRestore,
    faDumpster,
    IconDefinition,
} from '@fortawesome/free-solid-svg-icons';
import { FileObject } from '@/api/server/files/loadDirectory';
import { ServerContext } from '@/state/server';
import { join } from 'pathe';
import deleteFiles from '@/api/server/files/deleteFiles';
import renameFiles from '@/api/server/files/renameFiles';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import copyFile from '@/api/server/files/copyFile';
import Can from '@/components/elements/Can';
import getFileDownloadUrl from '@/api/server/files/getFileDownloadUrl';
import useFlash from '@/plugins/useFlash';
import tw from 'twin.macro';
import styled from 'styled-components/macro';
import useFileManagerSwr from '@/plugins/useFileManagerSwr';
import compressFiles from '@/api/server/files/compressFiles';
import decompressFiles from '@/api/server/files/decompressFiles';
import RenameFileModal from '@/components/server/files/RenameFileModal';
import ChmodFileModal from '@/components/server/files/ChmodFileModal';
import { Dialog } from '@/components/elements/dialog';
import Select from '@/components/elements/Select';
import { Button } from '@/components/elements/button/index';
import Fade from '@/components/elements/Fade';
import Portal from '@/components/elements/Portal';
import FileIcon from '@/components/server/files/FileIcon';

import DropdownItems from '@blueprint/components/Server/Files/Browse/DropdownItems';

type ModalType = 'rename' | 'move' | 'chmod';

const MenuItem = styled.div<{ $danger?: boolean }>`
    ${tw`p-2 flex items-center rounded cursor-pointer whitespace-nowrap`};
    ${(props) =>
        props.$danger ? tw`hover:bg-red-900 hover:text-red-300` : tw`hover:bg-neutral-700 hover:text-neutral-100`};
`;

const ItemIcon = ({ icon, title, ...props }: { icon: IconDefinition; title: string; $danger?: boolean } & React.HTMLAttributes<HTMLDivElement>) => (
    <MenuItem {...props}>
        <FontAwesomeIcon icon={icon} css={tw`text-xs`} fixedWidth />
        <span css={tw`ml-2`}>{title}</span>
    </MenuItem>
);

interface ContextTarget {
    file: FileObject;
    posX: number;
    posY: number;
    isRoot?: boolean;
}

const ContextMenuHost: React.FC = () => {
    const [target, setTarget] = useState<ContextTarget | null>(null);
    const [showSpinner, setShowSpinner] = useState(false);
    const [modal, setModal] = useState<ModalType | null>(null);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [showCompressDialog, setShowCompressDialog] = useState(false);
    const [compressFormat, setCompressFormat] = useState('tar.gz');
    const [modalFile, setModalFile] = useState<FileObject | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const directory = ServerContext.useStoreState((state) => state.files.directory);
    const openBrowserTab = ServerContext.useStoreActions((a) => a.files.openBrowserTab);
    const { mutate } = useFileManagerSwr();
    const { clearAndAddHttpError, clearFlashes } = useFlash();
    const isInTrash = directory === '.trash' || directory.startsWith('.trash/');

    const close = useCallback(() => {
        setTarget(null);
        setModal(null);
        setShowConfirmation(false);
        setShowDeleteConfirmation(false);
        setModalFile(null);
    }, []);

    useEffect(() => {
        const handler = (e: CustomEvent<ContextTarget>) => {
            setTarget(e.detail);
        };
        window.addEventListener('pterodactyl:files:ctx:open', handler as EventListener);
        return () => window.removeEventListener('pterodactyl:files:ctx:open', handler as EventListener);
    }, []);

    useLayoutEffect(() => {
        if (!target || !menuRef.current) return;
        const menu = menuRef.current;
        const rect = menu.getBoundingClientRect();
        const { innerWidth, innerHeight } = window;
        const pad = 4;

        let left = target.posX - rect.width;
        let top = target.posY;

        if (left < pad) left = pad;
        if (left + rect.width > innerWidth - pad) left = innerWidth - rect.width - pad;
        if (top < pad) top = pad;
        if (top + rect.height > innerHeight - pad) top = innerHeight - rect.height - pad;

        menu.style.left = `${left}px`;
        menu.style.top = `${top}px`;
    }, [target]);

    const isRoot = target?.isRoot ?? false;
    const file = target?.file ?? modalFile;

    const doDeletion = () => {
        if (!file) return;
        clearFlashes('files');
        mutate((files) => files.filter((f) => f.key !== file.key), false);
        deleteFiles(uuid, directory, [file.name]).catch((error) => {
            mutate();
            clearAndAddHttpError({ key: 'files', error });
        });
        close();
    };

    const doCopy = () => {
        if (!file) return;
        setShowSpinner(true);
        clearFlashes('files');
        copyFile(uuid, join(directory, file.name))
            .then(() => mutate())
            .catch((error) => clearAndAddHttpError({ key: 'files', error }))
            .then(() => { setShowSpinner(false); close(); });
    };

    const doDownload = () => {
        if (!file) return;
        setShowSpinner(true);
        clearFlashes('files');
        getFileDownloadUrl(uuid, join(directory, file.name))
            .then((url) => {
                // @ts-expect-error this is valid
                window.location = url;
            })
            .catch((error) => clearAndAddHttpError({ key: 'files', error }))
            .then(() => { setShowSpinner(false); close(); });
    };

    const doArchive = () => {
        if (!file) return;
        setShowCompressDialog(true);
    };

    const doArchiveWithFormat = () => {
        if (!file) return;
        setShowCompressDialog(false);
        setShowSpinner(true);
        clearFlashes('files');
        compressFiles(uuid, directory, [file.name], compressFormat)
            .then(() => mutate())
            .catch((error) => clearAndAddHttpError({ key: 'files', error }))
            .then(() => { setShowSpinner(false); close(); });
    };

    const doUnarchive = () => {
        if (!file) return;
        setShowSpinner(true);
        clearFlashes('files');
        decompressFiles(uuid, directory, file.name)
            .then(() => mutate())
            .catch((error) => clearAndAddHttpError({ key: 'files', error }))
            .then(() => { setShowSpinner(false); close(); });
    };

    const doMoveToTrash = () => {
        if (!file) return;
        setShowSpinner(true);
        clearFlashes('files');

        const root = '/';
        renameFiles(uuid, root, [{
            from: directory === '/' ? file.name : directory.replace(/^\//, '') + '/' + file.name,
            to: '.trash/' + file.name,
        }])
            .then(() => mutate())
            .catch((error) => clearAndAddHttpError({ key: 'files', error }))
            .then(() => { setShowSpinner(false); close(); });
    };

    const doRestore = () => {
        if (!file) return;
        setShowSpinner(true);
        clearFlashes('files');

        const root = '/';
        const trashRelative = directory === '.trash'
            ? file.name
            : directory.replace(/^\.trash\//, '') + '/' + file.name;
        const restoreDir = directory.replace(/^\.trash\/?/, '') || '';
        renameFiles(uuid, root, [{
            from: '.trash/' + trashRelative,
            to: restoreDir ? restoreDir + '/' + file.name : file.name,
        }])
            .then(() => mutate())
            .catch((error) => clearAndAddHttpError({ key: 'files', error }))
            .then(() => { setShowSpinner(false); close(); });
    };

    const openModal = (m: ModalType) => {
        if (target) setModalFile(target.file);
        setModal(m);
        setTarget(null);
    };

    const closeAfterModal = () => {
        setModal(null);
        setModalFile(null);
        setTarget(null);
    };

    const showMenuItems = target ? !isRoot : false;

    return (
        <>
            {(modal || showConfirmation || showDeleteConfirmation || showCompressDialog) && file && (
                <>
                    <Dialog
                        open={showCompressDialog}
                        title={'Compress File'}
                        onClose={() => setShowCompressDialog(false)}
                    >
                        <p css={tw`text-sm text-neutral-300 mb-4`}>
                            Compress <span className={'font-semibold text-gray-50'}>{file.name}</span> into an archive.
                        </p>
                        <label css={tw`block text-sm text-neutral-200 mb-1`}>Format</label>
                        <Select value={compressFormat} onChange={(e) => setCompressFormat(e.currentTarget.value)}>
                            <option value={'tar.gz'}>tar.gz</option>
                            <option value={'zip'}>ZIP</option>
                            <option value={'tar.bz2'}>tar.bz2</option>
                            <option value={'tar.xz'}>tar.xz</option>
                        </Select>
                        <Dialog.Footer>
                            <Button.Text onClick={() => setShowCompressDialog(false)}>Cancel</Button.Text>
                            <Button onClick={doArchiveWithFormat}>Compress</Button>
                        </Dialog.Footer>
                    </Dialog>
                    <Dialog.Confirm
                        open={showConfirmation}
                        onClose={() => setShowConfirmation(false)}
                        title={'Move to Trash'}
                        confirm={'Move to Trash'}
                        onConfirmed={doMoveToTrash}
                    >
                        Move <span className={'font-semibold text-gray-50'}>{file.name}</span> to the trash?
                    </Dialog.Confirm>
                    <Dialog.Confirm
                        open={showDeleteConfirmation}
                        onClose={() => setShowDeleteConfirmation(false)}
                        title={`Delete ${file.isFile ? 'File' : 'Directory'}`}
                        confirm={'Permanently Delete'}
                        onConfirmed={doDeletion}
                    >
                        You will not be able to recover the contents of{' '}
                        <span className={'font-semibold text-gray-50'}>{file.name}</span> once permanently deleted.
                    </Dialog.Confirm>
                    {modal === 'chmod' ? (
                        <ChmodFileModal
                            visible
                            appear
                            files={[{ file: file.name, mode: file.modeBits }]}
                            onDismissed={closeAfterModal}
                        />
                    ) : modal === 'rename' || modal === 'move' ? (
                        <RenameFileModal
                            visible
                            appear
                            files={[file.name]}
                            useMoveTerminology={modal === 'move'}
                            onDismissed={closeAfterModal}
                        />
                    ) : null}
                </>
            )}
            {!target ? null : ((file) => (
            <Portal>
                <div css={tw`fixed inset-0 z-50`} onClick={close} onContextMenu={(e) => { e.preventDefault(); close(); }} />
                <div
                    ref={menuRef}
                    onContextMenu={(e) => e.preventDefault()}
                    style={{
                        position: 'fixed',
                        left: 0,
                        top: 0,
                        width: '12rem',
                        zIndex: 9999,
                    }}
                    css={tw`bg-neutral-800 p-2 rounded border border-neutral-700 shadow-lg text-neutral-200`}
                >
                    <SpinnerOverlay visible={showSpinner} fixed size={'large'} />
                    {file && (
                        <div css={tw`flex items-center gap-2 px-2 py-1.5 border-b border-neutral-700 mb-1`}>
                            <FileIcon name={file.name} isFile={file.isFile} isSymlink={file.isSymlink} isArchive={file.isArchiveType()} size={14} />
                            <span css={tw`truncate text-xs text-neutral-300`}>{file.name}</span>
                        </div>
                    )}
                    {showMenuItems ? (
                        <>
                            {isInTrash ? (
                                <>
                                    <Can action={'file.update'}>
                                        <ItemIcon icon={faTrashRestore} title={'Restore'} onClick={doRestore} />
                                    </Can>
                                    <Can action={'file.delete'}>
                                        <ItemIcon icon={faTrashAlt} title={'Delete Permanently'} $danger onClick={() => { setShowDeleteConfirmation(true); setTarget(null); }} />
                                    </Can>
                                </>
                            ) : (
                                <>
                                    {!file.isFile && (
                                        <ItemIcon
                                            icon={faExternalLinkAlt}
                                            title={'Open in new tab'}
                                            onClick={() => {
                                                openBrowserTab(join(directory, file.name));
                                                close();
                                            }}
                                        />
                                    )}
                                    <Can action={'file.update'}>
                                        <ItemIcon icon={faPencilAlt} title={'Rename'} onClick={() => openModal('rename')} />
                                        <ItemIcon icon={faLevelUpAlt} title={'Move'} onClick={() => openModal('move')} />
                                        <ItemIcon icon={faFileCode} title={'Permissions'} onClick={() => openModal('chmod')} />
                                    </Can>
                                    {file.isFile && (
                                        <Can action={'file.create'}>
                                            <ItemIcon icon={faCopy} title={'Copy'} onClick={doCopy} />
                                        </Can>
                                    )}
                                    {file.isArchiveType() ? (
                                        <Can action={'file.create'}>
                                            <ItemIcon icon={faBoxOpen} title={'Unarchive'} onClick={doUnarchive} />
                                        </Can>
                                    ) : (
                                        <Can action={'file.archive'}>
                                            <ItemIcon icon={faFileArchive} title={'Archive'} onClick={doArchive} />
                                        </Can>
                                    )}
                                    {file.isFile && <ItemIcon icon={faFileDownload} title={'Download'} onClick={doDownload} />}
                                    <Can action={'file.delete'}>
                                        <ItemIcon
                                            icon={faTrashAlt}
                                            title={'Move to Trash'}
                                            $danger
                                            onClick={() => {
                                                if (target) setModalFile(target.file);
                                                setShowConfirmation(true);
                                                setTarget(null);
                                            }}
                                        />
                                    </Can>
                                    <Can action={'file.delete'}>
                                        <ItemIcon
                                            icon={faDumpster}
                                            title={'Delete Permanently'}
                                            $danger
                                            onClick={() => {
                                                if (target) setModalFile(target.file);
                                                setShowDeleteConfirmation(true);
                                                setTarget(null);
                                            }}
                                        />
                                    </Can>
                                </>
                            )}
                        </>
                    ) : null}
                    <DropdownItems />
                </div>
            </Portal>
            ))(target.file)}
        </>
    );
};

export const openContextMenu = (file: FileObject, posX: number, posY: number, isRoot?: boolean) => {
    window.dispatchEvent(new CustomEvent('pterodactyl:files:ctx:open', {
        detail: { file, posX, posY, isRoot },
    }));
};

export default ContextMenuHost;
