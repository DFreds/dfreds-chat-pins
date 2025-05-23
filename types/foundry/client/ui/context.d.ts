export {};

declare global {
    /**
     * @param element   The containing HTML element within which the menu is positioned
     * @param selector  A CSS selector which activates the context menu.
     * @param menuItems An Array of entries to display in the menu
     * @param [options] Additional options to configure the context menu.
     * @param [options.eventName="contextmenu"] Optionally override the triggering event which can spawn the menu
     * @param [options.onOpen]                  A function to call when the context menu is opened.
     * @param [options.onClose]                 A function to call when the context menu is closed.
     */
    class ContextMenu {
        constructor(
            element: HTMLElement | JQuery,
            selector: string,
            menuItems: ContextMenuEntry[],
            {
                eventName,
                onOpen,
                onClose,
            }?: {
                eventName?: string;
                onOpen?: ContextMenuCallback;
                onClose?: ContextMenuCallback;
            },
        );

        /** The target HTMLElement being selected */
        element: HTMLElement;

        /** The target CSS selector which activates the menu */
        selector: string;

        /** An interaction event name which activates the menu */
        eventName: string;

        /** The array of menu items being rendered */
        menuItems: ContextMenuEntry[];

        /** Track which direction the menu is expanded in */
        protected _expandUp: boolean;

        /** A convenience accessor to the context menu HTML object */
        get menu(): JQuery;

        /**
         * Create a ContextMenu for this Application and dispatch hooks.
         * @param app       The Application this ContextMenu belongs to.
         * @param html      The Application's rendered HTML.
         * @param selector  The target CSS selector which activates the menu.
         * @param menuItems The array of menu items being rendered.
         * @param [options] Additional options to configure context menu initialization.
         * @param [options.hookName="EntryContext"]  The name of the hook to call.
         */
        static create(
            app: Application,
            html: JQuery,
            selector: string,
            menuItems: ContextMenuEntry[],
            options?: { eventName?: string; hookName?: string },
        ): ContextMenu | void;

        /** Attach a ContextMenu instance to an HTML selector */
        bind(): void;

        /**
         * Closes the menu and removes it from the DOM.
         * @param [options]              Options to configure the closing behavior.
         * @param [options.animate=true] Animate the context menu closing.
         */
        close(options?: { animate?: boolean }): Promise<void>;

        protected _close(): void;

        protected _animateOpen(menu: JQuery): Promise<void>;

        protected _animateClose(menu: JQuery): Promise<void>;

        /**
         * Render the Context Menu by iterating over the menuItems it contains
         * Check the visibility of each menu item, and only render ones which are allowed by the item's logical condition
         * Attach a click handler to each item which is rendered
         */
        render(target: JQuery): Promise<void>;

        /**
         * Set the position of the context menu, taking into consideration whether the menu should expand upward or downward
         */
        protected _setPosition(html: JQuery, target: JQuery): void;

        /** Local listeners which apply to each ContextMenu instance which is created. */
        activateListeners(html: JQuery): void;

        /** Global listeners which apply once only to the document. */
        static eventListeners(): void;
    }

    /** The element that the context menu has been triggered for. */
    type ContextMenuCallback = (target: HTMLElement) => void;

    interface ContextMenuEntry {
        /** The context menu label. Can be localized. */
        name: string;
        /** A string containing an HTML icon element for the menu item */
        icon: string;
        /**
         * The function to call when the menu item is clicked. Receives the HTML element
         * of the entry that this context menu is for.
         */
        callback: (target: HTMLElement) => void;
        /**
         * A function to call to determine if this item appears in the menu.
         * Receives the HTML element of the entry that this context menu is for.
         */
        condition?: (target: HTMLElement) => boolean;
    }
}
