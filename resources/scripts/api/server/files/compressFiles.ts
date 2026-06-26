import { FileObject } from '@/api/server/files/loadDirectory';
import http from '@/api/http';
import { rawDataToFileObject } from '@/api/transformers';

export default async (uuid: string, directory: string, files: string[], format?: string): Promise<FileObject> => {
    const payload: Record<string, unknown> = { root: directory, files };
    if (format) payload.format = format;

    const { data } = await http.post(
        `/api/client/servers/${uuid}/files/compress`,
        payload,
        {
            timeout: 60000,
            timeoutErrorMessage:
                'It looks like this archive is taking a long time to generate. It will appear once completed.',
        },
    );

    return rawDataToFileObject(data);
};
