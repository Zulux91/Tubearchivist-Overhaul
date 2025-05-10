// ==UserScript==
// @name         Tubearchivist Layout Manager
// @namespace    http://tampermonkey.net/
// @version      0.4
// @description  Improves Tubearchivist's tile layout to configurable values.
// @author       Zulux91
// @include      YOUR_LOCAL_IP_WITH_PORT_NUMBER_HERE/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @updateURL    https://raw.githubusercontent.com/Zulux91/Tubearchivist-Overhaul/main/tubearchivist-layout-manager.js
// @downloadURL  https://raw.githubusercontent.com/Zulux91/Tubearchivist-Overhaul/main/tubearchivist-layout-manager.js
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

    // Validate config - ensure all values are numbers and within range
    validateConfig(config);

    // Cache for storing generated CSS to avoid recalculations
    const styleCache = {};

    // Register menu command
    GM_registerMenuCommand('Configure Layout', showConfigDialog);

    // ===== UTILITY FUNCTIONS =====

    /**
     * Validates configuration values to ensure they are valid numbers
     * @param {Object} configObj - Configuration object to validate
     */
    function validateConfig(configObj) {
        const validKeys = ['videoColumns', 'channelColumns', 'searchColumns', 'playlistColumns'];
        const MIN_COLUMNS = 2;
        const MAX_COLUMNS = 8;

        validKeys.forEach(key => {
            // Ensure value exists and is a number
            if (typeof configObj[key] !== 'number' || isNaN(configObj[key])) {
                configObj[key] = DEFAULT_CONFIG[key];
            }

            // Ensure value is within acceptable range
            if (configObj[key] < MIN_COLUMNS || configObj[key] > MAX_COLUMNS) {
                configObj[key] = DEFAULT_CONFIG[key];
            }
        });

        // Save the validated config
        GM_setValue('ytArchiveConfig', configObj);
    }

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

    // ===== CSS GENERATION =====

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
                max-width: 100%;
                width: 95%;
                margin: 0 auto;
            }

            /* FIX: Make info-box with 3 items display in a row */
            .info-box.info-box-3 {
                display: flex;
                flex-direction: row;
                flex-wrap: nowrap;
                justify-content: space-between;
                grid-template-columns: unset;
            }

            /* Ensure each info-box-item has equal width and proper spacing */
            .info-box.info-box-3 .info-box-item {
                flex: 1;
                margin-right: 1rem;
                min-width: 0; /* Allow flex items to shrink below content size */
            }

            /* Remove margin from the last info-box-item */
            .info-box.info-box-3 .info-box-item:last-child {
                margin-right: 0;
            }

            /* FIX: Make rating stars display horizontally */
            .rating-stars {
                display: flex;
                flex-direction: row;
                align-items: center;
                flex-wrap: nowrap;
            }

            /* Ensure proper spacing between rating stars */
            .rating-stars img {
                margin: 0 2px;
                display: inline-block;
            }

            /* Only for very small screens, allow stacking */
            @media screen and (max-width: 600px) {
                .info-box.info-box-3,
                .info-box.info-box-4 {
                    flex-direction: column;
                }

                .info-box.info-box-3 .info-box-item {
                    margin-right: 0;
                    margin-bottom: 1rem;
                }

                .info-box.info-box-3 .info-box-item:last-child {
                    margin-bottom: 0;
                }

                .video-list.grid {
                    grid-template-columns: 1fr;
                }

                .info-box.info-box-3 .icon-text {
                    width: 100%;
                }
            }
        `;
    }

    /**
     * Creates CSS for grid layouts using more specific selectors
     * @param {string} selector - CSS selector for the grid
     * @param {number} columns - Number of columns
     * @return {string} CSS rules as a string
     */
    function createGridCSS(selector, columns) {
        const columnTemplate = createColumnTemplate(columns);

        return `
            /* Target parent containers for higher specificity */
            .boxed-content ${selector},
            #main-content ${selector} {
                grid-template-columns: ${columnTemplate};
                gap: 20px;
            }

            /* Higher specificity for media queries */
            @media screen and (max-width: 1000px), screen and (max-height: 850px) {
                .boxed-content ${selector},
                #main-content ${selector} {
                    grid-template-columns: ${columnTemplate};
                }
            }

            /* Suppress the original grid classes with higher specificity */
            .boxed-content ${selector}.grid-3,
            .boxed-content ${selector}.grid-4,
            .boxed-content ${selector}.grid-5,
            .boxed-content ${selector}.grid-6,
            .boxed-content ${selector}.grid-7,
            #main-content ${selector}.grid-3,
            #main-content ${selector}.grid-4,
            #main-content ${selector}.grid-5,
            #main-content ${selector}.grid-6,
            #main-content ${selector}.grid-7 {
                grid-template-columns: ${columnTemplate};
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
                width: 100%;
                height: auto;
                object-fit: cover;
            }

            /* Ensure description heights are flexible */
            .video-desc.grid,
            .playlist-desc.grid {
                height: auto;
                min-height: 150px;
            }

            /* Ensure text doesn't overflow in titles */
            .video-desc-details h2,
            .info-box-item h3,
            .playlist-desc h2 {
                white-space: normal;
                overflow: hidden;
                text-overflow: ellipsis;
                display: -webkit-box;
                -webkit-line-clamp: 3;
                -webkit-box-orient: vertical;
            }

            /* Adjust playlist/channel items */
            .playlist-item.grid,
            .channel-item.grid {
                display: flex;
                flex-direction: column;
            }
        `;
    }

    /**
     * Creates CSS for home page
     * @return {string} CSS rules as a string
     */
    function createHomePageCSS() {
        return createGridCSS('.video-list.grid', config.videoColumns);
    }

    /**
     * Creates CSS for channel listing page
     * @return {string} CSS rules as a string
     */
    function createChannelListingPageCSS() {
        let css = createGridCSS('.channel-list.grid', config.channelColumns);

        css += `
            /* Adjust channel banner images */
            .channel-banner.grid img {
                width: 100%;
                transform: none;
            }

            /* Make info boxes fit properly */
            .info-box.info-box-2.grid {
                display: flex;
                flex-direction: column;
            }
        `;

        return css;
    }

    /**
     * Creates CSS for channel detail page
     * @return {string} CSS rules as a string
     */
    function createChannelDetailPageCSS() {
        let css = createGridCSS('.video-list.grid', config.videoColumns);

        css += `
            /* Fix channel banner on detail page */
            .channel-banner img {
                width: 100%;
                transform: none;
                object-fit: cover;
                max-height: 250px;
            }

            /* Fix info-box layout on channel page */
            .info-box.info-box-2 {
                display: flex;
                flex-direction: row;
                flex-wrap: wrap;
            }

            /* Fix info-box-item on channel page */
            .info-box.info-box-2 .info-box-item {
                flex: 1;
                min-width: 300px;
            }
        `;

        return css;
    }

    /**
     * Creates CSS for search page
     * @return {string} CSS rules as a string
     */
    function createSearchPageCSS() {
        return createGridCSS(
            '#video-results.grid, #channel-results.grid, #playlist-results.grid',
            config.searchColumns
        );
    }

    /**
     * Creates CSS for playlist page
     * @return {string} CSS rules as a string
     */
    function createPlaylistPageCSS() {
        return createGridCSS('.playlist-list.grid, .video-list.grid', config.playlistColumns);
    }

    /**
     * Creates CSS for video page
     * @return {string} CSS rules as a string
     */
    function createVideoPageCSS() {
        return createGridCSS('.playlist-list.grid, .video-list.grid', config.videoColumns);
    }

    /**
     * Creates CSS for downloads page
     * @return {string} CSS rules as a string
     */
    function createDownloadsPageCSS() {
        // Primero aplicamos el grid básico usando la configuración de columnas para videos
        let css = createGridCSS('.video-list.grid', config.videoColumns);

        // Luego añadimos estilos específicos para la página de descargas
        css += `
            /* Make the info-box horizontal on downloads page */
            .info-box.info-box-3 {
                display: flex;
                flex-direction: row;
                justify-content: space-between;
                align-items: center;
                gap: 10px;
                margin-top: 1rem;
                margin-bottom: 1rem;
            }

            /* Style the icon-text containers */
            .info-box.info-box-3 .icon-text {
                flex: 1;
                display: flex;
                flex-direction: row;
                align-items: center;
                justify-content: center;
                padding: 10px;
                gap: 10px;
                min-height: 0;
            }

            /* Make the text and icon display properly */
            .info-box.info-box-3 .icon-text img {
                width: 24px;
                margin: 0;
            }

            .info-box.info-box-3 .icon-text p {
                margin: 0;
                white-space: nowrap;
            }

            /* Específicamente para corregir el problema con boxed-content boxed-3 */
            .boxed-content.boxed-3 .video-list.grid {
                grid-template-columns: ${createColumnTemplate(config.videoColumns)};
            }

            /* Limit the size of individual download items */
            .video-item.grid {
                max-width: 400px;
            }

            /* Make the thumbnails a reasonable size */
            .video-thumb img {
                max-height: 250px;
            }
        `;

        return css;
    }

    /**
     * Determines which page-specific CSS to apply based on path
     * @param {string} path - Current URL path
     * @return {string} Combined CSS for the current page
     */
    function createPageSpecificCSS(path) {
        // Check cache first to avoid regenerating CSS
        if (styleCache[path]) {
            return styleCache[path];
        }

        let css = '';

        // Home page
        if (path === "/" || path === "") {
            css += createHomePageCSS();
        }

        // Channel pages
        if (path.includes("/channel")) {
            // Channel listing page
            if (path === "/channel/" || path === "/channel") {
                css += createChannelListingPageCSS();
            }

            // Channel detail page (shows videos from a specific channel)
            if (isChannelDetailPage(path)) {
                css += createChannelDetailPageCSS();
            }
        }

        // Search page
        if (path.includes("/search")) {
            css += createSearchPageCSS();
        }

        // Playlist page
        if (path.includes("/playlist")) {
            css += createPlaylistPageCSS();
        }

        // Video page
        if (path.includes("/video")) {
            css += createVideoPageCSS();
        }

        // Downloads page
        if (path.includes("/downloads")) {
            css += createDownloadsPageCSS();
        }

        // Asegurarse de que todas las clases 'grid-X' respeten la configuración
        css += `
            /* Anular cualquier clase grid-X predefinida */
            .boxed-content .video-list.grid.grid-3,
            .boxed-content .video-list.grid.grid-4,
            .boxed-content .video-list.grid.grid-5,
            .boxed-content .video-list.grid.grid-6 {
                grid-template-columns: ${createColumnTemplate(config.videoColumns)};
            }

            .boxed-content .channel-list.grid.grid-3,
            .boxed-content .channel-list.grid.grid-4,
            .boxed-content .channel-list.grid.grid-5,
            .boxed-content .channel-list.grid.grid-6 {
                grid-template-columns: ${createColumnTemplate(config.channelColumns)};
            }

            .boxed-content .playlist-list.grid.grid-3,
            .boxed-content .playlist-list.grid.grid-4,
            .boxed-content .playlist-list.grid.grid-5,
            .boxed-content .playlist-list.grid.grid-6 {
                grid-template-columns: ${createColumnTemplate(config.playlistColumns)};
            }
        `;

        // Cache the generated CSS for this path
        styleCache[path] = css;

        return css;
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
            for (let i = 2; i <= 8; i++) {
                options += `<option value="${i}" ${selectedValue == i ? 'selected' : ''}>${i} Columns</option>`;
            }
            return options;
        }

        /**
         * Saves configuration from form inputs
         */
        function saveConfig() {
            const newConfig = {
                videoColumns: parseInt(document.getElementById('video-column-selector').value, 10),
                channelColumns: parseInt(document.getElementById('channel-column-selector').value, 10),
                searchColumns: parseInt(document.getElementById('search-column-selector').value, 10),
                playlistColumns: parseInt(document.getElementById('playlist-column-selector').value, 10)
            };

            // Validate the new config values
            validateConfig(newConfig);

            // Update the current config
            config = newConfig;

            // Clear the style cache to force regeneration with new values
            Object.keys(styleCache).forEach(key => delete styleCache[key]);

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
            applyStyles();
        }, 100);
    }

    /**
     * Find the main content element to observe for changes
     * @return {Element} The main content element or document.body as fallback
     */
    function findMainContentElement() {
        // Try to find the main content container
        const mainContent =
            document.querySelector('.content-area') ||
            document.querySelector('#main-content') ||
            document.querySelector('.boxed-content');

        // Fallback to body if no specific container found
        return mainContent || document.body;
    }

    /**
     * Properly detects and handles SPA navigation
     */
    function setupSPANavigation() {
        const mainContentElement = findMainContentElement();

        // Create a MutationObserver with optimized settings
        const observer = new MutationObserver((mutations) => {
            // Check for URL changes
            if (location.href !== lastUrl) {
                lastUrl = location.href;
                debouncedApplyStyles();
                return; // If URL changed, we'll apply styles anyway
            }

            // Look for meaningful DOM changes that could affect layout
            let shouldApplyStyles = false;

            for (const mutation of mutations) {
                // Check added nodes
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // Check if added node is or contains relevant elements
                            if (
                                node.classList && (
                                    node.classList.contains('video-list') ||
                                    node.classList.contains('channel-list') ||
                                    node.classList.contains('playlist-list') ||
                                    node.classList.contains('info-box')
                                ) ||
                                (node.querySelectorAll && node.querySelectorAll(
                                    '.video-list, .channel-list, .playlist-list, .info-box'
                                ).length > 0)
                            ) {
                                shouldApplyStyles = true;
                                break;
                            }
                        }
                    }
                }

                if (shouldApplyStyles) break;
            }

            if (shouldApplyStyles) {
                debouncedApplyStyles();
            }
        });

        // Observe only the main content area with optimized config
        observer.observe(mainContentElement, {
            childList: true, // Watch for added/removed elements
            subtree: true, // Watch the entire subtree
            attributes: false // Don't care about attribute changes
        });

        // Also handle direct URL changes through History API
        window.addEventListener('popstate', () => {
            if (location.href !== lastUrl) {
                lastUrl = location.href;
                debouncedApplyStyles();
            }
        });
    }

    // Add resize handler with improved debounce
    let resizeTimeout;
    window.addEventListener('resize', () => {
        if (resizeTimeout) {
            clearTimeout(resizeTimeout);
        }

        resizeTimeout = setTimeout(() => {
            applyStyles();
        }, 250); // Longer timeout for resize events is OK
    });

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