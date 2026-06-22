import React, { createRef } from 'react';
import styled from 'styled-components/macro';
import tw from 'twin.macro';
import Fade from '@/components/elements/Fade';

interface Props {
    children: React.ReactNode;
    renderToggle: (onClick: (e: React.MouseEvent<any, MouseEvent>) => void) => React.ReactChild;
}

export const DropdownButtonRow = styled.button<{ danger?: boolean }>`
    ${tw`p-2 flex items-center rounded w-full text-neutral-300`};
    transition: 150ms all ease;

    &:hover {
        ${(props) => (props.danger ? tw`text-red-300 bg-red-900` : tw`text-neutral-100 bg-neutral-700`)};
    }
`;

interface State {
    posX: number;
    visible: boolean;
}

class DropdownMenu extends React.PureComponent<Props, State> {
    menu = createRef<HTMLDivElement>();
    isContext = false;
    listenerTimer: number | null = null;

    state: State = {
        posX: 0,
        visible: false,
    };

    componentWillUnmount() {
        this.removeListeners();
    }

    componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<State>) {
        const menu = this.menu.current;

        if (this.state.visible && !prevState.visible && menu) {
            menu.style.left = `${Math.round(this.state.posX - menu.clientWidth)}px`;
            this.listenerTimer = window.setTimeout(() => {
                document.addEventListener('click', this.windowListener);
                document.addEventListener('contextmenu', this.contextMenuListener);
            }, 0);
        }

        if (!this.state.visible && prevState.visible) {
            this.removeListeners();
        }
    }

    removeListeners = () => {
        if (this.listenerTimer !== null) {
            clearTimeout(this.listenerTimer);
            this.listenerTimer = null;
        }
        document.removeEventListener('click', this.windowListener);
        document.removeEventListener('contextmenu', this.contextMenuListener);
    };

    onClickHandler = (e: React.MouseEvent<any, MouseEvent>) => {
        e.preventDefault();
        if (!this.state.visible) {
            this.setState({ posX: e.clientX, visible: true });
        }
    };

    contextMenuListener = () => {
        if (this.isContext) {
            this.isContext = false;
            return;
        }
        this.setState({ visible: false });
    };

    windowListener = (e: MouseEvent) => {
        const menu = this.menu.current;

        if (e.button === 2 || !this.state.visible || !menu) {
            return;
        }

        if (e.target === menu || menu.contains(e.target as Node)) {
            return;
        }

        if (e.target !== menu && !menu.contains(e.target as Node)) {
            this.setState({ visible: false });
        }
    };

    close = () => {
        this.setState({ visible: false });
        this.removeListeners();
    };

    triggerMenu = (posX: number, fromContext = false) => {
        if (!this.state.visible) {
            this.isContext = fromContext;
            this.setState({ posX, visible: true });
        }
    };

    render() {
        return (
            <div>
                {this.props.renderToggle(this.onClickHandler)}
                <Fade timeout={150} in={this.state.visible} unmountOnExit>
                    <div
                        ref={this.menu}
                        onClick={(e) => {
                            e.stopPropagation();
                            this.setState({ visible: false });
                        }}
                        style={{ width: '12rem' }}
                        css={tw`absolute bg-neutral-800 p-2 rounded border border-neutral-700 shadow-lg text-neutral-200 z-50`}
                    >
                        {this.props.children}
                    </div>
                </Fade>
            </div>
        );
    }
}

export default DropdownMenu;
