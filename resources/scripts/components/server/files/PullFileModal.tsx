import React, { useContext } from 'react';
import { Form, Formik, FormikHelpers } from 'formik';
import { object, string, boolean } from 'yup';
import Field from '@/components/elements/Field';
import Switch from '@/components/elements/Switch';
import { ServerContext } from '@/state/server';
import { Button } from '@/components/elements/button/index';
import { useFlashKey } from '@/plugins/useFlash';
import useFileManagerSwr from '@/plugins/useFileManagerSwr';
import pullFile from '@/api/server/files/pullFile';
import tw from 'twin.macro';
import FlashMessageRender from '@/components/FlashMessageRender';
import { Dialog, DialogWrapperContext } from '@/components/elements/dialog';
import asDialog from '@/hoc/asDialog';

interface Values {
    url: string;
    filename: string;
    useHeader: boolean;
    foreground: boolean;
}

const schema = object().shape({
    url: string().required('A valid URL is required.').url('Must be a valid URL.'),
    filename: string(),
    useHeader: boolean(),
    foreground: boolean(),
});

const PullFileDialog = asDialog({
    title: 'Pull File from URL',
})(() => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const directory = ServerContext.useStoreState((state) => state.files.directory);

    const { mutate } = useFileManagerSwr();
    const { close } = useContext(DialogWrapperContext);
    const { clearAndAddHttpError } = useFlashKey('files:pull-modal');

    const submit = ({ url, filename, useHeader, foreground }: Values, { setSubmitting }: FormikHelpers<Values>) => {
        pullFile(uuid, url, directory, {
            filename: filename || undefined,
            useHeader,
            foreground,
        })
            .then(() => mutate())
            .then(() => close())
            .catch((error) => {
                setSubmitting(false);
                clearAndAddHttpError(error);
            });
    };

    return (
        <Formik
            onSubmit={submit}
            validationSchema={schema}
            initialValues={{ url: '', filename: '', useHeader: false, foreground: false }}
        >
            {({ submitForm, values, setFieldValue, isSubmitting }) => (
                <>
                    <FlashMessageRender key={'files:pull-modal'} />
                    <Form css={tw`m-0`}>
                        <Field
                            autoFocus
                            id={'url'}
                            name={'url'}
                            label={'Remote URL'}
                            description={'URL of the file to download.'}
                        />
                        <Field
                            id={'filename'}
                            name={'filename'}
                            label={'Filename (optional)'}
                            description={'Leave empty to use the remote filename.'}
                        />
                        <div css={tw`mt-4`}>
                            <Switch
                                name={'use_header'}
                                label={'Use Headers'}
                                description={'Use the Content-Disposition header for the filename.'}
                                defaultChecked={values.useHeader}
                                onChange={() => setFieldValue('useHeader', !values.useHeader)}
                            />
                        </div>
                        <div css={tw`mt-4`}>
                            <Switch
                                name={'foreground'}
                                label={'Foreground Download'}
                                description={'Download in the foreground (waits for completion before responding).'}
                                defaultChecked={values.foreground}
                                onChange={() => setFieldValue('foreground', !values.foreground)}
                            />
                        </div>
                    </Form>
                    <Dialog.Footer>
                        <Button.Text className={'w-full sm:w-auto'} onClick={close}>
                            Cancel
                        </Button.Text>
                        <Button className={'w-full sm:w-auto'} onClick={submitForm} disabled={isSubmitting}>
                            Pull File
                        </Button>
                    </Dialog.Footer>
                </>
            )}
        </Formik>
    );
});

export default () => {
    const [open, setOpen] = React.useState(false);

    return (
        <>
            <PullFileDialog open={open} onClose={setOpen.bind(this, false)} />
            <Button.Text onClick={setOpen.bind(this, true)}>Pull File</Button.Text>
        </>
    );
};
