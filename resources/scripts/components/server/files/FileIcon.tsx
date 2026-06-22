import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileAlt, faFileArchive, faFileImport, faFolder, faFolderOpen } from '@fortawesome/free-solid-svg-icons';
import { fileExtensionIcons, fileNameIcons } from '@/components/server/files/icon-mappings';

const ICON_BASE = '/icons/material/';

interface Props {
    name: string;
    isFile: boolean;
    isSymlink?: boolean;
    isArchive?: boolean;
    isExpanded?: boolean;
    size?: number;
}

const getIconName = (name: string): string | null => {
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

const MaterialImg: React.FC<{ iconName: string; size: number }> = ({ iconName, size }) => {
    const [failed, setFailed] = useState(false);

    if (failed) {
        return <FontAwesomeIcon icon={faFileAlt} style={{ fontSize: size - 2, color: '#a0aec0' }} />;
    }

    return (
        <img
            src={`${ICON_BASE}${iconName}.svg`}
            width={size}
            height={size}
            alt=''
            style={{ display: 'block', flexShrink: 0 }}
            onError={() => setFailed(true)}
        />
    );
};

const FileIcon: React.FC<Props> = ({ name, isFile, isSymlink, isArchive, isExpanded, size = 16 }) => {
    if (!isFile) {
        const iconName = isExpanded ? 'folder-open' : 'folder';
        return <MaterialImg iconName={iconName} size={size} />;
    }

    if (isSymlink) {
        return <FontAwesomeIcon icon={faFileImport} style={{ fontSize: size - 2, color: '#a0aec0' }} />;
    }

    if (isArchive) {
        return <MaterialImg iconName='zip' size={size} />;
    }

    const iconName = getIconName(name);
    if (iconName) {
        return <MaterialImg iconName={iconName} size={size} />;
    }

    return <FontAwesomeIcon icon={faFileAlt} style={{ fontSize: size - 2, color: '#a0aec0' }} />;
};

export default FileIcon;
