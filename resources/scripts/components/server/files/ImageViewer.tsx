import React, { useEffect, useState } from 'react';
import getFileDownloadUrl from '@/api/server/files/getFileDownloadUrl';
import { ServerContext } from '@/state/server';
import Spinner from '@/components/elements/Spinner';
import tw from 'twin.macro';
import styled from 'styled-components/macro';

const ImageContainer = styled.div`
    ${tw`flex items-center justify-center bg-neutral-900 rounded p-4`};
    min-height: 400px;
    max-height: calc(100vh - 18rem);
    overflow: auto;
`;

const StyledImage = styled.img`
    ${tw`max-w-full rounded shadow-lg`};
    max-height: calc(100vh - 22rem);
    object-fit: contain;
`;

const InfoBar = styled.div`
    ${tw`flex items-center justify-between px-4 py-2 bg-neutral-800 rounded-b border-t border-neutral-700 text-sm text-neutral-400`};
`;

interface Props {
    path: string;
    name: string;
}

export default ({ path, name }: Props) => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const [url, setUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        getFileDownloadUrl(uuid, path)
            .then(setUrl)
            .catch((e) => setError(e.message || 'Failed to load image.'));
    }, [uuid, path]);

    if (error) {
        return (
            <div css={tw`text-center py-12`}>
                <p css={tw`text-red-400 text-sm`}>{error}</p>
            </div>
        );
    }

    if (!url) {
        return <Spinner size={'large'} centered />;
    }

    return (
        <div>
            <ImageContainer>
                <StyledImage src={url} alt={name} draggable={false} />
            </ImageContainer>
            <InfoBar>
                <span>{name}</span>
                <a
                    href={url}
                    target={'_blank'}
                    rel={'noopener noreferrer'}
                    css={tw`text-blue-400 hover:text-blue-300 underline`}
                >
                    Open in new tab
                </a>
            </InfoBar>
        </div>
    );
};
