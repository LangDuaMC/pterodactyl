import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBoxOpen,
    faCopy,
    faFileArchive,
    faFileCode,
    faFileDownload,
    faLevelUpAlt,
    faPencilAlt,
    faTrashAlt,
    IconDefinition,
} from '@fortawesome/free-solid-svg-icons';
import { FileObject } from '@/api/server/files/loadDirectory';
import { ServerContext } from '@/state/server';
import { join } from 'pathe';
import deleteFiles from '@/api/server/files/deleteFiles';
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
import Fade from '@/components/elements/Fade';
import Portal from '@/components/elements/Portal';

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
    const menuRef = useRef<HTMLDivElement>(null);

    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const directory = ServerContext.useStoreState((state) => state.files.directory);
    const { mutate } = useFileManagerSwr();
    const { clearAndAddHttpError, clearFlashes } = useFlash();

    const close = useCallback(() => {
        setTarget(null);
        setModal(null);
        setShowConfirmation(false);
    }, []);

    const handleContextMenu = useCallback((e: MouseEvent) => {
        if (menuRef.current && menuRef.current.contains(e.target as Node)) {
            e.preventDefault();
            return;
        }
        close();
    }, [close]);

    useEffect(() => {
        const handler = (e: CustomEvent<ContextTarget>) => {
            const { posX, posY } = e.detail;
            if (menuRef.current) {
                menuRef.current.style.left = `${posX}px`;
                menuRef.current.style.top = `${posY}px`;
            }
            setTarget(e.detail);
        };
        window.addEventListener('pterodactyl:files:ctx:open', handler as EventListener);
        return () => window.removeEventListener('pterodactyl:files:ctx:open', handler as EventListener);
    }, []);

    useEffect(() => {
        if (!target) return;
        const handleClick = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setTarget(null);
            }
        };
        document.addEventListener('click', handleClick);
        document.addEventListener('contextmenu', handleContextMenu);
        return () => {
            document.removeEventListener('click', handleClick);
            document.removeEventListener('contextmenu', handleContextMenu);
        };
    }, [target, handleContextMenu]);

    if (!target) return null;

    const { file, posX, posY, isRoot } = target;

    const doDeletion = () => {
        clearFlashes('files');
        mutate((files) => files.filter((f) => f.key !== file.key), false);
        deleteFiles(uuid, directory, [file.name]).catch((error) => {
            mutate();
            clearAndAddHttpError({ key: 'files', error });
        });
        setTarget(null);
    };

    const doCopy = () => {
        setShowSpinner(true);
        clearFlashes('files');
        copyFile(uuid, join(directory, file.name))
            .then(() => mutate())
            .catch((error) => clearAndAddHttpError({ key: 'files', error }))
            .then(() => { setShowSpinner(false); setTarget(null); });
    };

    const doDownload = () => {
        setShowSpinner(true);
        clearFlashes('files');
        getFileDownloadUrl(uuid, join(directory, file.name))
            .then((url) => {
                // @ts-expect-error this is valid
                window.location = url;
            })
            .catch((error) => clearAndAddHttpError({ key: 'files', error }))
            .then(() => { setShowSpinner(false); setTarget(null); });
    };

    const doArchive = () => {
        setShowSpinner(true);
        clearFlashes('files');
        compressFiles(uuid, directory, [file.name])
            .then(() => mutate())
            .catch((error) => clearAndAddHttpError({ key: 'files', error }))
            .then(() => { setShowSpinner(false); setTarget(null); });
    };

    const doUnarchive = () => {
        setShowSpinner(true);
        clearFlashes('files');
        decompressFiles(uuid, directory, file.name)
            .then(() => mutate())
            .catch((error) => clearAndAddHttpError({ key: 'files', error }))
            .then(() => { setShowSpinner(false); setTarget(null); });
    };

    const closeAfterModal = () => {
        setModal(null);
        setTarget(null);
    };

    const showMenuItems = !isRoot;

    return (
        <>
            <Dialog.Confirm
                open={showConfirmation}
                onClose={() => setShowConfirmation(false)}
                title={`Delete ${file.isFile ? 'File' : 'Directory'}`}
                confirm={'Delete'}
                onConfirmed={doDeletion}
            >
                You will not be able to recover the contents of{' '}
                <span className={'font-semibold text-gray-50'}>{file.name}</span> once deleted.
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
            <Portal>
                <div
                    ref={menuRef}
                    onContextMenu={(e) => e.preventDefault()}
                    style={{
                        position: 'fixed',
                        left: `${Math.max(4, Math.min(posX - 192, window.innerWidth - 196))}px`,
                        top: `${Math.max(4, Math.min(posY, window.innerHeight - 48))}px`,
                        width: '12rem',
                        zIndex: 9999,
                    }}
                    css={tw`bg-neutral-800 p-2 rounded border border-neutral-700 shadow-lg text-neutral-200`}
                    onClick={() => setTarget(null)}
                >
                    <SpinnerOverlay visible={showSpinner} fixed size={'large'} />
                    {showMenuItems ? (
                        <>
                            <Can action={'file.update'}>
                                <ItemIcon icon={faPencilAlt} title={'Rename'} onClick={() => setModal('rename')} />
                                <ItemIcon icon={faLevelUpAlt} title={'Move'} onClick={() => setModal('move')} />
                                <ItemIcon icon={faFileCode} title={'Permissions'} onClick={() => setModal('chmod')} />
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
                                    title={'Delete'}
                                    $danger
                                    onClick={() => setShowConfirmation(true)}
                                />
                            </Can>
                        </>
                    ) : null}
                    <DropdownItems />
                </div>
            </Portal>
        </>
    );
};

export const openContextMenu = (file: FileObject, posX: number, posY: number, isRoot?: boolean) => {
    window.dispatchEvent(new CustomEvent('pterodactyl:files:ctx:open', {
        detail: { file, posX, posY, isRoot },
    }));
};

export default ContextMenuHost;
