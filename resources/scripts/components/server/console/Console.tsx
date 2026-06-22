import React, { useEffect, useRef, useState } from "react";
import { init, Terminal, FitAddon } from "ghostty-web";
import SpinnerOverlay from "@/components/elements/SpinnerOverlay";
import { ServerContext } from "@/state/server";
import { usePermissions } from "@/plugins/usePermissions";
import { usePersistedState } from "@/plugins/usePersistedState";
import { SocketEvent, SocketRequest } from "@/components/server/events";
import cn from "cnfast";
import { ChevronDoubleRightIcon } from "@heroicons/react/solid";

import CommandRow from "@blueprint/components/Server/Terminal/CommandRow";

import styles from "./style.module.css";

const TERMINAL_PRELUDE = "\u001b[1m\u001b[33mcontainer@pterodactyl~ \u001b[0m";

const THEME = {
    foreground: "#d0d0d0",
    background: "#131a20",
    cursor: "transparent",
    black: "#000000",
    red: "#E54B4B",
    green: "#9ECE58",
    yellow: "#FAED70",
    blue: "#396FE2",
    magenta: "#BB80B3",
    cyan: "#2DDAFD",
    white: "#d0d0d0",
    brightBlack: "rgba(255, 255, 255, 0.2)",
    brightRed: "#FF5370",
    brightGreen: "#C3E88D",
    brightYellow: "#FFCB6B",
    brightBlue: "#82AAFF",
    brightMagenta: "#C792EA",
    brightCyan: "#89DDFF",
    brightWhite: "#ffffff",
    selectionBackground: "#FAF089",
    selectionForeground: "#000000",
};

export default () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const termRef = useRef<Terminal | null>(null);
    const fitAddonRef = useRef<FitAddon | null>(null);
    const [isAtBottom, setAtBottom] = useState(true);
    const { connected, instance } = ServerContext.useStoreState(
        (state) => state.socket
    );
    const [canSendCommands] = usePermissions(["control.console"]);
    const serverId = ServerContext.useStoreState(
        (state) => state.server.data!.id
    );
    const isTransferring = ServerContext.useStoreState(
        (state) => state.server.data!.isTransferring
    );
    const [history, setHistory] = usePersistedState<string[]>(
        `${serverId}:command_history`,
        []
    );
    const [historyIndex, setHistoryIndex] = useState(-1);

    const write = (data: string) => termRef.current?.write(data);

    const handleConsoleOutput = (line: string, prelude = false) => {
        const text =
            (prelude ? TERMINAL_PRELUDE : "") +
            line.replace(/(?:\r\n|\r|\n)$/im, "") +
            "\u001b[0m";
        termRef.current?.writeln(text);
    };

    const handleDaemonErrorOutput = (line: string) =>
        termRef.current?.writeln(
            TERMINAL_PRELUDE +
                "\u001b[1m\u001b[41m" +
                line.replace(/(?:\r\n|\r|\n)$/im, "") +
                "\u001b[0m"
        );

    const handlePowerChangeEvent = (state: string) =>
        termRef.current?.writeln(
            TERMINAL_PRELUDE + "Server marked as " + state + "...\u001b[0m"
        );

    const handleTransferStatus = (status: string) => {
        switch (status) {
            case "failure":
                termRef.current?.writeln(
                    TERMINAL_PRELUDE + "Transfer has failed.\u001b[0m"
                );
        }
    };

    const handleCommandKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!history) return;
        if (e.key === "ArrowUp") {
            const newIndex = Math.min(historyIndex + 1, history.length - 1);
            setHistoryIndex(newIndex);
            e.currentTarget.value = history[newIndex] || "";
            e.preventDefault();
        }

        if (e.key === "ArrowDown") {
            const newIndex = Math.max(historyIndex - 1, -1);
            setHistoryIndex(newIndex);
            e.currentTarget.value = history[newIndex] || "";
        }

        const command = e.currentTarget.value;
        if (e.key === "Enter" && command.length > 0) {
            setHistory(
                (prevHistory) =>
                    prevHistory && [command, ...prevHistory].slice(0, 32)
            );
            setHistoryIndex(-1);
            if (instance) instance.send("send command", command);
            e.currentTarget.value = "";
        }
    };

    useEffect(() => {
        let term: Terminal | null = null;
        let fitAddon: FitAddon | null = null;

        init().then(() => {
            if (!containerRef.current) return;

            term = new Terminal({
                disableStdin: true,
                cursorStyle: "underline",
                allowTransparency: true,
                fontSize: 14,
                fontFamily:
                    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                theme: THEME,
                convertEol: true,
                smoothScrollDuration: 0,
            });

            fitAddon = new FitAddon();
            term.loadAddon(fitAddon);
            term.open(containerRef.current);
            fitAddon.fit();
            fitAddon.observeResize();

            // Disable ghostty-web's built-in canvas scrollbar overlay
            // so it doesn't occlude the last column of characters.
            // Scrolling via wheel/trackpad still works.
            term.showScrollbar = () => {};
            term.hideScrollbar();

            term.onScroll((viewportY) => {
                setAtBottom(viewportY === 0);
            });

            termRef.current = term;
            fitAddonRef.current = fitAddon;
        });

        return () => {
            term?.dispose();
        };
    }, []);

    useEffect(() => {
        if (!connected || !instance) return;

        if (!isTransferring) {
            write("\x1b[2J\x1b[H");
        }

        const listeners: Record<string, (s: string) => void> = {
            [SocketEvent.STATUS]: handlePowerChangeEvent,
            [SocketEvent.CONSOLE_OUTPUT]: handleConsoleOutput,
            [SocketEvent.INSTALL_OUTPUT]: handleConsoleOutput,
            [SocketEvent.TRANSFER_LOGS]: handleConsoleOutput,
            [SocketEvent.TRANSFER_STATUS]: handleTransferStatus,
            [SocketEvent.DAEMON_MESSAGE]: (line) =>
                handleConsoleOutput(line, true),
            [SocketEvent.DAEMON_ERROR]: handleDaemonErrorOutput,
        };

        Object.keys(listeners).forEach((key) => {
            instance.addListener(key, listeners[key]);
        });

        instance.send(SocketRequest.SEND_LOGS);

        return () => {
            Object.keys(listeners).forEach((key) => {
                instance.removeListener(key, listeners[key]);
            });
        };
    }, [connected, instance]);

    const scrollToBottom = () => {
        termRef.current?.scrollToBottom();
        setAtBottom(true);
    };

    return (
        <div className={cn(styles.terminal, "relative")}>
            <SpinnerOverlay visible={!connected} size={"large"} />
            <div
                className={cn(styles.container, styles.overflows_container, {
                    "rounded-b": !canSendCommands,
                })}
            >
                <div ref={containerRef} className="h-full w-full" />
                {!isAtBottom && (
                    <button
                        type="button"
                        onClick={scrollToBottom}
                        className={styles.scroll_btn}
                    >
                        <svg
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 384 512"
                            className="w-4 h-4"
                            fill="currentColor"
                        >
                            <path d="M374.6 310.6l-160 160C208.4 476.9 200.2 480 192 480s-16.38-3.125-22.62-9.375l-160-160c-12.5-12.5-12.5-32.75 0-45.25s32.75-12.5 45.25 0L160 370.8V64c0-17.69 14.33-31.1 31.1-31.1S224 46.31 224 64v306.8l105.4-105.4c12.5-12.5 32.75-12.5 45.25 0S387.1 298.1 374.6 310.6z" />
                        </svg>
                    </button>
                )}
            </div>
            {canSendCommands && (
                <div className={cn("relative", styles.overflows_container)}>
                    <input
                        className={cn("peer", styles.command_input)}
                        type={"text"}
                        placeholder={"Type a command..."}
                        aria-label={"Console command input."}
                        disabled={!instance || !connected}
                        onKeyDown={handleCommandKeyDown}
                        autoCorrect={"off"}
                        autoCapitalize={"none"}
                    />
                    <div
                        className={cn(
                            "text-gray-100 peer-focus:text-gray-50 peer-focus:animate-pulse",
                            styles.command_icon
                        )}
                    >
                        <ChevronDoubleRightIcon className={"w-4 h-4"} />
                    </div>
                    <CommandRow />
                </div>
            )}
        </div>
    );
};
