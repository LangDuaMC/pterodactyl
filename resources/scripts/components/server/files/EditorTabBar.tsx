import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { ServerContext } from '@/state/server';
import { encodePathSegments } from '@/helpers';
import tw from 'twin.macro';
import styled from 'styled-components/macro';

const TabBarContainer = styled.div`
    ${tw`flex items-stretch bg-neutral-800 rounded-t overflow-x-auto overflow-y-hidden`}
    min-height: 32px;
    max-height: 32px;

    &::-webkit-scrollbar {
        height: 3px;
    }
`;

const Tab = styled.div<{ active: boolean }>`
    ${tw`flex items-center gap-1.5 px-3 text-xs cursor-pointer border-r border-neutral-700 whitespace-nowrap select-none flex-shrink-0`}
    min-width: 0;
    ${({ active }) =>
        active
            ? tw`bg-neutral-700 text-neutral-100 border-b-2 border-b-blue-400`
            : tw`bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200`}
`;

const CloseButton = styled.span`
    ${tw`ml-1 p-0.5 rounded hover:bg-neutral-600 text-neutral-500 hover:text-neutral-200 leading-none`}
`;

const EditorTabBar: React.FC = () => {
    const tabs = ServerContext.useStoreState((s) => s.files.editorTabs);
    const activeTab = ServerContext.useStoreState((s) => s.files.activeTab);
    const closeTab = ServerContext.useStoreActions((a) => a.files.closeEditorTab);
    const setActiveTab = ServerContext.useStoreActions((a) => a.files.setActiveTab);
    const id = ServerContext.useStoreState((s) => s.server.data!.id);

    if (tabs.length === 0) return null;

    return (
        <TabBarContainer>
            {tabs.map((tab) => (
                <Tab
                    key={tab.path}
                    active={activeTab === tab.path}
                    onClick={() => {
                        setActiveTab(tab.path);
                    }}
                >
                    <span css={tw`truncate`} style={{ maxWidth: '8rem' }}>
                        {tab.name}
                    </span>
                    <CloseButton
                        onClick={(e) => {
                            e.stopPropagation();
                            closeTab(tab.path);
                        }}
                    >
                        <FontAwesomeIcon icon={faTimes} size='xs' />
                    </CloseButton>
                </Tab>
            ))}
        </TabBarContainer>
    );
};

export default EditorTabBar;
