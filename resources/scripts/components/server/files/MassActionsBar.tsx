import React, { useEffect, useState } from 'react';
import tw from 'twin.macro';
import { Button } from '@/components/elements/button/index';
import Fade from '@/components/elements/Fade';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import useFileManagerSwr from '@/plugins/useFileManagerSwr';
import useFlash from '@/plugins/useFlash';
import compressFiles from '@/api/server/files/compressFiles';
import { ServerContext } from '@/state/server';
import deleteFiles from '@/api/server/files/deleteFiles';
import renameFiles from '@/api/server/files/renameFiles';
import RenameFileModal from '@/components/server/files/RenameFileModal';
import Portal from '@/components/elements/Portal';
import { Dialog } from '@/components/elements/dialog';
import Select from '@/components/elements/Select';

const MassActionsBar = () => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);

    const { mutate } = useFileManagerSwr();
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const [loading, setLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [showConfirm, setShowConfirm] = useState(false);
    const [showMove, setShowMove] = useState(false);
    const [showCompressDialog, setShowCompressDialog] = useState(false);
    const [compressFormat, setCompressFormat] = useState('tar.gz');
    const directory = ServerContext.useStoreState((state) => state.files.directory);

    const selectedFiles = ServerContext.useStoreState((state) => state.files.selectedFiles);
    const setSelectedFiles = ServerContext.useStoreActions((actions) => actions.files.setSelectedFiles);

    useEffect(() => {
        if (!loading) setLoadingMessage('');
    }, [loading]);

    const onClickCompress = () => {
        setShowCompressDialog(true);
    };

    const doCompress = () => {
        setShowCompressDialog(false);
        setLoading(true);
        clearFlashes('files');
        setLoadingMessage('Archiving files...');

        compressFiles(uuid, directory, selectedFiles, compressFormat)
            .then(() => mutate())
            .then(() => setSelectedFiles([]))
            .catch((error) => clearAndAddHttpError({ key: 'files', error }))
            .then(() => setLoading(false));
    };

    const onClickMoveToTrash = () => {
        setLoading(true);
        setShowConfirm(false);
        clearFlashes('files');
        setLoadingMessage('Moving files to trash...');

        const root = '/';
        const moves = selectedFiles.map((file) => ({
            from: directory === '/' ? file : directory.replace(/^\//, '') + '/' + file,
            to: '.trash/' + file,
        }));

        renameFiles(uuid, root, moves)
            .then(() => {
                mutate((files) => files.filter((f) => selectedFiles.indexOf(f.name) < 0), false);
                setSelectedFiles([]);
            })
            .catch((error) => {
                mutate();
                clearAndAddHttpError({ key: 'files', error });
            })
            .then(() => setLoading(false));
    };

    const onClickDelete = () => {
        setShowConfirm(true);
    };

    const onClickConfirmDeletion = () => {
        setLoading(true);
        setShowConfirm(false);
        clearFlashes('files');
        setLoadingMessage('Deleting files...');

        deleteFiles(uuid, directory, selectedFiles)
            .then(() => {
                mutate((files) => files.filter((f) => selectedFiles.indexOf(f.name) < 0), false);
                setSelectedFiles([]);
            })
            .catch((error) => {
                mutate();
                clearAndAddHttpError({ key: 'files', error });
            })
            .then(() => setLoading(false));
    };

    return (
        <>
            <div css={tw`pointer-events-none fixed bottom-0 z-20 left-0 right-0 flex justify-center`}>
                <SpinnerOverlay visible={loading} size={'large'} fixed>
                    {loadingMessage}
                </SpinnerOverlay>
                <Dialog
                    open={showCompressDialog}
                    title={'Compress Files'}
                    onClose={() => setShowCompressDialog(false)}
                >
                    <p css={tw`text-sm text-neutral-300 mb-4`}>
                        Compress {selectedFiles.length} file(s) into an archive.
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
                        <Button onClick={doCompress}>Compress</Button>
                    </Dialog.Footer>
                </Dialog>
                <Dialog.Confirm
                    title={'Permanently Delete Files'}
                    open={showConfirm}
                    confirm={'Delete'}
                    onClose={() => setShowConfirm(false)}
                    onConfirmed={onClickConfirmDeletion}
                >
                    <p className={'mb-2'}>
                        Are you sure you want to permanently delete&nbsp;
                        <span className={'font-semibold text-gray-50'}>{selectedFiles.length} files</span>? This action
                        cannot be undone.
                    </p>
                    {selectedFiles.slice(0, 15).map((file) => (
                        <li key={file}>{file}</li>
                    ))}
                    {selectedFiles.length > 15 && <li>and {selectedFiles.length - 15} others</li>}
                </Dialog.Confirm>
                {showMove && (
                    <RenameFileModal
                        files={selectedFiles}
                        visible
                        appear
                        useMoveTerminology
                        onDismissed={() => setShowMove(false)}
                    />
                )}
                <Portal>
                    <div className={'pointer-events-none fixed bottom-0 mb-6 flex justify-center w-full z-50'}>
                        <Fade timeout={75} in={selectedFiles.length > 0} unmountOnExit>
                            <div css={tw`flex items-center space-x-4 pointer-events-auto rounded p-4 bg-black/50`}>
                                <Button onClick={() => setShowMove(true)}>Move</Button>
                                <Button onClick={onClickCompress}>Archive</Button>
                                <Button.Danger variant={Button.Variants.Secondary} onClick={onClickMoveToTrash}>
                                    Move to Trash
                                </Button.Danger>
                                <Button.Danger variant={Button.Variants.Secondary} onClick={onClickDelete}>
                                    Delete
                                </Button.Danger>
                            </div>
                        </Fade>
                    </div>
                </Portal>
            </div>
        </>
    );
};

export default MassActionsBar;
