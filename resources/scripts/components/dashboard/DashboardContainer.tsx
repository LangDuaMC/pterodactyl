import React, { useEffect, useState } from 'react';
import { Server } from '@/api/server/getServer';
import getServers from '@/api/getServers';
import ServerRow from '@/components/dashboard/ServerRow';
import Spinner from '@/components/elements/Spinner';
import PageContentBlock from '@/components/elements/PageContentBlock';
import useFlash from '@/plugins/useFlash';
import { useStoreState } from 'easy-peasy';
import { usePersistedState } from '@/plugins/usePersistedState';
import Switch from '@/components/elements/Switch';
import tw from 'twin.macro';
import useSWR from 'swr';
import { PaginatedResult } from '@/api/http';
import Pagination from '@/components/elements/Pagination';
import { useLocation } from 'react-router-dom';
import Select from '@/components/elements/Select';
import GreyRowBox from '@/components/elements/GreyRowBox';
import styled from 'styled-components/macro';

import BeforeContent from '@blueprint/components/Dashboard/Serverlist/BeforeContent';
import AfterContent from '@blueprint/components/Dashboard/Serverlist/AfterContent';

type TenantFilter = 'all' | 'personal' | `tenant:${number}`;

interface TenantGroup {
    key: TenantFilter;
    name: string;
    description: string | null;
    servers: Server[];
}

const GroupBox = styled(GreyRowBox)`
    padding: 1rem;
`;

const groupServers = (items: Server[]): TenantGroup[] => {
    const groups = new Map<TenantFilter, TenantGroup>();

    for (const server of items) {
        const tenantId = server.tenantId ?? server.tenant?.id ?? null;
        const key: TenantFilter = tenantId !== null ? (`tenant:${tenantId}` as TenantFilter) : 'personal';

        if (!groups.has(key)) {
            groups.set(key, {
                key,
                name: server.tenant?.name ?? 'Personal Servers',
                description: server.tenant?.description ?? null,
                servers: [],
            });
        }

        groups.get(key)!.servers.push(server);
    }

    return Array.from(groups.values()).sort((left, right) => {
        if (left.key === 'personal') return -1;
        if (right.key === 'personal') return 1;

        return left.name.localeCompare(right.name);
    });
};

export default () => {
    const { search } = useLocation();
    const defaultPage = Number(new URLSearchParams(search).get('page') || '1');

    const [page, setPage] = useState(!isNaN(defaultPage) && defaultPage > 0 ? defaultPage : 1);
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const uuid = useStoreState((state) => state.user.data!.uuid);
    const rootAdmin = useStoreState((state) => state.user.data!.rootAdmin);
    const [showOnlyAdmin, setShowOnlyAdmin] = usePersistedState(`${uuid}:show_all_servers`, false);
    const [tenantFilter, setTenantFilter] = usePersistedState<TenantFilter>(`${uuid}:dashboard_tenant_filter`, 'all');

    const { data: servers, error } = useSWR<PaginatedResult<Server>>(
        ['/api/client/servers', showOnlyAdmin && rootAdmin, page],
        () => getServers({ page, type: showOnlyAdmin && rootAdmin ? 'admin' : undefined }),
    );

    const serverGroups = groupServers(servers?.items || []);
    const tenantOptions = serverGroups.filter((group) => group.key !== 'personal' || group.servers.length > 0);
    const filteredTenantGroups = tenantFilter === 'all' ? serverGroups : serverGroups.filter((group) => group.key === tenantFilter);

    useEffect(() => {
        if (typeof showOnlyAdmin !== 'undefined') {
            setPage(1);
        }
    }, [showOnlyAdmin]);

    useEffect(() => {
        if (!servers) return;
        if (servers.pagination.currentPage > 1 && !servers.items.length) {
            setPage(1);
        }
    }, [servers]);

    useEffect(() => {
        // Don't use react-router to handle changing this part of the URL, otherwise it
        // triggers a needless re-render. We just want to track this in the URL incase the
        // user refreshes the page.
        window.history.replaceState(null, document.title, `/${page <= 1 ? '' : `?page=${page}`}`);
    }, [page]);

    useEffect(() => {
        if (error) clearAndAddHttpError({ key: 'dashboard', error });
        if (!error) clearFlashes('dashboard');
    }, [error, clearAndAddHttpError, clearFlashes]);

    return (
        <PageContentBlock title={'Dashboard'} showFlashKey={'dashboard'}>
            <BeforeContent />
            {rootAdmin && (
                <div css={tw`mb-2 flex justify-end items-center`}>
                    <p css={tw`uppercase text-xs text-neutral-400 mr-2`}>
                        {showOnlyAdmin ? "Showing others' servers" : 'Showing your servers'}
                    </p>
                    <Switch
                        name={'show_all_servers'}
                        defaultChecked={showOnlyAdmin}
                        onChange={() => setShowOnlyAdmin((s) => !s)}
                    />
                </div>
            )}
            <div css={tw`mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between`}>
                <div>
                    <p css={tw`uppercase text-xs text-neutral-400 mb-1`}>Tenant view</p>
                    <Select value={tenantFilter} onChange={(event) => setTenantFilter(event.currentTarget.value as TenantFilter)}>
                        <option value={'all'}>All servers</option>
                        <option value={'personal'}>Personal servers</option>
                        {tenantOptions
                            .filter((group) => group.key !== 'personal')
                            .map((group) => (
                                <option key={group.key} value={group.key}>
                                    {group.name}
                                </option>
                            ))}
                    </Select>
                </div>
                {tenantFilter !== 'all' && (
                    <p css={tw`text-xs text-neutral-400`}>Filtered to a single tenant group on this page.</p>
                )}
            </div>
            {!servers ? (
                <Spinner centered size={'large'} />
            ) : (
                <Pagination data={servers} onPageSelect={setPage}>
                    {({ items }) => {
                        const groups = filteredTenantGroups.length > 0 ? filteredTenantGroups : groupServers(items);

                        return groups.length > 0 ? (
                            groups.map((group) => (
                                <GroupBox key={group.key} css={group.key !== groups[0].key ? tw`mt-4` : undefined}>
                                    <div css={tw`flex items-start justify-between gap-4 mb-4`}>
                                        <div>
                                            <h2 css={tw`text-lg font-medium text-neutral-100`}>{group.name}</h2>
                                            {group.description && (
                                                <p css={tw`text-sm text-neutral-400 mt-1`}>{group.description}</p>
                                            )}
                                        </div>
                                        <p css={tw`text-xs uppercase tracking-wide text-neutral-500`}>{group.servers.length} servers</p>
                                    </div>
                                    <div>
                                        {group.servers.map((server, index) => (
                                            <ServerRow
                                                key={server.uuid}
                                                server={server}
                                                css={index > 0 ? tw`mt-2` : undefined}
                                            />
                                        ))}
                                    </div>
                                </GroupBox>
                            ))
                        ) : (
                            <p css={tw`text-center text-sm text-neutral-400`}>
                                {showOnlyAdmin
                                    ? 'There are no other servers to display.'
                                    : 'There are no servers associated with your account.'}
                            </p>
                        );
                    }}
                </Pagination>
            )}
            <AfterContent />
        </PageContentBlock>
    );
};
