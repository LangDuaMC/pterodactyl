import React, { useEffect, useMemo, useState } from 'react';
import { Server } from '@/api/server/getServer';
import getServers, { PaginatedServerResponse } from '@/api/getServers';
import ServerRow, { DashboardLayout } from '@/components/dashboard/ServerRow';
import Spinner from '@/components/elements/Spinner';
import PageContentBlock from '@/components/elements/PageContentBlock';
import useFlash from '@/plugins/useFlash';
import { useStoreState } from 'easy-peasy';
import { usePersistedState } from '@/plugins/usePersistedState';
import tw from 'twin.macro';
import useSWR from 'swr';
import Pagination from '@/components/elements/Pagination';
import { useLocation } from 'react-router-dom';
import Select from '@/components/elements/Select';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTable, faThLarge } from '@fortawesome/free-solid-svg-icons';
import styled from 'styled-components/macro';

import BeforeContent from '@blueprint/components/Dashboard/Serverlist/BeforeContent';
import AfterContent from '@blueprint/components/Dashboard/Serverlist/AfterContent';

type DashboardView = 'accessible' | 'all' | `tenant:${number}`;

const Toolbar = styled.div`
    ${tw`mb-4 flex flex-wrap items-center gap-3`};
`;

const ToolbarBlock = styled.div`
    ${tw`flex items-center gap-2`};
`;

const ToolbarLabel = styled.p`
    ${tw`text-xs uppercase tracking-[0.2em] text-neutral-500`};
`;

const ScopeSelect = styled(Select)`
    ${tw`min-w-[13rem]`};
`;

const ToggleGroup = styled.div`
    ${tw`inline-flex rounded-lg bg-neutral-800/60 p-1`};
`;

const ToggleButton = styled.button<{ $active?: boolean }>`
    ${tw`inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-xs uppercase tracking-[0.2em] transition-colors duration-150`};
    ${(props) =>
        props.$active
            ? tw`bg-neutral-700 text-neutral-100`
            : tw`text-neutral-400 hover:bg-neutral-700 hover:text-neutral-100`};
`;

const ResultHeader = styled.div`
    ${tw`mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between`};
`;

const ServerGrid = styled.div`
    ${tw`grid gap-4 xl:grid-cols-2 2xl:grid-cols-3`};
`;

const EmptyState = styled.p`
    ${tw`rounded-lg border border-dashed border-neutral-700 bg-neutral-800/40 px-6 py-10 text-center text-sm text-neutral-400`};
`;

export default () => {
    const { search } = useLocation();
    const defaultPage = Number(new URLSearchParams(search).get('page') || '1');

    const [page, setPage] = useState(!isNaN(defaultPage) && defaultPage > 0 ? defaultPage : 1);
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const uuid = useStoreState((state) => state.user.data!.uuid);
    const rootAdmin = useStoreState((state) => state.user.data!.rootAdmin);
    const [scope, setScope] = usePersistedState<DashboardView>(`${uuid}:dashboard_scope`, rootAdmin ? 'all' : 'accessible');
    const [layout, setLayout] = usePersistedState<DashboardLayout>(`${uuid}:dashboard_layout`, 'table');
    const currentScope = !rootAdmin && scope === 'all' ? 'accessible' : scope ?? (rootAdmin ? 'all' : 'accessible');
    const currentLayout = layout ?? 'table';

    const { data: servers, error } = useSWR<PaginatedServerResponse>(
        ['/api/client/servers', currentScope, page],
        () => getServers({ page, scope: currentScope }),
    );

    useEffect(() => {
        if (!servers) return;

        if (servers.pagination.currentPage > 1 && !servers.items.length) {
            setPage(1);
        }
    }, [servers]);

    useEffect(() => {
        window.history.replaceState(null, document.title, `/${page <= 1 ? '' : `?page=${page}`}`);
    }, [page]);

    useEffect(() => {
        if (error) clearAndAddHttpError({ key: 'dashboard', error });
        if (!error) clearFlashes('dashboard');
    }, [error, clearAndAddHttpError, clearFlashes]);

    const scopeOptions = useMemo(() => {
        const options: Array<{ value: DashboardView; label: string }> = [{ value: 'accessible', label: 'My servers' }];

        if (rootAdmin) {
            options.unshift({ value: 'all', label: 'Everything' });
        }

        return options;
    }, [rootAdmin]);

    const handleLayoutChange = (nextLayout: DashboardLayout) => {
        setLayout(nextLayout);
    };

    const selectScope = (nextScope: DashboardView) => {
        setScope(nextScope);
        setPage(1);
    };

    return (
        <PageContentBlock title={'Dashboard'} showFlashKey={'dashboard'}>
            <BeforeContent />

            <Toolbar>
                <ToolbarBlock>
                    <ToolbarLabel>View</ToolbarLabel>
                    <ScopeSelect value={currentScope} onChange={(event) => selectScope(event.currentTarget.value as DashboardView)}>
                        {scopeOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                        {(servers?.tenantFilters || []).length > 0 && (
                            <option disabled value={'divider'}>
                                ──────────
                            </option>
                        )}
                        {(servers?.tenantFilters || []).map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </ScopeSelect>
                </ToolbarBlock>

                <ToolbarBlock>
                    <ToolbarLabel>Layout</ToolbarLabel>
                    <ToggleGroup>
                        <ToggleButton type={'button'} $active={currentLayout === 'table'} onClick={() => handleLayoutChange('table')} title={'Table view'} aria-label={'Table view'}>
                            <FontAwesomeIcon icon={faTable} />
                        </ToggleButton>
                        <ToggleButton type={'button'} $active={currentLayout === 'grid'} onClick={() => handleLayoutChange('grid')} title={'Card view'} aria-label={'Card view'}>
                            <FontAwesomeIcon icon={faThLarge} />
                        </ToggleButton>
                    </ToggleGroup>
                </ToolbarBlock>
            </Toolbar>

            {!servers ? (
                <Spinner centered size={'large'} />
            ) : (
                <Pagination data={servers} onPageSelect={setPage}>
                    {({ items }) => {
                        const total = servers.pagination.total;

                        return (
                            <>
                                <ResultHeader>
                                    <div>
                                        <h2 css={tw`text-base font-medium text-neutral-100`}>Server directory</h2>
                                        <p css={tw`text-sm text-neutral-400`}>
                                            {total} server{total === 1 ? '' : 's'} in this view.
                                        </p>
                                    </div>
                                </ResultHeader>

                                {items.length > 0 ? (
                                    currentLayout === 'grid' ? (
                                        <ServerGrid>
                                            {items.map((server) => (
                                                <ServerRow key={server.uuid} server={server} layout={'grid'} />
                                            ))}
                                        </ServerGrid>
                                    ) : (
                                        <div css={tw`space-y-2`}>
                                            {items.map((server) => (
                                                <ServerRow key={server.uuid} server={server} layout={'table'} />
                                            ))}
                                        </div>
                                    )
                                ) : (
                                    <EmptyState>
                                        {currentScope === 'all'
                                            ? 'There are no panel servers to display.'
                                            : 'There are no servers available with this filter.'}
                                    </EmptyState>
                                )}
                            </>
                        );
                    }}
                </Pagination>
            )}

            <AfterContent />
        </PageContentBlock>
    );
};
