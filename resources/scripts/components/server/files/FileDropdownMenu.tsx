import React, { memo, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBoxOpen,
    faCopy,
    faEllipsisH,
    faFileArchive,
    faFileCode,
    faFileDownload,
    faLevelUpAlt,
    faPencilAlt,
    faTrashAlt,
    faTrashRestore,
    faDumpster,
    faCompressAlt,
    IconDefinition,
} from '@fortawesome/free-solid-svg-icons';
import RenameFileModal from '@/components/server/files/RenameFileModal';
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
import { FileObject } from '@/api/server/files/loadDirectory';
import useFileManagerSwr from '@/plugins/useFileManagerSwr';
import DropdownMenu from '@/components/elements/DropdownMenu';
import styled from 'styled-components/macro';
import useEventListener from '@/plugins/useEventListener';
import compressFiles from '@/api/server/files/compressFiles';
import decompressFiles from '@/api/server/files/decompressFiles';
import isEqual from 'react-fast-compare';
import ChmodFileModal from '@/components/server/files/ChmodFileModal';
import { Dialog } from '@/components/elements/dialog';
import Select from '@/components/elements/Select';
import { Button } from '@/components/elements/button/index';

import DropdownItems from '@blueprint/components/Server/Files/Browse/DropdownItems';

type ModalType = 'rename' | 'move' | 'chmod';

const StyledRow = styled.div<{ $danger?: boolean }>`
    ${tw`p-2 flex items-center rounded cursor-pointer`};
    ${(props) =>
        props.$danger ? tw`hover:bg-red-900 hover:text-red-300` : tw`hover:bg-neutral-700 hover:text-neutral-100`};
`;

interface RowProps extends React.HTMLAttributes<HTMLDivElement> {
    icon: IconDefinition;
    title: string;
    $danger?: boolean;
}

const Row = ({ icon, title, ...props }: RowProps) => (
    <StyledRow {...props}>
        <FontAwesomeIcon icon={icon} css={tw`text-xs`} fixedWidth />
        <span css={tw`ml-2`}>{title}</span>
    </StyledRow>
);

interface Props {
    file: FileObject;
    noToggle?: boolean;
    isRoot?: boolean;
    children?: React.ReactNode;
}

const COMPRESS_FORMATS = ['tar.gz', 'zip', 'tar.bz2', 'tar.xz'];

const FileDropdownMenu = ({ file, noToggle, isRoot, children }: Props) => {
    const onClickRef = useRef<DropdownMenu>(null);
    const [showSpinner, setShowSpinner] = useState(false);
    const [modal, setModal] = useState<ModalType | null>(null);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [showCompressDialog, setShowCompressDialog] = useState(false);
    const [compressFormat, setCompressFormat] = useState('tar.gz');

    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const { mutate } = useFileManagerSwr();
    const { clearAndAddHttpError, clearFlashes } = useFlash();
    const directory = ServerContext.useStoreState((state) => state.files.directory);
    const isInTrash = directory === '.trash' || directory.startsWith('.trash/');

    useEventListener(`pterodactyl:files:ctx:${file.key}`, (e: CustomEvent) => {
        if (onClickRef.current) {
            onClickRef.current.triggerMenu(e.detail, true);
        }
    });

    useEventListener('pterodactyl:files:ctx:close', () => {
        if (onClickRef.current) {
            onClickRef.current.close();
        }
    });

    const doDeletion = () => {
        clearFlashes('files');

        mutate((files) => files.filter((f) => f.key !== file.key), false);

        deleteFiles(uuid, directory, [file.name]).catch((error) => {
            mutate();
            clearAndAddHttpError({ key: 'files', error });
        });
    };

    const doCopy = () => {
        setShowSpinner(true);
        clearFlashes('files');

        copyFile(uuid, join(directory, file.name))
            .then(() => mutate())
            .catch((error) => clearAndAddHttpError({ key: 'files', error }))
            .then(() => setShowSpinner(false));
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
            .then(() => setShowSpinner(false));
    };

    const doArchive = () => {
        setShowCompressDialog(true);
    };

    const doArchiveWithFormat = () => {
        setShowCompressDialog(false);
        setShowSpinner(true);
        clearFlashes('files');

        compressFiles(uuid, directory, [file.name], compressFormat)
            .then(() => mutate())
            .catch((error) => clearAndAddHttpError({ key: 'files', error }))
            .then(() => setShowSpinner(false));
    };

    const doUnarchive = () => {
        setShowSpinner(true);
        clearFlashes('files');

        decompressFiles(uuid, directory, file.name)
            .then(() => mutate())
            .catch((error) => clearAndAddHttpError({ key: 'files', error }))
            .then(() => setShowSpinner(false));
    };

    const doMoveToTrash = () => {
        setShowSpinner(true);
        clearFlashes('files');

        const root = '/';
        renameFiles(uuid, root, [{
            from: directory === '/' ? file.name : directory.replace(/^\//, '') + '/' + file.name,
            to: '.trash/' + file.name,
        }])
            .then(() => mutate())
            .catch((error) => clearAndAddHttpError({ key: 'files', error }))
            .then(() => setShowSpinner(false));
    };

    const doRestore = () => {
        setShowSpinner(true);
        clearFlashes('files');

        const root = '/';
        const trashRelative = directory === '.trash' ? file.name : directory.replace(/^\.trash\//, '') + '/' + file.name;
        const restoreDir = directory.replace(/^\.trash\/?/, '') || '';
        renameFiles(uuid, root, [{
            from: '.trash/' + trashRelative,
            to: restoreDir ? restoreDir + '/' + file.name : file.name,
        }])
            .then(() => mutate())
            .catch((error) => clearAndAddHttpError({ key: 'files', error }))
            .then(() => setShowSpinner(false));
    };

    const showToggle = !noToggle;
    const showMenuItems = !isRoot;

    return (
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
                    {COMPRESS_FORMATS.map((fmt) => (
                        <option key={fmt} value={fmt}>{fmt}</option>
                    ))}
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
                You will not be able to recover the contents of&nbsp;
                <span className={'font-semibold text-gray-50'}>{file.name}</span> once permanently deleted.
            </Dialog.Confirm>
            <DropdownMenu
                ref={onClickRef}
                renderToggle={(onClick) =>
                    showToggle ? (
                        <div css={tw`px-4 py-2 hover:text-white`} onClick={onClick}>
                            <FontAwesomeIcon icon={faEllipsisH} />
                            {children}
                            {modal ? (
                                modal === 'chmod' ? (
                                    <ChmodFileModal
                                        visible
                                        appear
                                        files={[{ file: file.name, mode: file.modeBits }]}
                                        onDismissed={() => setModal(null)}
                                    />
                                ) : (
                                    <RenameFileModal
                                        visible
                                        appear
                                        files={[file.name]}
                                        useMoveTerminology={modal === 'move'}
                                        onDismissed={() => setModal(null)}
                                    />
                                )
                            ) : null}
                            <SpinnerOverlay visible={showSpinner} fixed size={'large'} />
                        </div>
                    ) : (
                        <>{children}</>
                    )
                }
            >
                {showMenuItems ? (
                    <>
                        {isInTrash ? (
                            <>
                                <Can action={'file.update'}>
                                    <Row onClick={doRestore} icon={faTrashRestore} title={'Restore'} />
                                </Can>
                                <Can action={'file.delete'}>
                                    <Row onClick={() => setShowDeleteConfirmation(true)} icon={faTrashAlt} title={'Delete Permanently'} $danger />
                                </Can>
                            </>
                        ) : (
                            <>
                                <Can action={'file.update'}>
                                    <Row onClick={() => setModal('rename')} icon={faPencilAlt} title={'Rename'} />
                                    <Row onClick={() => setModal('move')} icon={faLevelUpAlt} title={'Move'} />
                                    <Row onClick={() => setModal('chmod')} icon={faFileCode} title={'Permissions'} />
                                </Can>
                                {file.isFile && (
                                    <Can action={'file.create'}>
                                        <Row onClick={doCopy} icon={faCopy} title={'Copy'} />
                                    </Can>
                                )}
                                {file.isArchiveType() ? (
                                    <Can action={'file.create'}>
                                        <Row onClick={doUnarchive} icon={faBoxOpen} title={'Unarchive'} />
                                    </Can>
                                ) : (
                                    <Can action={'file.archive'}>
                                        <Row onClick={doArchive} icon={faFileArchive} title={'Archive'} />
                                    </Can>
                                )}
                                {file.isFile && <Row onClick={doDownload} icon={faFileDownload} title={'Download'} />}
                                <Can action={'file.delete'}>
                                    <Row onClick={() => { setShowConfirmation(true); }} icon={faTrashAlt} title={'Move to Trash'} $danger />
                                </Can>
                                <Can action={'file.delete'}>
                                    <Row onClick={() => setShowDeleteConfirmation(true)} icon={faDumpster} title={'Delete Permanently'} $danger />
                                </Can>
                            </>
                        )}
                    </>
                ) : null}
                <DropdownItems />
            </DropdownMenu>
        </>
    );
};

export default memo(FileDropdownMenu, isEqual);
