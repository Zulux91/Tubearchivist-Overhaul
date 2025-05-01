// ==UserScript==
// @name         Tubearchivist Layout Manager
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  Improves Tubearchivist's tile layout to configurable values.
// @author       Zulux91
// @include      YOUR_LOCAL_IP_WITH_PORT_NUMBER_HERE/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// ==/UserScript==

(function() {
    'use strict';

    // ===== CONFIGURATION =====
    const DEFAULT_CONFIG = {
        videoColumns: 4, // Default columns for video grid (home page)
        channelColumns: 4, // Default columns for channel grid
        searchColumns: 4, // Default columns for search results
        playlistColumns: 4, // Default columns for playlists
    };

    // Load configuration or use defaults
    let config = GM_getValue('ytArchiveConfig', DEFAULT_CONFIG);

    // Register menu command
    GM_registerMenuCommand('Configure Layout', showConfigDialog);

    // ===== UTILITY FUNCTIONS =====

    /**
     * Creates a column template string based on column count
     * @param {number} colCount - Number of columns
     * @return {string} The CSS grid template
     */
    function createColumnTemplate(colCount) {
        return Array(colCount).fill('1fr').join(' ');
    }

    /**
     * Gets site theme colors from CSS variables
     * @return {Object} Object containing theme color values
     */
    function getThemeColors() {
        const computedStyle = getComputedStyle(document.documentElement);
        return {
            accentColor: computedStyle.getPropertyValue('--accent-font-dark') || '#333',
            accentLightColor: computedStyle.getPropertyValue('--accent-font-light') || '#666',
            mainBgColor: computedStyle.getPropertyValue('--main-bg') || '#222',
            mainFontColor: computedStyle.getPropertyValue('--main-font') || '#ddd',
        };
    }

    /**
     * Creates common CSS for all pages
     * @return {string} CSS rules as a string
     */
    function createCommonCSS() {
        return `
            /* Expand the main container to full width on all pages */
            .boxed-content,
            .boxed-content.boxed-3,
            .boxed-content.boxed-4,
            .boxed-content.boxed-5,
            .boxed-content.boxed-6,
            .boxed-content.boxed-7 {
                max-width: 100% !important;
                width: 95% !important;
                margin: 0 auto !important;
            }

            /* FIX: Make info-box with 3 items display in a row */
            .info-box.info-box-3 {
                display: flex !important;
                flex-direction: row !important;
                flex-wrap: nowrap !important;
                justify-content: space-between !important;
                grid-template-columns: unset !important;
            }

            /* Ensure each info-box-item has equal width and proper spacing */
            .info-box.info-box-3 .info-box-item {
                flex: 1 !important;
                margin-right: 1rem !important;
                min-width: 0 !important; /* Allow flex items to shrink below content size */
            }

            /* Remove margin from the last info-box-item */
            .info-box.info-box-3 .info-box-item:last-child {
                margin-right: 0 !important;
            }

            /* FIX: Make rating stars display horizontally */
            .rating-stars {
                display: flex !important;
                flex-direction: row !important;
                align-items: center !important;
                flex-wrap: nowrap !important;
            }

            /* Ensure proper spacing between rating stars */
            .rating-stars img {
                margin: 0 2px !important;
                display: inline-block !important;
            }

            /* Override any media queries from the original CSS */
            @media screen and (max-width: 1000px), screen and (max-height: 850px) {
                .info-box.info-box-3,
                .info-box.info-box-4 {
                    display: flex !important;
                    flex-direction: row !important;
                    grid-template-columns: unset !important;
                }
            }

            /* Only for very small screens, allow stacking */
            @media screen and (max-width: 600px) {
                .info-box.info-box-3,
                .info-box.info-box-4 {
                    flex-direction: column !important;
                }

                .info-box.info-box-3 .info-box-item {
                    margin-right: 0 !important;
                    margin-bottom: 1rem !important;
                }

                .info-box.info-box-3 .info-box-item:last-child {
                    margin-bottom: 0 !important;
                }

                .video-list.grid {
                    grid-template-columns: 1fr !important;
                }

                .info-box.info-box-3 .icon-text {
                    width: 100% !important;
                }
            }
        `;
    }

    /**
     * Creates CSS for grid layouts
     * @param {string} selector - CSS selector for the grid
     * @param {number} columns - Number of columns
     * @return {string} CSS rules as a string
     */
    function createGridCSS(selector, columns) {
        const columnTemplate = createColumnTemplate(columns);

        return `
            /* Override the grid-template-columns */
            ${selector} {
                grid-template-columns: ${columnTemplate} !important;
                gap: 20px !important;
            }

            /* Override the media query that forces 2 columns */
            @media screen and (max-width: 1000px), screen and (max-height: 850px) {
                ${selector} {
                    grid-template-columns: ${columnTemplate} !important;
                }
            }

            /* Suppress the original grid classes */
            ${selector}.grid-3,
            ${selector}.grid-4,
            ${selector}.grid-5,
            ${selector}.grid-6,
            ${selector}.grid-7 {
                grid-template-columns: ${columnTemplate} !important;
            }
        `;
    }

    /**
     * Creates CSS for common grid item styling
     * @return {string} CSS rules as a string
     */
    function createGridItemCSS() {
        return `
            /* Make sure thumbnails look good in the new layout */
            .video-thumb img,
            .channel-banner img,
            .playlist-thumbnail img {
                width: 100% !important;
                height: auto !important;
                object-fit: cover !important;
            }

            /* Ensure description heights are flexible */
            .video-desc.grid,
            .playlist-desc.grid {
                height: auto !important;
                min-height: 150px !important;
            }

            /* Ensure text doesn't overflow in titles */
            .video-desc-details h2,
            .info-box-item h3,
            .playlist-desc h2 {
                white-space: normal !important;
                overflow: hidden !important;
                text-overflow: ellipsis !important;
                display: -webkit-box !important;
                -webkit-line-clamp: 3 !important;
                -webkit-box-orient: vertical !important;
            }

            /* Adjust playlist/channel items */
            .playlist-item.grid,
            .channel-item.grid {
                display: flex !important;
                flex-direction: column !important;
            }
        `;
    }

    // ===== UI FUNCTIONS =====

    /**
     * Shows configuration dialog
     */
    function showConfigDialog() {
        const colors = getThemeColors();

        // Create modal backdrop
        const backdrop = document.createElement('div');
        backdrop.id = 'yt-archive-config-backdrop';
        backdrop.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.7);
            z-index: 9998;
            display: flex;
            justify-content: center;
            align-items: center;
        `;

        // Create modal dialog
        const dialog = document.createElement('div');
        dialog.style.cssText = `
            background-color: ${colors.mainBgColor};
            color: ${colors.mainFontColor};
            padding: 20px;
            border-radius: 8px;
            width: 350px;
            font-family: Sen-Regular, sans-serif;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        `;

        // Create dialog content
        dialog.innerHTML = `
            <h2 style="color: ${colors.accentLightColor}; margin-bottom: 20px; font-family: Sen-Bold, sans-serif;">Layout Configuration</h2>

            <div style="margin-bottom: 20px;">
                <label for="video-column-selector" style="display: block; margin-bottom: 10px;">Home page videos:</label>
                <select id="video-column-selector" style="width: 100%; padding: 8px; background-color: ${colors.mainBgColor}; color: ${colors.mainFontColor}; border: 1px solid ${colors.accentColor};">
                    ${createColumnOptions(config.videoColumns)}
                </select>
            </div>

            <div style="margin-bottom: 20px;">
                <label for="channel-column-selector" style="display: block; margin-bottom: 10px;">Channels page:</label>
                <select id="channel-column-selector" style="width: 100%; padding: 8px; background-color: ${colors.mainBgColor}; color: ${colors.mainFontColor}; border: 1px solid ${colors.accentColor};">
                    ${createColumnOptions(config.channelColumns)}
                </select>
            </div>

            <div style="margin-bottom: 20px;">
                <label for="search-column-selector" style="display: block; margin-bottom: 10px;">Search results page:</label>
                <select id="search-column-selector" style="width: 100%; padding: 8px; background-color: ${colors.mainBgColor}; color: ${colors.mainFontColor}; border: 1px solid ${colors.accentColor};">
                    ${createColumnOptions(config.searchColumns)}
                </select>
            </div>

            <div style="margin-bottom: 20px;">
                <label for="playlist-column-selector" style="display: block; margin-bottom: 10px;">Playlists page:</label>
                <select id="playlist-column-selector" style="width: 100%; padding: 8px; background-color: ${colors.mainBgColor}; color: ${colors.mainFontColor}; border: 1px solid ${colors.accentColor};">
                    ${createColumnOptions(config.playlistColumns)}
                </select>
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 10px;">
                <button id="cancel-btn" style="padding: 8px 16px; background-color: ${colors.mainBgColor}; color: ${colors.mainFontColor}; border: 1px solid ${colors.accentColor}; cursor: pointer;">Cancel</button>
                <button id="apply-btn" style="padding: 8px 16px; background-color: ${colors.accentColor}; color: white; border: none; cursor: pointer;">Apply</button>
            </div>
        `;

        // Add dialog to document
        backdrop.appendChild(dialog);
        document.body.appendChild(backdrop);

        // Setup event listeners
        document.getElementById('cancel-btn').addEventListener('click', () => {
            document.body.removeChild(backdrop);
        });

        document.getElementById('apply-btn').addEventListener('click', () => {
            saveConfig();
            document.body.removeChild(backdrop);
            showNotification('Layout configuration updated');
        });

        // Close dialog when clicking outside
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) {
                document.body.removeChild(backdrop);
            }
        });

        /**
         * Creates options for column selector
         * @param {number} selectedValue - Currently selected value
         * @return {string} HTML for select options
         */
        function createColumnOptions(selectedValue) {
            let options = '';
            for (let i = 3; i <= 6; i++) {
                options += `<option value="${i}" ${selectedValue == i ? 'selected' : ''}>${i} Columns</option>`;
            }
            return options;
        }

        /**
         * Saves configuration from form inputs
         */
        function saveConfig() {
            config = {
                videoColumns: parseInt(document.getElementById('video-column-selector').value, 10),
                channelColumns: parseInt(document.getElementById('channel-column-selector').value, 10),
                searchColumns: parseInt(document.getElementById('search-column-selector').value, 10),
                playlistColumns: parseInt(document.getElementById('playlist-column-selector').value, 10)
            };

            GM_setValue('ytArchiveConfig', config);
            applyStyles(); // Apply styles immediately
        }
    }

    /**
     * Shows a temporary notification
     * @param {string} message - Notification message
     */
    function showNotification(message) {
        // Remove existing notification if present
        const existingNotification = document.getElementById('yt-archive-notification');
        if (existingNotification) {
            document.body.removeChild(existingNotification);
        }

        const notification = document.createElement('div');
        notification.id = 'yt-archive-notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background-color: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            z-index: 9999;
            font-family: Sen-Regular, sans-serif;
        `;

        document.body.appendChild(notification);

        // Remove after 2 seconds
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 2000);
    }

    // ===== STYLE APPLICATION =====

    /**
     * Applies styles based on current URL and configuration
     */
    function applyStyles() {
        // Remove existing style element if present
        const existingStyle = document.getElementById('yt-archive-dynamic-style');
        if (existingStyle) {
            existingStyle.remove();
        }

        // Create new style element
        const styleElement = document.createElement('style');
        styleElement.id = 'yt-archive-dynamic-style';

        // Current path for page-specific styles
        const currentPath = window.location.pathname;

        // Log current path for debugging
        console.log("Applying styles for path:", currentPath);

        // Start with common CSS applicable to all pages
        let cssRules = createCommonCSS();

        // Add page-specific CSS
        cssRules += createPageSpecificCSS(currentPath);

        // Add common grid item styling
        cssRules += createGridItemCSS();

        // Set the style content and add to document
        styleElement.textContent = cssRules;
        document.head.appendChild(styleElement);
    }

    /**
     * Determines if current path is a channel detail page
     * @param {string} path - Current URL path
     * @return {boolean} True if it's a channel detail page
     */
    function isChannelDetailPage(path) {
        // Check if path matches pattern like /channel/UCQe2Y7V-C9bNMAcCJCBvzQQ
        return /^\/channel\/[^\/]+\/?$/.test(path);
    }

    /**
     * Creates CSS specific to current page type
     * @param {string} path - Current URL path
     * @return {string} CSS rules as a string
     */
    function createPageSpecificCSS(path) {
        let css = '';

        // Home page
        if (path === "/" || path === "") {
            css += createGridCSS('.video-list.grid', config.videoColumns);
        }

        // Channel pages
        if (path.includes("/channel")) {
            // Channel listing page
            if (path === "/channel/" || path === "/channel") {
                css += createGridCSS('.channel-list.grid', config.channelColumns);

                css += `
                    /* Adjust channel banner images */
                    .channel-banner.grid img {
                        width: 100% !important;
                        transform: none !important;
                    }

                    /* Make info boxes fit properly */
                    .info-box.info-box-2.grid {
                        display: flex !important;
                        flex-direction: column !important;
                    }
                `;
            }

            // Channel detail page (shows videos from a specific channel)
            if (isChannelDetailPage(path)) {
                // Apply video columns to the channel's video list
                css += createGridCSS('.video-list.grid', config.videoColumns);

                // Special styling for channel detail page
                css += `
                    /* Fix channel banner on detail page */
                    .channel-banner img {
                        width: 100% !important;
                        transform: none !important;
                        object-fit: cover !important;
                        max-height: 250px !important;
                    }

                    /* Fix info-box layout on channel page */
                    .info-box.info-box-2 {
                        display: flex !important;
                        flex-direction: row !important;
                        flex-wrap: wrap !important;
                    }

                    /* Fix info-box-item on channel page */
                    .info-box.info-box-2 .info-box-item {
                        flex: 1 !important;
                        min-width: 300px !important;
                    }
                `;
            }
        }

        // Search page
        if (path.includes("/search")) {
            css += createGridCSS('#video-results.grid, #channel-results.grid, #playlist-results.grid',
                               config.searchColumns);
        }

        // Playlist page
        if (path.includes("/playlist")) {
            css += createGridCSS('.playlist-list.grid, .video-list.grid', config.playlistColumns);
        }

        // Video page
        if (path.includes("/video")) {
            css += createGridCSS('.playlist-list.grid, .video-list.grid', config.videoColumns);
        }

        // Downloads page
        if (path.includes("/downloads")) {
            css += `
                /* Make the info-box horizontal on downloads page */
                .info-box.info-box-3 {
                    display: flex !important;
                    flex-direction: row !important;
                    justify-content: space-between !important;
                    align-items: center !important;
                    gap: 10px !important;
                    margin-top: 1rem !important;
                    margin-bottom: 1rem !important;
                }

                /* Style the icon-text containers */
                .info-box.info-box-3 .icon-text {
                    flex: 1 !important;
                    display: flex !important;
                    flex-direction: row !important;
                    align-items: center !important;
                    justify-content: center !important;
                    padding: 10px !important;
                    gap: 10px !important;
                    min-height: 0 !important;
                }

                /* Make the text and icon display properly */
                .info-box.info-box-3 .icon-text img {
                    width: 24px !important;
                    margin: 0 !important;
                }

                .info-box.info-box-3 .icon-text p {
                    margin: 0 !important;
                    white-space: nowrap !important;
                }

                /* Fix oversized items in the downloads grid */
                .video-list.grid {
                    display: flex !important;
                    flex-wrap: wrap !important;
                    justify-content: center !important;
                    gap: 20px !important;
                }

                /* Limit the size of individual download items */
                .video-item.grid {
                    max-width: 400px !important;
                    flex: 0 0 auto !important;
                }

                /* Make the thumbnails a reasonable size */
                .video-thumb img {
                    max-height: 250px !important;
                }
            `;
        }

        return css;
    }

    // ===== OBSERVERS AND EVENT HANDLING =====

    // Initialize a debounce mechanism for URL changes
    let urlChangeTimeout = null;
    let lastUrl = location.href;

    /**
     * Debounced style application for URL changes
     */
    function debouncedApplyStyles() {
        if (urlChangeTimeout) {
            clearTimeout(urlChangeTimeout);
        }

        urlChangeTimeout = setTimeout(() => {
            console.log("Applying styles for URL: " + location.href);
            applyStyles();
        }, 100);
    }

    /**
     * Properly detects and handles SPA navigation
     */
    function setupSPANavigation() {
        // Create a MutationObserver to detect DOM changes
        const observer = new MutationObserver((mutations) => {
            // Only check for URL changes if mutations have occurred
            if (location.href !== lastUrl) {
                lastUrl = location.href;
                console.log("URL changed to:", location.href);
                debouncedApplyStyles();
            }

            // Look for newly added video lists or grid containers
            for (const mutation of mutations) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // Check if added node or any of its children are relevant containers
                            const hasRelevantContent =
                                node.classList && (
                                    node.classList.contains('video-list') ||
                                    node.classList.contains('channel-list') ||
                                    node.classList.contains('playlist-list')
                                ) ||
                                node.querySelector && (
                                    node.querySelector('.video-list, .channel-list, .playlist-list, .info-box')
                                );

                            if (hasRelevantContent) {
                                debouncedApplyStyles();
                                break;
                            }
                        }
                    }
                }
            }
        });

        // Observe the entire document for changes
        observer.observe(document.documentElement, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class']
        });

        // Also handle direct URL changes through History API
        window.addEventListener('popstate', () => {
            if (location.href !== lastUrl) {
                lastUrl = location.href;
                debouncedApplyStyles();
            }
        });
    }

    // Also observe window resize events to ensure layout stays responsive
    window.addEventListener('resize', debouncedApplyStyles);

    // Initial style application
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            applyStyles();
            setupSPANavigation();
        });
    } else {
        applyStyles();
        setupSPANavigation();
    }
})();