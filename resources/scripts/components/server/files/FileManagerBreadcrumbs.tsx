import React, { useEffect, useState } from 'react';
import { ServerContext } from '@/state/server';
import tw from 'twin.macro';

interface Props {
    renderLeft?: JSX.Element;
    withinFileEditor?: boolean;
    isNewFile?: boolean;
}

export default ({ renderLeft, withinFileEditor, isNewFile }: Props) => {
    const [file, setFile] = useState<string | null>(null);
    const directory = ServerContext.useStoreState((state) => state.files.directory);
    const navigateBrowserTab = ServerContext.useStoreActions((a) => a.files.navigateBrowserTab);

    useEffect(() => {
        if (!withinFileEditor || isNewFile) {
            setFile(null);
            return;
        }

        const name = directory.split('/').pop() || null;
        setFile(name);
    }, [withinFileEditor, isNewFile, directory]);

    const breadcrumbs = (): { name: string; path?: string }[] =>
        directory
            .split('/')
            .filter((segment) => !!segment)
            .map((segment, index, segments) => {
                if (!withinFileEditor && index === segments.length - 1) {
                    return { name: segment };
                }

                return { name: segment, path: `/${segments.slice(0, index + 1).join('/')}` };
            });

    return (
        <div css={tw`flex flex-grow-0 items-center text-sm text-neutral-500 overflow-x-hidden`}>
            {renderLeft || <div css={tw`w-12`} />}/<span css={tw`px-1 text-neutral-300`}>home</span>/
            <span
                onClick={() => navigateBrowserTab('/')}
                css={tw`px-1 text-neutral-200 no-underline hover:text-neutral-100 cursor-pointer`}
            >
                container
            </span>
            /
            {breadcrumbs().map((crumb, index) =>
                crumb.path ? (
                    <React.Fragment key={index}>
                        <span
                            onClick={() => navigateBrowserTab(crumb.path!)}
                            css={tw`px-1 text-neutral-200 no-underline hover:text-neutral-100 cursor-pointer`}
                        >
                            {crumb.name}
                        </span>
                        /
                    </React.Fragment>
                ) : (
                    <span key={index} css={tw`px-1 text-neutral-300`}>
                        {crumb.name}
                    </span>
                ),
            )}
            {file && (
                <React.Fragment>
                    <span css={tw`px-1 text-neutral-300`}>{file}</span>
                </React.Fragment>
            )}
        </div>
    );
};
