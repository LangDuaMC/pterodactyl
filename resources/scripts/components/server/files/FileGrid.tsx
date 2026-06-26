import React, { memo } from 'react';
import { FileObject } from '@/api/server/files/loadDirectory';
import { ServerContext } from '@/state/server';
import { join } from 'pathe';
import tw from 'twin.macro';
import FileIcon from '@/components/server/files/FileIcon';
import { openContextMenu } from '@/components/server/files/ContextMenuHost';
import { bytesToString } from '@/lib/formatters';

interface Props {
    files: FileObject[];
    onOpenFile: (path: string, name: string) => void;
}

const FileGrid = memo(({ files, onOpenFile }: Props) => {
    const directory = ServerContext.useStoreState((state) => state.files.directory);
    const navigateBrowserTab = ServerContext.useStoreActions((a) => a.files.navigateBrowserTab);
    const openEditorTab = ServerContext.useStoreActions((a) => a.files.openEditorTab);

    return (
        <div css={tw`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 p-2`}>
            {files.map((file) => (
                <div
                    key={file.key}
                    css={tw`
                        flex flex-col items-center justify-center
                        bg-neutral-800 rounded-lg p-3 cursor-pointer
                        hover:bg-neutral-700 transition-colors
                        border border-transparent hover:border-neutral-600
                        min-h-[120px]
                    `}
                    onClick={() => {
                        if (file.isFile) {
                            onOpenFile(join(directory, file.name), file.name);
                        } else {
                            navigateBrowserTab(join(directory, file.name));
                        }
                    }}
                    onContextMenu={(e) => {
                        e.preventDefault();
                        openContextMenu(file, e.clientX, e.clientY);
                    }}
                >
                    <div css={tw`mb-2`}>
                        <FileIcon
                            name={file.name}
                            isFile={file.isFile}
                            isSymlink={file.isSymlink}
                            isArchive={file.isArchiveType()}
                            size={36}
                        />
                    </div>
                    <span css={tw`text-xs text-neutral-300 text-center truncate w-full block leading-tight`}>
                        {file.name}
                    </span>
                    {file.isFile && (
                        <span css={tw`text-xs text-neutral-500 mt-1`}>{bytesToString(file.size)}</span>
                    )}
                </div>
            ))}
        </div>
    );
});

export default FileGrid;
