import { rawDataToServerObject, Server } from '@/api/server/getServer';
import http, { getPaginationSet, PaginatedResult } from '@/api/http';

interface QueryParams {
    query?: string;
    page?: number;
    type?: string;
    scope?: string;
}

export interface ServerTenantFilter {
    value: `tenant:${number}`;
    label: string;
}

export interface PaginatedServerResponse extends PaginatedResult<Server> {
    tenantFilters: ServerTenantFilter[];
}

export default ({ query, ...params }: QueryParams): Promise<PaginatedServerResponse> => {
    return new Promise((resolve, reject) => {
        http.get('/api/client', {
            params: {
                'filter[q]': query,
                ...params,
            },
        })
            .then(({ data }) =>
                resolve({
                    items: (data.data || []).map((datum: any) => rawDataToServerObject(datum)),
                    pagination: getPaginationSet(data.meta.pagination),
                    tenantFilters: data.meta?.tenant_filters || [],
                }),
            )
            .catch(reject);
    });
};
