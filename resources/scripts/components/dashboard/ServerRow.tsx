import React, { memo, useCallback, useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEthernet, faHdd, faMemory, faMicrochip, faServer } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import { Server } from '@/api/server/getServer';
import getServerResourceUsage, { ServerPowerState, ServerStats } from '@/api/server/getServerResourceUsage';
import { bytesToString, ip, mbToBytes } from '@/lib/formatters';
import tw from 'twin.macro';
import GreyRowBox from '@/components/elements/GreyRowBox';
import styled, { css } from 'styled-components/macro';
import isEqual from 'react-fast-compare';

import BeforeEntryName from '@blueprint/components/Dashboard/Serverlist/ServerRow/BeforeEntryName';
import AfterEntryName from '@blueprint/components/Dashboard/Serverlist/ServerRow/AfterEntryName';
import BeforeEntryDescription from '@blueprint/components/Dashboard/Serverlist/ServerRow/BeforeEntryDescription';
import AfterEntryDescription from '@blueprint/components/Dashboard/Serverlist/ServerRow/AfterEntryDescription';
import ResourceLimits from '@blueprint/components/Dashboard/Serverlist/ServerRow/ResourceLimits';

export type DashboardLayout = 'grid' | 'table';

const isAlarmState = (current: number, limit: number): boolean => limit > 0 && current / (limit * 1024 * 1024) >= 0.9;

const Icon = memo(
    styled(FontAwesomeIcon)<{ $alarm: boolean }>`
        ${(props) => (props.$alarm ? tw`text-red-400` : tw`text-neutral-500`)};
    `,
    isEqual,
);

const IconDescription = styled.p<{ $alarm: boolean }>`
    ${tw`text-sm ml-2`};
    ${(props) => (props.$alarm ? tw`text-white` : tw`text-neutral-400`)};
`;

const StateDot = styled.span<{ $status: ServerPowerState | undefined }>`
    ${tw`inline-block h-2.5 w-2.5 rounded-full`};

    ${({ $status }) =>
        !$status || $status === 'offline'
            ? tw`bg-red-400`
            : $status === 'running'
              ? tw`bg-green-400`
              : tw`bg-yellow-400`};
`;

const StateText = styled.span`
    ${tw`text-xs uppercase tracking-[0.2em] text-neutral-300`};
`;

const TableIcon = styled.div`
    ${tw`flex h-9 w-9 items-center justify-center rounded-md text-neutral-500`};
`;

const GridCard = styled(GreyRowBox)<{ $status: ServerPowerState | undefined }>`
    ${tw`flex-col items-stretch gap-4 rounded-lg p-5 transition-transform duration-150 hover:-translate-y-0.5`};
    box-shadow: inset 4px 0 0 rgb(248 113 113 / 0.95);

    ${({ $status }) =>
        !$status || $status === 'offline'
            ? css`box-shadow: inset 4px 0 0 rgb(248 113 113 / 0.95);`
            : $status === 'running'
              ? css`box-shadow: inset 4px 0 0 rgb(74 222 128 / 0.95);`
              : css`box-shadow: inset 4px 0 0 rgb(250 204 21 / 0.95);`};
`;

const TableRow = styled(GreyRowBox)<{ $status: ServerPowerState | undefined }>`
    ${tw`grid grid-cols-12 gap-4 items-center rounded-lg px-4 py-4`};
    box-shadow: inset 4px 0 0 rgb(248 113 113 / 0.95);

    ${({ $status }) =>
        !$status || $status === 'offline'
            ? css`box-shadow: inset 4px 0 0 rgb(248 113 113 / 0.95);`
            : $status === 'running'
              ? css`box-shadow: inset 4px 0 0 rgb(74 222 128 / 0.95);`
              : css`box-shadow: inset 4px 0 0 rgb(250 204 21 / 0.95);`};
`;

const MetricLabel = styled.p`
    ${tw`text-[11px] uppercase tracking-wide text-neutral-500`};
`;

const MetricValue = styled.p<{ $alarm: boolean }>`
    ${tw`text-sm font-medium`};
    ${(props) => (props.$alarm ? tw`text-red-100` : tw`text-neutral-200`)};
`;

const getStatusCopy = (server: Server, stats: ServerStats | null): string => {
    if (!stats || server.isNodeUnderMaintenance) {
        if (server.isNodeUnderMaintenance) return 'Under Maintenance';
        if (server.isTransferring) return 'Transferring';
        if (server.status === 'installing') return 'Installing';
        if (server.status === 'restoring_backup') return 'Restoring Backup';
        if (server.status === 'suspended') return 'Suspended';
        return 'Unavailable';
    }

    return stats.status;
};

const getDefaultAllocation = (server: Server) => server.allocations.find((allocation) => allocation.isDefault) ?? null;

const getDefaultAddress = (server: Server): string => {
    const allocation = getDefaultAllocation(server);

    if (!allocation) {
        return server.connection || 'No default port';
    }

    return `${allocation.alias || ip(allocation.ip)}:${allocation.port}`;
};

const ServerMetrics = ({
    cpuAlarm,
    memoryAlarm,
    diskAlarm,
    cpuLimit,
    diskLimit,
    memoryLimit,
    stats,
}: {
    cpuAlarm: boolean;
    memoryAlarm: boolean;
    diskAlarm: boolean;
    cpuLimit: string;
    diskLimit: string;
    memoryLimit: string;
    stats: ServerStats;
}) => (
    <div css={tw`grid grid-cols-3 gap-3`}>
        <div>
            <MetricLabel>CPU</MetricLabel>
            <MetricValue $alarm={cpuAlarm}>{stats.cpuUsagePercent.toFixed(2)}%</MetricValue>
            <p css={tw`text-xs text-neutral-600`}>of {cpuLimit}</p>
        </div>
        <div>
            <MetricLabel>Memory</MetricLabel>
            <MetricValue $alarm={memoryAlarm}>{bytesToString(stats.memoryUsageInBytes)}</MetricValue>
            <p css={tw`text-xs text-neutral-600`}>of {memoryLimit}</p>
        </div>
        <div>
            <MetricLabel>Disk</MetricLabel>
            <MetricValue $alarm={diskAlarm}>{bytesToString(stats.diskUsageInBytes)}</MetricValue>
            <p css={tw`text-xs text-neutral-600`}>of {diskLimit}</p>
        </div>
    </div>
);

type Props = {
    server: Server;
    layout: DashboardLayout;
    className?: string;
};

export default ({ server, layout, className }: Props) => {
    const [isSuspended, setIsSuspended] = useState(server.status === 'suspended');
    const [stats, setStats] = useState<ServerStats | null>(null);

    const getStats = useCallback(
        () =>
            getServerResourceUsage(server.uuid)
                .then((data) => setStats(data))
                .catch((error) => console.error(error)),
        [server.uuid],
    );

    useEffect(() => {
        setIsSuspended(stats?.isSuspended || server.status === 'suspended');
    }, [stats?.isSuspended, server.status]);

    useEffect(() => {
        if (isSuspended || server.isNodeUnderMaintenance) return;

        let interval: ReturnType<typeof setInterval> | undefined;

        getStats().then(() => {
            interval = setInterval(() => getStats(), 30000);
        });

        return () => {
            if (interval) {
                clearInterval(interval);
            }
        };
    }, [getStats, isSuspended, server.isNodeUnderMaintenance]);

    const alarms = { cpu: false, memory: false, disk: false };
    if (stats) {
        alarms.cpu = server.limits.cpu !== 0 && stats.cpuUsagePercent >= server.limits.cpu * 0.9;
        alarms.memory = isAlarmState(stats.memoryUsageInBytes, server.limits.memory);
        alarms.disk = server.limits.disk !== 0 && isAlarmState(stats.diskUsageInBytes, server.limits.disk);
    }

    const diskLimit = server.limits.disk !== 0 ? bytesToString(mbToBytes(server.limits.disk)) : 'Unlimited';
    const memoryLimit = server.limits.memory !== 0 ? bytesToString(mbToBytes(server.limits.memory)) : 'Unlimited';
    const cpuLimit = server.limits.cpu !== 0 ? server.limits.cpu + ' %' : 'Unlimited';
    const status = getStatusCopy(server, stats);
    const defaultAddress = getDefaultAddress(server);
    if (layout === 'grid') {
        return (
            <GridCard as={Link} to={`/server/${server.id}`} className={className} $status={stats?.status}>
                <div css={tw`flex items-start justify-between gap-4`}>
                    <div>
                        <BeforeEntryName />
                        <p css={tw`text-lg font-medium break-words text-neutral-100`}>{server.name}</p>
                        <AfterEntryName />
                    </div>
                    <div css={tw`flex items-center gap-2 text-right`}>
                        <StateDot $status={stats?.status} />
                        <StateText>{status}</StateText>
                    </div>
                </div>

                {server.description && (
                    <div>
                        <BeforeEntryDescription />
                        <p className={'text-sm text-neutral-300 break-words line-clamp-3'}>{server.description}</p>
                        <AfterEntryDescription />
                    </div>
                )}

                <div css={tw`grid grid-cols-1 gap-3 text-sm text-neutral-300 sm:grid-cols-2`}>
                    <div>
                        <p css={tw`text-[11px] uppercase tracking-wide text-neutral-500`}>Node</p>
                        <p>{server.node}</p>
                    </div>
                    <div>
                        <p css={tw`text-[11px] uppercase tracking-wide text-neutral-500`}>Address</p>
                        <p>{defaultAddress}</p>
                    </div>
                </div>

                {!stats || isSuspended || server.isNodeUnderMaintenance ? (
                    <div css={tw`flex items-center gap-3 rounded-md border border-neutral-600 bg-neutral-800/40 px-4 py-3`}>
                        <StateDot $status={stats?.status} />
                        <span css={tw`text-sm text-neutral-300`}>{status}</span>
                    </div>
                ) : (
                    <ServerMetrics
                        cpuAlarm={alarms.cpu}
                        diskAlarm={alarms.disk}
                        memoryAlarm={alarms.memory}
                        cpuLimit={cpuLimit}
                        diskLimit={diskLimit}
                        memoryLimit={memoryLimit}
                        stats={stats}
                    />
                )}

            </GridCard>
        );
    }

    return (
        <TableRow as={Link} to={`/server/${server.id}`} className={className} $status={stats?.status}>
            <div css={tw`col-span-12 sm:col-span-5 lg:col-span-5 flex items-center gap-4`}>
                <TableIcon>
                    <FontAwesomeIcon icon={faServer} />
                </TableIcon>
                <div css={tw`min-w-0`}>
                    <BeforeEntryName />
                    <p css={tw`text-base font-medium break-words text-neutral-100`}>{server.name}</p>
                    <div css={tw`mt-1 flex items-center gap-2`}>
                        <StateDot $status={stats?.status} />
                        <StateText>{status}</StateText>
                    </div>
                    <AfterEntryName />
                    {!!server.description && (
                        <div>
                            <BeforeEntryDescription />
                            <p className={'text-sm text-neutral-300 break-words line-clamp-2'}>{server.description}</p>
                            <AfterEntryDescription />
                        </div>
                    )}
                </div>
            </div>

            <div css={tw`hidden lg:flex lg:col-span-2 items-center justify-center gap-2`}>
                <FontAwesomeIcon icon={faEthernet} css={tw`text-neutral-500`} />
                <p css={tw`text-sm text-neutral-400 break-words text-center`}>{defaultAddress}</p>
            </div>

            <div css={tw`hidden sm:flex col-span-7 lg:col-span-5 items-center justify-end gap-4`}>
                {!stats || isSuspended || server.isNodeUnderMaintenance ? (
                    <div css={tw`flex-1 text-right`}>
                        <div css={tw`inline-flex items-center gap-2`}>
                            <StateDot $status={stats?.status} />
                            <span css={tw`text-xs uppercase tracking-[0.2em] text-neutral-300`}>{status}</span>
                        </div>
                    </div>
                ) : (
                    <>
                        <div css={tw`flex-1 ml-4 hidden sm:block`}>
                            <div css={tw`flex justify-center`}>
                                <Icon icon={faMicrochip} $alarm={alarms.cpu} />
                                <IconDescription $alarm={alarms.cpu}>{stats.cpuUsagePercent.toFixed(2)} %</IconDescription>
                            </div>
                            <p css={tw`text-xs text-neutral-600 text-center mt-1`}>of {cpuLimit}</p>
                        </div>
                        <div css={tw`flex-1 ml-4 hidden sm:block`}>
                            <div css={tw`flex justify-center`}>
                                <Icon icon={faMemory} $alarm={alarms.memory} />
                                <IconDescription $alarm={alarms.memory}>{bytesToString(stats.memoryUsageInBytes)}</IconDescription>
                            </div>
                            <p css={tw`text-xs text-neutral-600 text-center mt-1`}>of {memoryLimit}</p>
                        </div>
                        <div css={tw`flex-1 ml-4 hidden sm:block`}>
                            <div css={tw`flex justify-center`}>
                                <Icon icon={faHdd} $alarm={alarms.disk} />
                                <IconDescription $alarm={alarms.disk}>{bytesToString(stats.diskUsageInBytes)}</IconDescription>
                            </div>
                            <p css={tw`text-xs text-neutral-600 text-center mt-1`}>of {diskLimit}</p>
                        </div>
                        <ResourceLimits />
                    </>
                )}
            </div>

        </TableRow>
    );
};
