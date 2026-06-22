import { differenceInHours, format, formatDistanceToNow } from 'date-fns';
import React, { memo } from 'react';
import { FileObject } from '@/api/server/files/loadDirectory';
import FileDropdownMenu from '@/components/server/files/FileDropdownMenu';
import { ServerContext } from '@/state/server';
import tw from 'twin.macro';
import isEqual from 'react-fast-compare';
import SelectFileCheckbox from '@/components/server/files/SelectFileCheckbox';
import FileIcon from '@/components/server/files/FileIcon';
import { usePermissions } from '@/plugins/usePermissions';
import { join } from 'pathe';
import { bytesToString } from '@/lib/formatters';
import modes from '@/modes';
import styles from './style.module.css';

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

const Clickable: React.FC<{ file: FileObject; onOpenFile?: (path: string, name: string) => void }> = memo(
    ({ file, children, onOpenFile }) => {
        const [canRead] = usePermissions(['file.read']);
        const [canReadContents] = usePermissions(['file.read-content']);
        const directory = ServerContext.useStoreState((state) => state.files.directory);
        const navigateBrowserTab = ServerContext.useStoreActions((a) => a.files.navigateBrowserTab);
        const openEditorTab = ServerContext.useStoreActions((a) => a.files.openEditorTab);

        const canClick = file.isFile ? file.isEditable() && canReadContents : canRead;

        if (!canClick) {
            return <div className={styles.details}>{children}</div>;
        }

        if (file.isFile && onOpenFile) {
            return (
                <div
                    className={styles.details}
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                        const mode = findModeByPath(join(directory, file.name));
                        openEditorTab({
                            path: join(directory, file.name),
                            name: file.name,
                            mode,
                        });
                    }}
                >
                    {children}
                </div>
            );
        }

        if (!file.isFile) {
            return (
                <div
                    className={styles.details}
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigateBrowserTab(join(directory, file.name))}
                >
                    {children}
                </div>
            );
        }

        return (
            <div className={styles.details}>
                {children}
            </div>
        );
    },
    isEqual,
);

const FileObjectRow = ({
    file,
    onOpenFile,
}: {
    file: FileObject;
    onOpenFile?: (path: string, name: string) => void;
}) => (
    <div
        className={styles.file_row}
        key={file.name}
        onContextMenu={(e) => {
            e.preventDefault();
            window.dispatchEvent(new CustomEvent('pterodactyl:files:ctx:close'));
            const x = e.clientX;
            setTimeout(() => {
                window.dispatchEvent(new CustomEvent(`pterodactyl:files:ctx:${file.key}`, { detail: x }));
            }, 0);
        }}
    >
        <SelectFileCheckbox name={file.name} />
        <Clickable file={file}>
            <div css={tw`flex-none ml-6 mr-4 pl-3 flex items-center`}>
                <FileIcon
                    name={file.name}
                    isFile={file.isFile}
                    isSymlink={file.isSymlink}
                    isArchive={file.isArchiveType()}
                    size={18}
                />
            </div>
            <div css={tw`flex-1 truncate`}>{file.name}</div>
            {file.isFile && <div css={tw`w-1/6 text-right mr-4 hidden sm:block`}>{bytesToString(file.size)}</div>}
            <div css={tw`w-1/5 text-right mr-4 hidden md:block`} title={file.modifiedAt.toString()}>
                {Math.abs(differenceInHours(file.modifiedAt, new Date())) > 48
                    ? format(file.modifiedAt, 'MMM do, yyyy h:mma')
                    : formatDistanceToNow(file.modifiedAt, { addSuffix: true })}
            </div>
        </Clickable>
        <FileDropdownMenu file={file} />
    </div>
);

export default memo(FileObjectRow, (prevProps, nextProps) => {
    /* eslint-disable @typescript-eslint/no-unused-vars */
    const { isArchiveType, isEditable, ...prevFile } = prevProps.file;
    const { isArchiveType: nextIsArchiveType, isEditable: nextIsEditable, ...nextFile } = nextProps.file;
    /* eslint-enable @typescript-eslint/no-unused-vars */

    return isEqual(prevFile, nextFile);
});
