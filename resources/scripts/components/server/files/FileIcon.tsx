import React, { memo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileAlt, faFileImport } from '@fortawesome/free-solid-svg-icons';
import { fileExtensionIcons, fileNameIcons, fileFolderIcons } from '@/components/server/files/icon-mappings';

const ICON_BASE = '/icons/material/';

interface Props {
    name: string;
    isFile: boolean;
    isSymlink?: boolean;
    isArchive?: boolean;
    isExpanded?: boolean;
    size?: number;
}

const getFileIconName = (name: string): string | null => {
    const fileNameMatch = fileNameIcons[name];
    if (fileNameMatch) return fileNameMatch;

    const dot = name.lastIndexOf('.');
    if (dot > 0) {
        const ext = name.substring(dot + 1).toLowerCase();
        const extMatch = fileExtensionIcons[ext];
        if (extMatch) return extMatch;
    }

    return null;
};

const normalizeFolderName = (name: string): string => {
    let s = name.toLowerCase();
    while (s.startsWith('.') || s.startsWith('_')) s = s.slice(1);
    return s;
};

const getFolderIconName = (name: string): string | null => {
    const exact = fileFolderIcons[name.toLowerCase()];
    if (exact) return exact;

    const norm = normalizeFolderName(name);
    if (norm !== name.toLowerCase()) {
        const m = fileFolderIcons[norm];
        if (m) return m;
    }

    const deplural = norm.replace(/s$/, '');
    if (deplural !== norm && deplural.length > 2) {
        const m = fileFolderIcons[deplural];
        if (m) return m;
    }

    return null;
};

const MaterialImg: React.FC<{ iconName: string; size: number; fallback: string }> = memo(({ iconName, size, fallback }) => {
    const [current, setCurrent] = useState(iconName);
    const [failed, setFailed] = useState(false);

    if (failed) {
        return (
            <img
                src={`${ICON_BASE}${fallback}.svg`}
                width={size}
                height={size}
                alt=''
                style={{ display: 'block', flexShrink: 0 }}
            />
        );
    }

    return (
        <img
            src={`${ICON_BASE}${current}.svg`}
            width={size}
            height={size}
            alt=''
            style={{ display: 'block', flexShrink: 0 }}
            onError={() => {
                if (current !== fallback) {
                    setCurrent(fallback);
                } else {
                    setFailed(true);
                }
            }}
        />
    );
});

const FileIcon: React.FC<Props> = memo(({ name, isFile, isSymlink, isArchive, isExpanded, size = 16 }) => {
    if (!isFile) {
        const folderName = getFolderIconName(name);
        const iconName = folderName ? `folder-${folderName}${isExpanded ? '-open' : ''}` : isExpanded ? 'folder-open' : 'folder';
        const fallbackIcon = isExpanded ? 'folder-open' : 'folder';
        return <MaterialImg iconName={iconName} size={size} fallback={fallbackIcon} />;
    }

    if (isSymlink) {
        return <FontAwesomeIcon icon={faFileImport} style={{ fontSize: size - 2, color: '#a0aec0' }} />;
    }

    if (isArchive) {
        return <MaterialImg iconName='zip' size={size} fallback='file' />;
    }

    const iconName = getFileIconName(name);
    if (iconName) {
        return <MaterialImg iconName={iconName} size={size} fallback='file' />;
    }

    return <MaterialImg iconName='file' size={size} fallback='file' />;
});

export default FileIcon;
