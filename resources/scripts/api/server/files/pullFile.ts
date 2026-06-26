import http from '@/api/http';

export default (uuid: string, url: string, directory: string, params?: { filename?: string; useHeader?: boolean; foreground?: boolean }): Promise<void> => {
    return new Promise((resolve, reject) => {
        http.post(`/api/client/servers/${uuid}/files/pull`, {
            url,
            directory,
            ...(params?.filename ? { filename: params.filename } : {}),
            ...(params?.useHeader !== undefined ? { use_header: params.useHeader } : {}),
            ...(params?.foreground !== undefined ? { foreground: params.foreground } : {}),
        })
            .then(() => resolve())
            .catch(reject);
    });
};
