import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileAlt, faFileImport } from '@fortawesome/free-solid-svg-icons';
import { fileExtensionIcons, fileNameIcons } from '@/components/server/files/icon-mappings';

const ICON_BASE = '/icons/material/';

const folderIcons: Record<string, string> = {
    src: 'src',
    dist: 'dist',
    build: 'dist',
    out: 'dist',
    node_modules: 'node',
    components: 'components',
    ui: 'components',
    types: 'typescript',
    typescript: 'typescript',
    routes: 'routes',
    router: 'routes',
    public: 'public',
    assets: 'public',
    static: 'public',
    images: 'images',
    img: 'images',
    icons: 'images',
    docs: 'docs',
    doc: 'docs',
    documentation: 'docs',
    test: 'test',
    tests: 'test',
    __tests__: 'test',
    spec: 'test',
    specs: 'test',
    config: 'config',
    configuration: 'config',
    docker: 'docker',
    api: 'api',
    hooks: 'hook',
    utils: 'utils',
    util: 'utils',
    helpers: 'utils',
    lib: 'utils',
    styles: 'css',
    css: 'css',
    scss: 'css',
    sass: 'css',
    scripts: 'scripts',
    data: 'database',
    database: 'database',
    db: 'database',
    functions: 'functions',
    middleware: 'middleware',
    controllers: 'controller',
    controller: 'controller',
    models: 'class',
    model: 'class',
    migrations: 'migrations',
    seeds: 'seeders',
    seeders: 'seeders',
    layouts: 'layout',
    layout: 'layout',
    views: 'views',
    server: 'server',
    client: 'client',
    admin: 'admin',
    env: 'environment',
    environments: 'environment',
    '.github': 'github',
    github: 'github',
    '.gitlab': 'gitlab',
    gitlab: 'gitlab',
    '.vscode': 'vscode',
    vscode: 'vscode',
    '.idea': 'intellij',
    kubernetes: 'kubernetes',
    k8s: 'kubernetes',
    terraform: 'terraform',
    ansible: 'ansible',
    helm: 'helm',
    python: 'python',
    rust: 'rust',
    go: 'go',
    golang: 'go',
    java: 'java',
    kotlin: 'kotlin',
    php: 'php',
    ruby: 'ruby',
    node: 'node',
    audio: 'audio',
    music: 'audio',
    sound: 'audio',
    video: 'video',
    fonts: 'font',
    font: 'font',
    archive: 'archive',
    backups: 'backup',
    backup: 'backup',
    tools: 'tools',
    plugins: 'plugin',
    plugin: 'plugin',
    examples: 'examples',
    example: 'examples',
    templates: 'template',
    template: 'template',
    logs: 'log',
    log: 'log',
    temp: 'temp',
    tmp: 'temp',
    trash: 'trash',
    tasks: 'tasks',
    task: 'tasks',
    coverage: 'coverage',
    benchmarks: 'benchmark',
    benchmark: 'benchmark',
    constants: 'constant',
    constant: 'constant',
    errors: 'error',
    error: 'error',
    commands: 'command',
    command: 'command',
    providers: 'provider',
    provider: 'provider',
    guards: 'guard',
    guard: 'guard',
    interceptors: 'interceptor',
    interceptor: 'interceptor',
    pipes: 'pipe',
    pipe: 'pipe',
    decorators: 'decorators',
    decorator: 'decorators',
    directives: 'directive',
    directive: 'directive',
    filters: 'filter',
    filter: 'filter',
    forms: 'form',
    form: 'form',
    input: 'input',
    output: 'export',
    validators: 'validator',
    validator: 'validator',
    resources: 'resource',
    resource: 'resource',
    services: 'service',
    service: 'service',
    stores: 'store',
    store: 'store',
    redux: 'redux-store',
    context: 'context',
    react: 'react',
    angular: 'angular',
    vue: 'vue',
    svelte: 'svelte',
    next: 'next',
    nuxt: 'nuxt',
    astro: 'astro',
    analytics: 'analytics',
    graphql: 'graphql',
    email: 'mail',
    mails: 'mail',
    mobile: 'mobile',
    ios: 'ios',
    android: 'android',
    linux: 'linux',
    windows: 'windows',
    macos: 'macos',
    desktop: 'desktop',
    web: 'web',
    website: 'web',
    home: 'home',
    download: 'download',
    downloads: 'download',
    upload: 'upload',
    uploads: 'upload',
    shared: 'shared',
    common: 'shared',
    core: 'core',
    base: 'base',
    app: 'app',
    features: 'features',
    feature: 'features',
    modules: 'modules',
    module: 'modules',
    pages: 'pages',
    page: 'pages',
    screens: 'pages',
    configs: 'config',
    certificates: 'secure',
    certs: 'secure',
    security: 'secure',
    keys: 'keys',
    workflows: 'gh-workflows',
    'github/workflows': 'gh-workflows',
    actions: 'gh-workflows',
    'azure-pipelines': 'azure-pipelines',
    circleci: 'circleci',
    '.circleci': 'circleci',
    '.changeset': 'changesets',
    '.changesets': 'changesets',
    changesets: 'changesets',
    '.husky': 'husky',
    husky: 'husky',
    '.yarn': 'yarn',
    yarn: 'yarn',
    prisma: 'prisma',
    supabase: 'supabase',
    firebase: 'firebase',
    serverless: 'serverless',
    lambda: 'serverless',
    notifications: 'notification',
    notification: 'notification',
    prototypes: 'prototype',
    prototype: 'prototype',
    queue: 'queue',
    queues: 'queue',
    rules: 'rules',
    rule: 'rules',
    search: 'search',
    socket: 'socket',
    sockets: 'socket',
    subscription: 'subscription',
    subscriptions: 'subscription',
    theme: 'theme',
    themes: 'theme',
};

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

const getFolderIconName = (name: string): string | null => {
    const normalized = name.toLowerCase().replace(/^\./, '');
    const match = folderIcons[normalized];
    if (match) return match;

    if (name.startsWith('.')) {
        const base = name.slice(1).toLowerCase();
        const baseMatch = folderIcons[base];
        if (baseMatch) return baseMatch;
    }

    return null;
};

const MaterialImg: React.FC<{ iconName: string; size: number; fallback: string }> = ({ iconName, size, fallback }) => {
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
};

const FileIcon: React.FC<Props> = ({ name, isFile, isSymlink, isArchive, isExpanded, size = 16 }) => {
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
};

export default FileIcon;
