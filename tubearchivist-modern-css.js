// ==UserScript==
// @name         Tubearchivist Modern CSS Overhaul
// @namespace    http://tampermonkey.net/
// @version      0.4
// @description  Replace the existing CSS with a modernized version and add color configuration with shareable themes.
// @author       Zulux91
// @include      YOUR_LOCAL_IP_WITH_PORT_NUMBER_HERE/*
// @grant        GM_registerMenuCommand
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_setClipboard
// @run-at       document-start
// @updateURL    https://raw.githubusercontent.com/Zulux91/Tubearchivist-Overhaul/main/tubearchivist-modern-css.js
// @downloadURL  https://raw.githubusercontent.com/Zulux91/Tubearchivist-Overhaul/main/tubearchivist-modern-css.js
// ==/UserScript==

(function() {
    'use strict';

    // Default theme colors
    const defaultColors = {
        mainBg: '#f8f9fa',
        mainFont: '#333333',
        highlightBg: '#f0f0f0',
        accentDark: '#4361ee',
        accentLight: '#4cc9f0',
        highlightError: '#ef476f',
        highlightErrorLight: '#ff6b8b'
    };

    // Function to get saved colors or default values
    function getSavedColors() {
        let colors = {};
        for (const [key, defaultValue] of Object.entries(defaultColors)) {
            colors[key] = GM_getValue(key, defaultValue);
        }
        return colors;
    }

    // Function to set CSS variables based on saved colors
    function applyColorTheme(colors) {
        const root = document.documentElement;

        // Set the CSS variables
        root.style.setProperty('--main-bg', colors.mainBg);
        root.style.setProperty('--main-font', colors.mainFont);
        root.style.setProperty('--highlight-bg', colors.highlightBg);
        root.style.setProperty('--accent-font-dark', colors.accentDark);
        root.style.setProperty('--accent-font-light', colors.accentLight);
        root.style.setProperty('--highlight-error', colors.highlightError);
        root.style.setProperty('--highlight-error-light', colors.highlightErrorLight);

        // Convert colors to RGB for rgba() usage
        const rgbMain = hexToRgb(colors.mainBg);
        const rgbHighlight = hexToRgb(colors.highlightBg);
        const rgbAccentDark = hexToRgb(colors.accentDark);
        const rgbAccentLight = hexToRgb(colors.accentLight);
        const rgbError = hexToRgb(colors.highlightError);

        // Set RGB variables
        if (rgbMain) root.style.setProperty('--main-bg-rgb', `${rgbMain.r}, ${rgbMain.g}, ${rgbMain.b}`);
        if (rgbHighlight) root.style.setProperty('--highlight-bg-rgb', `${rgbHighlight.r}, ${rgbHighlight.g}, ${rgbHighlight.b}`);
        if (rgbAccentDark) root.style.setProperty('--accent-font-dark-rgb', `${rgbAccentDark.r}, ${rgbAccentDark.g}, ${rgbAccentDark.b}`);
        if (rgbAccentLight) root.style.setProperty('--accent-font-light-rgb', `${rgbAccentLight.r}, ${rgbAccentLight.g}, ${rgbAccentLight.b}`);
        if (rgbError) root.style.setProperty('--highlight-error-rgb', `${rgbError.r}, ${rgbError.g}, ${rgbError.b}`);
    }

    // Helper function to convert hex to RGB
    function hexToRgb(hex) {
        // Remove # if present
        hex = hex.replace('#', '');

        // Parse the hex values
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);

        if (isNaN(r) || isNaN(g) || isNaN(b)) {
            console.error("Invalid hex color:", hex);
            return null;
        }

        return { r, g, b };
    }

    // Generate a seed from color settings
    function generateSeed(colors) {
        try {
            const seed = btoa(JSON.stringify(colors));
            return seed;
        } catch (error) {
            console.error("Error generating seed:", error);
            return "";
        }
    }

    // Import a seed and convert to color settings
    function importSeed(seed) {
        try {
            // Store the current colors before importing
            const previousColors = getSavedColors();
            GM_setValue('previousColors', JSON.stringify(previousColors));

            // Decode and parse the seed
            let decodedSeed;
            try {
                decodedSeed = atob(seed);
            } catch (e) {
                console.error("Error decoding base64:", e);
                return { success: false, message: "Invalid seed format. Not a valid base64 string." };
            }

            let importedColors;
            try {
                importedColors = JSON.parse(decodedSeed);
            } catch (e) {
                console.error("Error parsing JSON:", e);
                return { success: false, message: "Invalid seed format. Could not parse JSON." };
            }

            console.log("Imported colors:", importedColors);

            // Validate the imported colors
            let isValid = true;
            const requiredKeys = Object.keys(defaultColors);

            // Check if all required keys exist
            for (const key of requiredKeys) {
                if (!importedColors.hasOwnProperty(key)) {
                    console.error(`Missing key in imported theme: ${key}`);
                    isValid = false;
                    break;
                }

                // Validate that each value is a valid hex color
                const hexRegex = /^#[0-9A-Fa-f]{6}$/;
                if (!hexRegex.test(importedColors[key])) {
                    if (!importedColors[key].startsWith('#')) {
                        // Try to fix colors without leading # by adding it
                        importedColors[key] = '#' + importedColors[key];
                    }

                    if (!hexRegex.test(importedColors[key])) {
                        console.error(`Invalid hex color for ${key}: ${importedColors[key]}`);
                        isValid = false;
                        break;
                    }
                }
            }

            if (!isValid) {
                throw new Error("Invalid seed format");
            }

            console.log("Validation passed, applying colors:", importedColors);

            // Save the imported colors to settings
            for (const [key, value] of Object.entries(importedColors)) {
                GM_setValue(key, value);
            }

            // Apply the imported colors
            applyColorTheme(importedColors);

            return { success: true, message: "Theme imported successfully!" };
        } catch (error) {
            console.error("Error importing seed:", error);
            return { success: false, message: "Invalid theme seed. Please check the format." };
        }
    }

    // Revert to the previous colors before import
    function revertImport() {
        try {
            const previousColorsString = GM_getValue('previousColors', null);
            if (!previousColorsString) {
                return { success: false, message: "No previous configuration found." };
            }

            let previousColors;
            try {
                previousColors = JSON.parse(previousColorsString);
            } catch (e) {
                console.error("Error parsing previous colors:", e);
                return { success: false, message: "Error parsing previous configuration." };
            }

            console.log("Reverting to previous colors:", previousColors);

            // Save the previous colors back to settings
            for (const [key, value] of Object.entries(previousColors)) {
                GM_setValue(key, value);
            }

            // Apply the previous colors
            applyColorTheme(previousColors);

            return { success: true, message: "Reverted to previous theme." };
        } catch (error) {
            console.error("Error reverting import:", error);
            return { success: false, message: "Error reverting to previous theme." };
        }
    }

    // Function to add the CSS
    function addModernCSS() {
        // First, disable any existing CSS files
        const styleSheets = document.querySelectorAll('link[rel="stylesheet"]');
        styleSheets.forEach(sheet => {
            sheet.disabled = true;
        });

        // Create a new style element
        const modernStyle = document.createElement('style');
        modernStyle.id = 'modern-css-injected';

        // Add the modernized CSS
        modernStyle.textContent = `
@font-face {
  font-family: 'Sen-Bold';
  src: url('/font/Sen-Bold.woff');
  font-family: 'Sen-Bold';
}

@font-face {
  font-family: 'Sen-Regular';
  src: url('/font/Sen-Regular.woff');
  font-family: 'Sen-Regular';
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  transition: all 0.2s ease-in-out;
}

html {
  width: 100vw;
  overflow-x: hidden;
  height: 100%;
  scrollbar-color: var(--accent-font-dark) transparent;
}

::-webkit-scrollbar {
  width: 7px;
}

::-webkit-scrollbar-thumb {
  background: var(--accent-font-dark);
  border-radius: 10px;
}

body,
#root {
  background-color: var(--main-bg);
  min-height: 100%;
  display: grid;
  grid-template-rows: 1fr auto;
}

a {
  font-family: Sen-Regular, sans-serif;
  text-decoration: none;
  color: var(--accent-font-light);
  transition: all 0.3s ease;
}

a:hover {
  filter: brightness(120%);
  transform: translateY(-2px);
  text-shadow: 0 0 8px var(--accent-font-light);
}

h1 {
  font-family: Sen-Bold, sans-serif;
  font-size: 2.3em;
  color: var(--accent-font-light);
}

h2 {
  font-size: 1.2em;
  margin-bottom: 10px;
  font-family: Sen-Bold, sans-serif;
  color: var(--accent-font-dark);
}

h3 {
  font-size: 1.1em;
  margin-bottom: 7px;
  font-family: Sen-Regular, sans-serif;
  color: var(--accent-font-light);
  transition: color 0.3s ease;
}

h4 {
  font-size: 0.7em;
  margin-bottom: 7px;
  font-family: Sen-Regular, sans-serif;
  color: var(--accent-font-light);
}

p,
i,
li {
  font-family: Sen-Regular, sans-serif;
  margin-bottom: 10px;
  color: var(--main-font);
}

ul {
  margin-left: 20px;
}

td,
th,
span,
label {
  font-family: Sen-Regular, sans-serif;
  color: var(--main-font);
  text-align: left;
}

select,
input {
  padding: 8px 12px;
  margin: 5px;
  border-radius: 8px;
  color: var(--main-bg);
  background-color: var(--accent-font-light);
  transition: all 0.3s ease;
  border: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

select:hover,
input:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

select:focus,
input:focus {
  outline: none;
  box-shadow: 0 0 0 3px var(--accent-font-light);
}

select {
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 10px center;
  background-size: 1em;
  padding-right: 30px;
}

input {
  border: solid 1px transparent;
}

input[readonly] {
  background-color: var(--main-font);
  opacity: 0.7;
}

textarea {
  width: 100%;
  border-radius: 8px;
  padding: 10px;
  border: 1px solid var(--accent-font-dark);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

textarea:focus {
  outline: none;
  box-shadow: 0 0 0 3px var(--accent-font-light);
  border-color: var(--accent-font-light);
}

button {
  border-radius: 8px;
  padding: 8px 16px;
  border: none;
  cursor: pointer;
  background-color: var(--accent-font-dark);
  color: #ffffff;
  font-weight: bold;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

button:hover {
  background-color: var(--accent-font-light);
  transform: scale(1.05);
  color: var(--main-bg);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.button-box {
  padding: 5px 2px;
  display: inline-flex;
  gap: 5px;
}

.unsubscribe {
  background-color: var(--accent-font-light);
}

.unsubscribe:hover {
  background-color: var(--accent-font-dark);
}

.boxed-content {
  max-width: 1000px;
  width: 80%;
  margin: 0 auto;
  border-radius: 12px;
}

.boxed-content.boxed-4 {
  max-width: 1200px;
  width: 80%;
}

.boxed-content.boxed-5,
.boxed-content.boxed-6,
.boxed-content.boxed-7 {
  max-width: unset;
  width: 85%;
}

.round-img img {
  border-radius: 50%;
  transition: transform 0.3s ease;
}

.round-img img:hover {
  transform: scale(1.1);
}

.settings-current {
  color: var(--accent-font-light);
}

.help-text {
  width: 100%;
  border-left: 2px solid var(--accent-font-light);
  padding: 12px 0 12px 1rem;
  border-radius: 0 8px 8px 0;
  background-color: rgba(var(--accent-font-light-rgb), 0.05);
}

.left-align {
  text-align: start;
}

.help-text::before {
  content: '?';
  font-size: 1.5em;
  font-family: Sen-Bold, sans-serif;
  color: #ffffff;
  background-color: var(--accent-font-dark);
  border-radius: 50%;
  width: 30px;
  display: block;
  height: 30px;
  text-align: center;
  box-shadow: 0 0 15px rgba(var(--accent-font-dark-rgb), 0.5);
}

.top-banner {
  background-image: var(--banner);
  background-repeat: no-repeat;
  background-size: contain;
  height: 10vh;
  min-height: 80px;
  max-height: 120px;
  background-position: center center;
  border-radius: 0 0 16px 16px;
}

.footer {
  margin: 0;
  padding: 20px 0;
  background-color: var(--highlight-bg);
  grid-row-start: 2;
  grid-row-end: 3;
  border-radius: 16px 16px 0 0;
}

.footer a {
  text-decoration: underline;
  transition: all 0.3s ease;
}

.footer a:hover {
  text-shadow: 0 0 8px var(--accent-font-light);
}

.footer .boxed-content {
  text-align: center;
}

/* toggle on-off */
.toggle {
  display: flex;
  align-items: center;
}

.toggleBox > input[type='checkbox'] {
  position: relative;
  width: 70px;
  height: 30px;
  background-color: var(--accent-font-light);
  border-color: var(--accent-font-light);
  appearance: none;
  border-radius: 15px;
  transition: 0.4s;
  box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.2);
  cursor: pointer;
}

.toggleBox > input:checked[type='checkbox'] {
  background-color: var(--accent-font-dark);
  border-color: var(--accent-font-dark);
  box-shadow: 0 0 10px rgba(var(--accent-font-dark-rgb), 0.5);
}

.toggleBox > input[type='checkbox']::before {
  z-index: 2;
  position: absolute;
  content: '';
  left: 0;
  top: 0;
  width: 30px;
  height: 30px;
  background-color: white;
  border-radius: 50%;
  transform: scale(1.1);
  transition: 0.4s;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

.toggleBox > input:checked[type='checkbox']::before {
  left: 40px;
}

.toggleBox {
  margin-left: 10px;
  position: relative;
  display: inline;
}

.toggleBox > label {
  position: absolute;
  color: var(--main-font);
  pointer-events: none;
  transition: all 0.3s ease;
}

.toggleBox > .onbtn {
  right: 70%;
  top: 45%;
  transform: translate(50%, -50%);
  font-family: Sen-Regular, sans-serif;
}

.toggleBox > .ofbtn {
  left: 37%;
  top: 45%;
  transform: translate(50%, -50%);
  font-family: Sen-Regular, sans-serif;
  color: var(--main-font);
}

/* delete button */
.delete-confirm button {
  display: flex;
  margin: 3px 0;
}

.danger-button {
  background-color: var(--highlight-error);
  transition: all 0.3s ease;
}

.danger-button:hover {
  background-color: var(--highlight-error-light);
  box-shadow: 0 0 15px rgba(var(--highlight-error-rgb), 0.5);
}

/* navigation */
.top-nav {
  display: block;
  padding: 12px 0;
  position: relative;
  background-color: rgba(var(--highlight-bg-rgb), 0.9); /* Increased opacity for better readability */
  border-radius: 0 0 16px 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.nav-items {
  width: 100%;
  display: flex;
  justify-content: center;
}

.nav-item {
  font-size: 1.3em;
  padding: 10px 20px;
  margin: 0 10px;
  border-bottom: 2px solid;
  color: var(--accent-font-dark);
  position: relative;
  transition: all 0.3s ease;
}

.nav-item:hover {
  color: var(--accent-font-light);
  transform: translateY(-2px);
}

.nav-item::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 2px;
  background-color: var(--accent-font-light);
  transition: width 0.3s ease;
}

.nav-item:hover::after {
  width: 100%;
}

.nav-icons {
  width: auto;
  display: inline-flex;
  position: absolute;
  top: 50%;
  right: 0;
  transform: translate(0, -50%);
}

.nav-icons img {
  width: 40px;
  padding: 0 5px;
  filter: var(--img-filter);
  transition: all 0.3s ease;
}

.nav-icons img:hover {
  transform: scale(1.15);
  filter: var(--img-filter) drop-shadow(0 0 5px var(--accent-font-light));
}

#castbutton {
  float: right;
  width: 40px;
  padding: 0 5px;
  --disconnected-color: var(--accent-font-dark);
  --connected-color: var(--accent-font-light);
  transition: transform 0.3s ease;
}

#castbutton:hover {
  transform: scale(1.15);
}

.alert-hover:hover {
  filter: var(--img-filter-error);
  cursor: pointer;
  animation: pulse 1s infinite alternate;
}

/* top of page */
.title-bar {
  padding-top: 30px;
}

.sort {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.padding-box {
  padding: 30px 0;
}

.two-col {
  display: flex;
  gap: 20px;
}

.two-col > div {
  width: 50%;
  border-radius: 12px;
}

.view-controls {
  display: grid;
  grid-template-columns: 1fr auto auto;
  border-bottom: 2px solid;
  border-color: var(--accent-font-dark);
  margin: 15px 0;
  padding-bottom: 8px;
}

.view-icons,
.grid-count {
  display: flex;
  justify-content: end;
  align-items: center;
}

.view-icons img {
  width: 30px;
  margin: 5px 10px;
  cursor: pointer;
  filter: var(--img-filter);
  transition: all 0.3s ease;
}

.view-icons img:hover {
  transform: scale(1.15);
  filter: var(--img-filter) drop-shadow(0 0 5px var(--accent-font-light));
}

.grid-count img {
  width: 15px;
  margin: 5px;
  cursor: pointer;
  filter: var(--img-filter);
  transition: all 0.3s ease;
}

.grid-count img:hover {
  transform: scale(1.15);
  filter: var(--img-filter) drop-shadow(0 0 5px var(--accent-font-light));
}

#text-reveal {
  height: 0;
  overflow: hidden;
  transition: height 0.5s ease;
}

#text-expand {
  overflow: hidden;
  display: -webkit-inline-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 4;
}

/* video player */
.player-wrapper {
  background-color: var(--highlight-bg);
  margin: 20px 0;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.video-player {
  display: grid;
  align-content: space-evenly;
  height: 100vh;
  position: relative; /* needed for modal */
}

#notifications {
  position: relative;
}

.notifications {
  text-align: center;
  width: 80%;
  margin: auto;
  padding: 10px;
  border-radius: 8px;
  background-color: rgba(var(--accent-font-dark-rgb), 0.1);
}

.sponsorblock {
  text-align: center;
  width: 80%;
  margin: auto;
  padding: 10px;
  border-radius: 8px;
  background-color: rgba(var(--accent-font-light-rgb), 0.1);
}

.video-player video,
.video-main video {
  max-height: 80vh;
  width: 90%;
  max-width: 1500px;
  margin: 0 auto;
  display: block;
  border-radius: 8px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
}

.player-title img {
  width: 30px;
  margin: 10px 10px 10px 0;
  transition: transform 0.3s ease;
}

.player-title img:hover {
  transform: scale(1.15);
}

/* fix for safari full screen not scaling full */
video:-webkit-full-screen {
  max-height: unset !important;
  max-width: unset !important;
}

/* video list */
.video-list {
  display: grid;
  grid-gap: 1.5rem;
  margin-top: 1rem;
}

.video-list.grid.grid-3 {
  grid-template-columns: 1fr 1fr 1fr;
}

.video-list.grid.grid-4 {
  grid-template-columns: 1fr 1fr 1fr 1fr;
}

.video-list.grid.grid-5 {
  grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
}

.video-list.grid.grid-6 {
  grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr;
}

.video-list.grid.grid-7 {
  grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr 1fr;
}

.video-list.list {
  grid-template-columns: unset;
}

.video-item {
  overflow: hidden;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.video-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.video-item:hover .video-tags {
  opacity: 1;
}

.video-item.list {
  display: grid;
  grid-template-columns: 26% auto;
  background-color: var(--highlight-bg);
  align-items: center;
}

.video-progress-bar,
.notification-progress-bar {
  position: absolute;
  background-color: var(--accent-font-dark);
  height: 7px;
  left: 0;
  bottom: 3px;
  transition: all 0.3s ease;
  border-radius: 0 4px 4px 0;
}

.video-item:hover .video-progress-bar {
  height: 8px;
  background-color: var(--accent-font-light);
  box-shadow: 0 0 10px rgba(var(--accent-font-light-rgb), 0.5);
}

.video-thumb img {
  width: 100%;
  position: relative;
  transition: transform 0.5s ease;
  border-radius: 12px 12px 0 0;
}

.video-item:hover .video-thumb img {
  transform: scale(1.05);
}

.video-tags {
  position: absolute;
  top: 10px;
  left: 10px;
  padding: 5px;
  opacity: 0;
  transition: 0.3s ease-in-out;
  border-radius: 6px;
  backdrop-filter: blur(5px);
  background-color: rgba(var(--accent-font-light-rgb), 0.7);
}

.video-tags span {
  background-color: var(--accent-font-light);
  padding: 5px 10px;
  border-radius: 4px;
  font-weight: bold;
  color: var(--main-bg);
}

.video-play img {
  width: 40px;
  filter: var(--img-filter);
  transition: all 0.3s ease;
}

.video-thumb-wrap {
  position: relative;
  cursor: pointer;
  overflow: hidden;
  border-radius: 12px 12px 0 0;
}

.video-thumb-wrap:hover > .video-play {
  opacity: 1;
  padding: 15px;
  transform: translate(50%, -50%) scale(1.1);
}

.video-play {
  opacity: 0;
  transition: all 0.3s ease-in-out;
  position: absolute;
  top: 50%;
  right: 50%;
  transform: translate(50%, -50%);
  background-color: var(--highlight-bg);
  border-radius: 50%;
  padding: 8px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
}

.video-desc.grid {
  padding: 16px;
  height: 100%;
  background-color: var(--highlight-bg);
  border-radius: 0 0 12px 12px;
}

.video-desc.list {
  padding: 16px;
  height: 100%;
  display: flex;
  flex-wrap: wrap;
  align-content: center;
  border-radius: 0 12px 12px 0;
}

.video-desc > div {
  width: 100%;
}

.video-desc img {
  width: 20px;
  margin-right: 10px;
  transition: transform 0.3s ease;
}

.video-desc img:hover {
  transform: scale(1.15);
}

.video-desc a {
  text-decoration: none;
  text-align: left;
}

.video-desc h3,
.player-title h3 {
  font-size: 0.9em;
  text-transform: uppercase;
}

.video-item:hover .video-desc h3 {
  color: var(--accent-font-light);
  text-shadow: 0 0 8px rgba(var(--accent-font-light-rgb), 0.3);
}

.player-stats {
  float: right;
  display: flex;
  align-items: center;
  margin-top: 10px;
}

.player-stats span {
  margin: 0 5px;
}

.video-desc-player {
  margin-bottom: 8px;
  display: flex;
  align-items: center;
}

.watch-button,
.dot-button,
.close-button {
  cursor: pointer;
  filter: var(--img-filter);
  transition: transform 0.3s ease, filter 0.3s ease;
}

.watch-button:hover,
.dot-button:hover,
.close-button:hover {
  transform: scale(1.15);
  filter: var(--img-filter) drop-shadow(0 0 5px var(--accent-font-light));
}

.video-more {
  text-decoration: underline;
  text-align: right;
  transition: all 0.3s ease;
}

.video-more:hover {
  color: var(--accent-font-light);
  text-shadow: 0 0 8px rgba(var(--accent-font-light-rgb), 0.3);
}

/* pagination */
.pagination {
  padding: 30px 0;
  margin-left: auto;
  margin-right: auto;
  text-align: center;
}

.pagination-item {
  padding: 8px 12px;
  border: 1px solid var(--accent-font-dark);
  border-radius: 8px;
  margin: 0 5px;
  transition: all 0.3s ease;
}

.pagination-item:hover,
.pagination-item.active {
  background-color: var(--accent-font-dark);
  color: white;
  box-shadow: 0 0 15px rgba(var(--accent-font-dark-rgb), 0.5);
  transform: scale(1.1);
}

/* info box */
.title-split {
  display: grid;
  grid-template-columns: 1fr 1fr;
}

.title-split img {
  width: 40px;
  filter: var(--img-filter);
  cursor: pointer;
  margin: 0 10px;
  transition: transform 0.3s ease, filter 0.3s ease;
}

.title-split img:hover {
  transform: scale(1.15);
  filter: var(--img-filter) drop-shadow(0 0 5px var(--accent-font-light));
}

.title-split-form {
  padding-top: 30px;
  display: flex;
}

.info-box {
  display: grid;
  grid-gap: 1.5rem;
  margin-top: 1rem;
}

.description-box,
.comments-section {
  margin-top: 1rem;
  padding: 20px;
  background-color: var(--highlight-bg);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.description-box:hover,
.comments-section:hover {
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.info-box-4 {
  grid-template-columns: 1fr 1fr 1fr 1fr;
}

.info-box-3 {
  grid-template-columns: 1fr 1fr 1fr;
}

.info-box-2 {
  grid-template-columns: 1fr 1fr;
}

.info-box-1 {
  grid-template-columns: 1fr;
}

.info-box img {
  width: 80px;
  margin: 0 15px;
  transition: transform 0.3s ease;
}

.info-box img:hover {
  transform: scale(1.15);
}

.info-box-item {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  padding: 20px;
  background-color: var(--highlight-bg);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.info-box-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.info-box-item p {
  width: 100%;
}

.description-text {
  width: 100%;
}

.description-text br {
  margin-bottom: 10px;
}

/* login */
.login-page {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  text-align: center;
  align-content: center;
}

.login-page > * {
  width: 100%;
}

.login-page img {
  width: 100%;
  max-width: 200px;
  max-height: 200px;
  margin-bottom: 40px;
  content: var(--logo);
  transition: transform 0.5s ease;
}

.login-page img:hover {
  transform: scale(1.05);
  filter: drop-shadow(0 0 15px var(--accent-font-light));
}

.login-page form {
  margin: 30px 0;
  padding: 30px;
  background-color: var(--highlight-bg);
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.login-page input {
  min-width: 200px;
  border-radius: 8px;
}

#id_remember_me {
  min-width: unset;
}

.login-page button,
.login-page .danger-zone {
  width: 210px;
  margin-top: 10px;
  border-radius: 8px;
}

.login-links a {
  text-decoration: underline;
  margin: 30px 0;
  padding: 20px;
  transition: all 0.3s ease;
}

.login-links a:hover {
  color: var(--accent-font-light);
  text-shadow: 0 0 10px rgba(var(--accent-font-light-rgb), 0.5);
}

.footer-colors {
  grid-row-start: 2;
  grid-row-end: 3;
  display: flex;
}

.footer-colors div {
  padding: 20px 0;
  width: 33.33%;
}

.col-1 {
  background-color: var(--highlight-bg);
  border-radius: 16px 0 0 0;
}

.col-2 {
  background-color: var(--accent-font-dark);
}

.col-3 {
  background-color: var(--accent-font-light);
  border-radius: 0 16px 0 0;
}

/* video page */
.video-main {
  margin: 1rem 0;
  position: relative; /* needed for modal */
}

.video-modal {
  position: absolute;
  z-index: 1;
  top: 20%;
  transform: translateX(-50%);
  left: 50%;
  text-align: center;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.video-modal-text {
  background: rgba(0, 0, 0, 0.7);
  color: #eeeeee;
  font-size: 1.3em;
  padding: 15px;
  backdrop-filter: blur(5px);
}

.video-modal-table {
  margin: auto;
  background: rgba(0, 0, 0, 0.7);
  padding: 15px;
  backdrop-filter: blur(5px);
}

.video-modal-form {
  margin: auto;
  background: rgba(0, 0, 0, 0.7);
  padding: 15px;
  backdrop-filter: blur(5px);
}

.video-main video {
  max-height: 70vh;
  margin-bottom: 1rem;
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
}

.video-info-watched {
  display: flex;
  align-items: center;
}

.video-info-watched img {
  width: 20px;
  margin-left: 5px;
  transition: transform 0.3s ease;
}

.video-info-watched img:hover {
  transform: scale(1.15);
}

.thumb-icon {
  display: flex;
  align-items: center;
}

.video-tag-box {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  margin: 15px 0;
}

.video-tag {
  padding: 8px 15px;
  margin: 5px;
  border-radius: 20px;
  border: 1px solid var(--accent-font-light);
  transition: all 0.3s ease;
  background-color: rgba(var(--accent-font-light-rgb), 0.1);
}

.video-tag:hover {
  background-color: var(--accent-font-light);
  color: var(--main-bg);
  box-shadow: 0 0 10px rgba(var(--accent-font-light-rgb), 0.5);
  transform: translateY(-3px);
}

.thumb-icon img,
.rating-stars img {
  width: 20px;
  margin: 0 5px;
  filter: var(--img-filter);
  transition: transform 0.3s ease;
}

.thumb-icon img:hover,
.rating-stars img:hover {
  transform: scale(1.2);
  filter: var(--img-filter) drop-shadow(0 0 5px var(--accent-font-light));
}

.dislike {
  transform: rotate(180deg);
}

.dislike:hover {
  transform: rotate(180deg) scale(1.2) !important;
}

.playlist-wrap {
  background-color: var(--highlight-bg);
  margin: 1rem 0;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.playlist-wrap:hover {
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.playlist-wrap > a > h3 {
  text-align: center;
  transition: all 0.3s ease;
}

.playlist-wrap > a:hover > h3 {
  color: var(--accent-font-light);
  text-shadow: 0 0 8px rgba(var(--accent-font-light-rgb), 0.3);
}

.playlist-nav {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  margin-bottom: 15px;
}

.playlist-nav-item {
  display: flex;
  justify-content: space-between;
  background-color: rgba(var(--highlight-bg-rgb), 0.9); /* Increased opacity for better readability */
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.playlist-nav-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
}

.playlist-nav-item img {
  width: 200px;
  transition: transform 0.5s ease;
}

.playlist-nav-item:hover img {
  transform: scale(1.05);
}

.playlist-desc {
  padding: 10px;
  width: 100%;
}

.comment-box {
  padding-bottom: 1rem;
  overflow: hidden;
  margin-bottom: 15px;
  border-bottom: 1px solid rgba(var(--accent-font-light-rgb), 0.2);
  transition: all 0.3s ease;
}

.comment-box:hover {
  background-color: rgba(var(--accent-font-light-rgb), 0.05);
  border-radius: 8px;
  transform: translateX(5px);
}

.comment-box h3 {
  line-break: anywhere;
}

.comments-replies {
  display: none;
  padding-left: 1.5rem;
  border-left: 2px solid var(--accent-font-light);
  margin-top: 1rem;
  background-color: rgba(var(--accent-font-light-rgb), 0.05);
  border-radius: 0 8px 8px 0;
  box-shadow: inset 2px 0 5px rgba(0, 0, 0, 0.05);
}

.comment-highlight {
  background-color: var(--main-font);
  padding: 5px 10px;
  color: var(--accent-font-dark);
  font-family: Sen-bold, sans-serif;
  width: fit-content;
  border-radius: 4px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.comment-meta {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.space-carrot {
  margin: 0 5px;
  color: var(--accent-font-light);
}

.comment-like img {
  width: 20px;
  margin-left: 5px;
  filter: var(--img-filter-error);
  transition: transform 0.3s ease;
}

.comment-like img:hover {
  transform: scale(1.2);
}

/* multi search page */
.multi-search-box {
  padding-right: 20px;
}

.multi-search-box input {
  width: 100%;
  border-radius: 8px;
  padding: 10px 15px;
  border: 1px solid var(--accent-font-dark);
  transition: all 0.3s ease;
}

.multi-search-box input:focus {
  outline: none;
  box-shadow: 0 0 0 3px var(--accent-font-light);
  border-color: var(--accent-font-light);
  transform: translateY(-2px);
}

.multi-search-result,
#multi-search-results-placeholder {
  padding: 1.5rem;
  margin: 1rem 0;
  border-radius: 8px;
  background-color: var(--highlight-bg);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.multi-search-result:hover,
#multi-search-results-placeholder:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

#multi-search-results-placeholder span {
  font-family: monospace;
  color: var(--accent-font-dark);
  background-color: rgba(var(--highlight-bg-rgb), 0.9); /* Increased opacity for better readability */
  padding: 2px 5px;
  border-radius: 4px;
}

#multi-search-results-placeholder span.value {
  color: var(--accent-font-light);
}

#multi-search-results-placeholder ul {
  margin-top: 10px;
  list-style-type: none;
}

#multi-search-results-placeholder ul li {
  margin-bottom: 8px;
  position: relative;
  padding-left: 20px;
}

#multi-search-results-placeholder ul li::before {
  content: '•';
  position: absolute;
  left: 0;
  color: var(--accent-font-light);
  font-size: 1.5em;
}

/* channel overview page */
.channel-list.list {
  display: block;
}

.channel-list.grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 1.5rem;
}

.channel-item.list {
  padding-bottom: 1.5rem;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid rgba(var(--accent-font-light-rgb), 0.2);
}

.channel-item.grid > .info-box {
  display: block;
}

.channel-banner {
  overflow: hidden;
  border-radius: 12px 12px 0 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.channel-banner img {
  width: 100%;
  transition: transform 0.5s ease;
}

.channel-banner:hover img {
  transform: scale(1.05);
}

.channel-banner.grid {
  overflow: hidden;
}

.channel-banner.list img {
  width: 100%;
}

.channel-banner.grid img {
  width: 250%;
  transform: translateX(-30%);
}

.channel-banner.grid:hover img {
  transform: translateX(-30%) scale(1.05);
}

.info-box-item.child-page-nav {
  justify-content: center;
  padding: 15px;
  background-color: var(--highlight-bg);
  border-radius: 0 0 12px 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.info-box-item.child-page-nav a {
  padding: 0 1rem;
  font-weight: bold;
  position: relative;
  transition: all 0.3s ease;
}

.info-box-item.child-page-nav a:hover {
  text-decoration: none;
  color: var(--accent-font-light);
  text-shadow: 0 0 8px rgba(var(--accent-font-light-rgb), 0.3);
}

.info-box-item.child-page-nav a::after {
  content: '';
  position: absolute;
  bottom: -5px;
  left: 50%;
  width: 0;
  height: 2px;
  background-color: var(--accent-font-light);
  transition: width 0.3s ease, left 0.3s ease;
}

.info-box-item.child-page-nav a:hover::after {
  width: 80%;
  left: 10%;
}

/* playlist overview page */
.playlist-list.list {
  display: grid;
  grid-template-columns: unset;
  gap: 1.5rem;
}

.playlist-list.grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 1.5rem;
}

.playlist-item {
  overflow: hidden;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.playlist-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.playlist-item.list {
  display: flex;
}

.playlist-thumbnail {
  overflow: hidden;
  border-radius: 12px 12px 0 0;
}

.playlist-thumbnail img {
  width: 100%;
  transition: transform 0.5s ease;
}

.playlist-item:hover .playlist-thumbnail img {
  transform: scale(1.05);
}

.playlist-desc.grid {
  padding: 16px;
  height: 100%;
  background-color: var(--highlight-bg);
  border-radius: 0 0 12px 12px;
}

.playlist-desc.list {
  width: 100%;
  padding: 16px;
  height: unset;
  background-color: var(--highlight-bg);
  border-radius: 0 12px 12px 0;
  display: flex;
  flex-wrap: wrap;
  align-content: center;
}

.playlist-desc.list > a,
.playlist-desc.list > p {
  width: 100%;
}

.playlist-item:hover .playlist-desc a {
  color: var(--accent-font-light);
  text-shadow: 0 0 8px rgba(var(--accent-font-light-rgb), 0.3);
}

/* download page */
.icon-text {
  background-color: var(--highlight-bg);
  text-align: center;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.icon-text:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.icon-text img {
  filter: var(--img-filter);
  cursor: pointer;
  transition: transform 0.3s ease;
}

.icon-text img:hover {
  transform: scale(1.15);
  filter: var(--img-filter) drop-shadow(0 0 5px var(--accent-font-light));
}

.task-control-icons {
  display: flex;
  justify-content: center;
  margin-top: 15px;
}

.task-control-icons img {
  width: 30px;
  cursor: pointer;
  margin: 5px;
  transition: transform 0.3s ease, filter 0.3s ease;
}

.task-control-icons img:hover {
  transform: scale(1.15);
}

#stop-icon {
  filter: var(--img-filter);
}

#stop-icon:hover {
  filter: var(--img-filter) drop-shadow(0 0 5px var(--accent-font-light));
}

#kill-icon {
  filter: var(--img-filter-error);
}

#kill-icon:hover {
  filter: var(--img-filter-error) drop-shadow(0 0 5px var(--highlight-error));
}

.title-split {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* status message */
.notification {
  position: relative;
  background-color: var(--highlight-bg);
  text-align: center;
  padding: 30px 15px 15px;
  margin: 1rem 0;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.notification.info {
  background-color: var(--highlight-bg);
  border-left: 5px solid var(--accent-font-light);
}

.notification.error {
  background-color: var(--highlight-error);
  border-left: 5px solid #d62828;
}

.notification.error h3 {
  color: #fff;
}

/* channel settings */
.settings-box-wrapper {
  display: grid;
  grid-template-columns: 33% 1fr;
  width: 100%;
  align-items: center;
  padding-bottom: 15px;
  margin-bottom: 15px;
  border-bottom: 1px solid rgba(var(--accent-font-light-rgb), 0.2);
}

.settings-box-wrapper input:not([type='checkbox']) {
  min-width: 300px;
  border-radius: 8px;
}

/* settings */
.settings-group {
  background-color: var(--highlight-bg);
  padding: 25px;
  margin: 25px 0;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.settings-group:hover {
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.settings-item {
  margin-top: 25px;
}

.settings-item input {
  min-width: 300px;
  border-radius: 8px;
}

.settings-item .agg-channel-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.settings-item .agg-channel-table th,
.settings-item .agg-channel-table td {
  padding: 10px 15px;
  border-bottom: 1px solid rgba(var(--accent-font-light-rgb), 0.2);
}

.settings-item .agg-channel-table tr:last-child td {
  border-bottom: none;
}

.settings-item .agg-channel-table th {
  background-color: rgba(var(--accent-font-dark-rgb), 0.1);
  color: var(--accent-font-dark);
  font-weight: bold;
}

.settings-item .agg-channel-table tr:hover td {
  background-color: rgba(var(--accent-font-light-rgb), 0.05);
}

.settings-item .agg-channel-right-align {
  white-space: nowrap;
  text-align: right;
}

.danger-zone {
  background-color: var(--highlight-error);
  color: #fff;
  padding: 8px 12px;
  border-radius: 4px;
  font-weight: bold;
  transition: all 0.3s ease;
}

.danger-zone:hover {
  background-color: var(--highlight-error-light);
  box-shadow: 0 0 15px rgba(var(--highlight-error-rgb), 0.5);
}

.backup-grid-row {
  display: grid;
  grid-template-columns: 10% 10% 10% auto;
  align-items: center;
  padding: 12px 15px;
  border-bottom: solid 1px;
  border-color: var(--main-font);
  border-radius: 8px;
  margin-bottom: 5px;
  transition: all 0.3s ease;
}

.backup-grid-row:hover {
  background-color: rgba(var(--accent-font-light-rgb), 0.05);
  transform: translateX(5px);
}

.backup-grid-row > span {
  margin-left: 10px;
}

/* about */
.about-section {
  padding: 30px;
  background-color: var(--highlight-bg);
  margin: 20px 0;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.about-section ol {
  margin-left: 20px;
}

.about-section ul {
  margin-top: 15px;
  list-style-type: none;
}

.about-section li {
  margin-bottom: 15px;
  position: relative;
  padding-left: 25px;
}

.about-section ol li {
  padding-left: 10px;
}

.about-section ul li::before {
  content: '•';
  position: absolute;
  left: 0;
  color: var(--accent-font-light);
  font-size: 1.5em;
}

.about-icon img {
  margin-left: 8px;
  width: 20px;
  cursor: unset;
  transition: transform 0.3s ease;
}

.about-icon:hover img {
  transform: scale(1.15);
}

/* animation */
.rotate-img {
  animation: rotation 4s infinite linear;
}

.bounce-img {
  animation: bounce 1.5s infinite ease-in-out alternate;
}

.pulse-img {
  animation: pulse 1.5s infinite ease-in-out alternate;
}

@keyframes rotation {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(359deg);
  }
}

@keyframes bounce {
  0% {
    transform: translateY(-5%);
  }
  100% {
    transform: translateY(5%);
    scale: 1.15;
  }
}

@keyframes pulse {
  0% {
    scale: 1;
    filter: brightness(100%);
  }
  100% {
    scale: 1.15;
    filter: brightness(120%);
  }
}

/* Neon text and glow effects */
.neon-text {
  color: var(--accent-font-light);
  text-shadow: 0 0 5px var(--accent-font-light),
               0 0 10px var(--accent-font-light),
               0 0 20px var(--accent-font-light);
  animation: neon-pulse 1.5s infinite alternate;
}

@keyframes neon-pulse {
  0% {
    text-shadow: 0 0 5px var(--accent-font-light),
                 0 0 10px var(--accent-font-light);
  }
  100% {
    text-shadow: 0 0 10px var(--accent-font-light),
                 0 0 20px var(--accent-font-light),
                 0 0 30px var(--accent-font-light);
  }
}

.glowing-border {
  border: 2px solid var(--accent-font-light);
  box-shadow: 0 0 5px var(--accent-font-light),
              0 0 10px var(--accent-font-light);
  animation: border-pulse 1.5s infinite alternate;
}

@keyframes border-pulse {
  0% {
    box-shadow: 0 0 5px var(--accent-font-light);
  }
  100% {
    box-shadow: 0 0 10px var(--accent-font-light),
                0 0 20px var(--accent-font-light);
  }
}

/* Add CSS variables for RGB color values to enable transparent overlays */
:root {
  --accent-font-dark-rgb: 67, 97, 238; /* Corresponds to #4361ee */
  --accent-font-light-rgb: 76, 201, 240; /* Corresponds to #4cc9f0 */
  --highlight-error-rgb: 239, 71, 111; /* Corresponds to #ef476f */
  --highlight-bg-rgb: 240, 240, 240; /* Corresponds to #f0f0f0 in light mode */
}

[data-theme="dark"] {
  --highlight-bg-rgb: 30, 30, 30; /* Corresponds to #1e1e1e in dark mode */
}

/* tablet */
@media screen and (max-width: 1000px), screen and (max-height: 850px) {
  .boxed-content,
  .boxed-content.boxed-4,
  .boxed-content.boxed-5,
  .boxed-content.boxed-6,
  .boxed-content.boxed-7 {
    width: 90%;
  }
  .video-list.grid.grid-3,
  .video-list.grid.grid-4,
  .video-list.grid.grid-5,
  .video-list.grid.grid-6,
  .video-list.grid.grid-7,
  .channel-list.grid,
  .playlist-list.grid {
    grid-template-columns: 1fr 1fr;
  }
  .video-item.list,
  .playlist-item.list {
    display: grid;
    grid-template-columns: 35% auto;
  }
  .two-col {
    display: block;
  }
  .two-col > div {
    width: 100%;
    margin-bottom: 20px;
  }
  .top-nav {
    flex-wrap: wrap-reverse;
    display: flex;
  }
  .nav-icons {
    width: 100%;
    justify-content: center;
    position: unset;
    transform: unset;
    margin-bottom: 15px;
  }
  .grid-count {
    display: none;
  }
  .video-player {
    height: unset;
    padding: 20px 0;
  }
  .video-player video {
    width: 90%;
  }
  .info-box-3,
  .info-box-4 {
    grid-template-columns: 1fr;
  }
}

/* phone */
@media screen and (max-width: 600px) {
  * {
    word-wrap: anywhere;
  }
  .video-list.grid.grid-3,
  .video-list.grid.grid-4,
  .video-list.grid.grid-5,
  .video-list.grid.grid-6,
  .video-list.grid.grid-7,
  .channel-list.grid,
  .video-item.list,
  .playlist-list.list,
  .playlist-list.grid,
  .info-box-2,
  .overwrite-form {
    grid-template-columns: 1fr;
  }
  .settings-box-wrapper {
    grid-template-columns: 1fr;
    padding: 1.2rem 0;
  }
  .playlist-item.list {
    display: block;
  }
  .video-desc.grid {
    height: unset;
    display: flex;
    flex-wrap: wrap-reverse;
  }
  .boxed-content {
    width: 95%;
  }
  .footer {
    text-align: center;
  }
  .footer .boxed-content span {
    width: 100%;
    display: block;
  }
  .toggle {
    flex-wrap: wrap;
  }
  .nav-items {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
  .nav-item {
    padding: 5px 0;
    margin: 15px;
    text-align: center;
  }
  .view-controls.three {
    grid-template-columns: unset;
    justify-content: center;
  }
  .sort {
    display: block;
  }
  .sort select {
    margin: unset;
  }
  .description-box {
    display: block;
  }
  .backup-grid-row {
    display: flex;
    flex-wrap: wrap;
    padding: 10px 0;
    justify-content: center;
  }
  .backup-grid-row span {
    padding: 5px 0;
  }
  .playlist-nav {
    display: block;
    grid-template-columns: unset;
  }
  .playlist-nav-item {
    display: block;
    justify-content: unset;
    margin-bottom: 15px;
  }
  .playlist-nav-item img {
    width: 100%;
  }
  .td,
  th,
  span,
  label {
    text-align: unset;
  }
}

.video-popup-menu img {
  width: 12px;
  cursor: pointer;
  filter: var(--img-filter);
  transition: transform 0.3s ease;
}

.video-popup-menu img:hover {
  transform: scale(1.15);
}

.video-popup-menu {
  border-top: 2px solid;
  border-color: var(--accent-font-dark);
  margin: 5px 0;
  padding: 12px 0;
  border-radius: 0 0 8px 8px;
  background-color: rgba(var(--highlight-bg-rgb), 0.95);
  backdrop-filter: blur(5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.video-popup-menu img.move-video-button {
  width: 24px;
  cursor: pointer;
  filter: var(--img-filter);
  transition: transform 0.3s ease;
}

.video-popup-menu img.move-video-button:hover {
  transform: scale(1.15);
}

.video-popup-menu-close-button {
  cursor: pointer;
  filter: var(--img-filter);
  float: right;
  transition: transform 0.3s ease;
}

.video-popup-menu-close-button:hover {
  transform: scale(1.15) rotate(90deg);
}

.video-desc-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/** loading indicator */
/** source: https://github.com/loadingio/css-spinner/ */
.lds-ring,
.lds-ring div {
  box-sizing: border-box;
}
.lds-ring {
  display: inline-block;
  position: relative;
  width: 20px;
  height: 20px;
  margin-right: 10px;
}
.lds-ring div {
  box-sizing: border-box;
  display: block;
  position: absolute;
  width: 20px;
  height: 20px;
  border: 4px solid currentColor;
  border-radius: 50%;
  animation: lds-ring 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
  border-color: currentColor transparent transparent transparent;
}
.lds-ring div:nth-child(1) {
  animation-delay: -0.45s;
}
.lds-ring div:nth-child(2) {
  animation-delay: -0.3s;
}
.lds-ring div:nth-child(3) {
  animation-delay: -0.15s;
}
@keyframes lds-ring {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
        `;

        // Add the style element to the document head
        document.head.appendChild(modernStyle);

        // Apply the saved color theme
        applyColorTheme(getSavedColors());
    }

    // Function to show the configuration dialog
    function showConfigDialog() {
        // If a dialog is already open, close it
        const existingDialog = document.getElementById('modern-css-config-dialog');
        if (existingDialog) {
            document.body.removeChild(existingDialog);
            return;
        }

        // Create modal container
        const modal = document.createElement('div');
        modal.id = 'modern-css-config-dialog';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            font-family: Arial, sans-serif;
        `;

        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background-color: white;
            padding: 25px;
            border-radius: 12px;
            width: 500px;
            max-width: 90%;
            max-height: 90%;
            overflow-y: auto;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            position: relative;
        `;

        // Add heading
        const heading = document.createElement('h2');
        heading.textContent = 'Color Configuration';
        heading.style.cssText = `
            margin-top: 0;
            margin-bottom: 25px;
            color: #333;
            font-size: 1.5em;
            text-align: center;
            border-bottom: 2px solid #eee;
            padding-bottom: 10px;
        `;
        modalContent.appendChild(heading);

        // Get saved colors
        const savedColors = getSavedColors();

        // Color config explanations
        const colorDescriptions = {
            mainBg: "Background color for the site",
            mainFont: "Main text color",
            highlightBg: "Background color for cards and containers",
            accentDark: "Primary accent color (buttons, borders)",
            accentLight: "Secondary accent color (highlights, hover effects)",
            highlightError: "Error message color",
            highlightErrorLight: "Error hover color"
        };

        // Add color inputs for each configurable color
        for (const [key, defaultValue] of Object.entries(defaultColors)) {
            const inputGroup = document.createElement('div');
            inputGroup.style.cssText = `
                margin-bottom: 20px;
                display: flex;
                align-items: center;
            `;

            // Add label container
            const labelContainer = document.createElement('div');
            labelContainer.style.cssText = `
                flex: 1;
                margin-right: 15px;
            `;

            // Add label
            const label = document.createElement('label');
            const readableName = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()); // Convert camelCase to Title Case with spaces
            label.textContent = readableName;
            label.style.cssText = `
                display: block;
                font-weight: bold;
                margin-bottom: 3px;
            `;
            labelContainer.appendChild(label);

            // Add description
            if (colorDescriptions[key]) {
                const description = document.createElement('small');
                description.textContent = colorDescriptions[key];
                description.style.cssText = `
                    display: block;
                    color: #777;
                    font-size: 0.85em;
                `;
                labelContainer.appendChild(description);
            }

            inputGroup.appendChild(labelContainer);

            // Add color preview
            const colorPreview = document.createElement('div');
            colorPreview.style.cssText = `
                width: 24px;
                height: 24px;
                border: 1px solid #ccc;
                margin-right: 10px;
                background-color: ${savedColors[key]};
                border-radius: 4px;
            `;
            inputGroup.appendChild(colorPreview);

            // Add color input
            const input = document.createElement('input');
            input.type = 'color';
            input.value = savedColors[key];
            input.dataset.key = key;
            input.style.cssText = `
                width: 40px;
                height: 24px;
                padding: 0;
                border: none;
                cursor: pointer;
            `;
            input.addEventListener('input', function() {
                colorPreview.style.backgroundColor = this.value;

                // Live preview of changes
                const tempColors = getSavedColors();
                tempColors[key] = this.value;
                applyColorTheme(tempColors);

                // Update the seed value
                seedDisplay.textContent = generateSeed(tempColors);
            });
            inputGroup.appendChild(input);

            modalContent.appendChild(inputGroup);
        }

        // Add button container
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            display: flex;
            justify-content: center;
            gap: 15px;
            margin-top: 25px;
        `;

        // Add save button
        const saveButton = document.createElement('button');
        saveButton.textContent = 'Save Configuration';
        saveButton.style.cssText = `
            background-color: #4361ee;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: bold;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        `;
        saveButton.addEventListener('click', function() {
            // Save all color values
            const colorInputs = modalContent.querySelectorAll('input[type="color"]');
            colorInputs.forEach(input => {
                GM_setValue(input.dataset.key, input.value);
            });

            // Apply the new colors
            applyColorTheme(getSavedColors());

            // Close the modal
            document.body.removeChild(modal);

            // Show a confirmation tooltip
            showToast('Color configuration saved!');
        });
        buttonContainer.appendChild(saveButton);

        // Add reset button
        const resetButton = document.createElement('button');
        resetButton.textContent = 'Reset to Defaults';
        resetButton.style.cssText = `
            background-color: #ef476f;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: bold;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        `;
        resetButton.addEventListener('click', function() {
            // Reset all colors to defaults
            for (const [key, defaultValue] of Object.entries(defaultColors)) {
                GM_setValue(key, defaultValue);
            }

            // Update the UI
            const colorInputs = modalContent.querySelectorAll('input[type="color"]');
            colorInputs.forEach(input => {
                const key = input.dataset.key;
                input.value = defaultColors[key];
                input.previousElementSibling.style.backgroundColor = defaultColors[key];
            });

            // Apply the default colors
            applyColorTheme(defaultColors);

            // Update the seed value
            seedDisplay.textContent = generateSeed(defaultColors);

            // Show a confirmation tooltip
            showToast('Reset to default colors');
        });
        buttonContainer.appendChild(resetButton);

        modalContent.appendChild(buttonContainer);

        // Add separator
        const separator = document.createElement('hr');
        separator.style.cssText = `
            margin: 30px 0;
            border: none;
            border-top: 1px solid #eee;
        `;
        modalContent.appendChild(separator);

        // Add seed system section
        const seedSection = document.createElement('div');
        seedSection.style.cssText = `
            margin-top: 20px;
        `;

        // Add seed section title
        const seedTitle = document.createElement('h3');
        seedTitle.textContent = 'Share Your Theme';
        seedTitle.style.cssText = `
            font-size: 1.2em;
            margin-bottom: 15px;
            color: #333;
        `;
        seedSection.appendChild(seedTitle);

        // Add seed display section
        const seedDisplaySection = document.createElement('div');
        seedDisplaySection.style.cssText = `
            margin-bottom: 20px;
        `;

        // Add seed description
        const seedDescription = document.createElement('p');
        seedDescription.textContent = 'Your theme seed:';
        seedDescription.style.cssText = `
            margin-bottom: 8px;
            font-size: 0.9em;
            color: #555;
        `;
        seedDisplaySection.appendChild(seedDescription);

        // Add seed display
        const seedDisplayContainer = document.createElement('div');
        seedDisplayContainer.style.cssText = `
            display: flex;
            align-items: center;
        `;

        const seedDisplay = document.createElement('code');
        seedDisplay.textContent = generateSeed(savedColors);
        seedDisplay.style.cssText = `
            display: block;
            padding: 10px;
            background-color: #f5f5f5;
            border-radius: 6px;
            font-family: monospace;
            font-size: 0.8em;
            overflow: auto;
            white-space: nowrap;
            flex: 1;
            border: 1px solid #ddd;
            color: #333;
            cursor: pointer;
            margin-right: 10px;
        `;
        seedDisplay.title = "Click to copy to clipboard";
        seedDisplay.addEventListener('click', function() {
            // Use GM_setClipboard for more reliable clipboard access
            try {
                GM_setClipboard(this.textContent);
                showToast('Theme seed copied to clipboard!');
            } catch (err) {
                console.error('Could not copy seed: ', err);
                showToast('Failed to copy. Select and copy manually.');
            }
        });
        seedDisplayContainer.appendChild(seedDisplay);

        // Add copy button
        const copyButton = document.createElement('button');
        copyButton.textContent = 'Copy';
        copyButton.style.cssText = `
            background-color: #555;
            color: white;
            border: none;
            padding: 8px 12px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.8em;
        `;
        copyButton.addEventListener('click', function() {
            // Use GM_setClipboard for more reliable clipboard access
            try {
                GM_setClipboard(seedDisplay.textContent);
                showToast('Theme seed copied to clipboard!');
            } catch (err) {
                console.error('Could not copy seed: ', err);
                showToast('Failed to copy. Select and copy manually.');
            }
        });
        seedDisplayContainer.appendChild(copyButton);

        seedDisplaySection.appendChild(seedDisplayContainer);
        seedSection.appendChild(seedDisplaySection);

        // Add import section
        const importSection = document.createElement('div');
        importSection.style.cssText = `
            margin-top: 20px;
        `;

        // Add import description
        const importDescription = document.createElement('p');
        importDescription.textContent = 'Import a theme seed:';
        importDescription.style.cssText = `
            margin-bottom: 8px;
            font-size: 0.9em;
            color: #555;
        `;
        importSection.appendChild(importDescription);

        // Add import input group
        const importInputGroup = document.createElement('div');
        importInputGroup.style.cssText = `
            display: flex;
            gap: 10px;
        `;

        // Add import input
        const importInput = document.createElement('input');
        importInput.type = 'text';
        importInput.placeholder = 'Paste a theme seed here...';
        importInput.style.cssText = `
            flex: 1;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 6px;
            font-family: monospace;
            font-size: 0.8em;
            color: #333;
            background-color: #f5f5f5;
        `;
        importInputGroup.appendChild(importInput);

        // Add import button
        const importButton = document.createElement('button');
        importButton.textContent = 'Import';
        importButton.style.cssText = `
            background-color: #4361ee;
            color: white;
            border: none;
            padding: 8px 12px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.8em;
            min-width: 80px;
        `;
        importButton.addEventListener('click', function() {
            const seed = importInput.value.trim();
            if (!seed) {
                showToast('Please enter a theme seed to import.');
                return;
            }

            console.log("Importing seed:", seed);
            const result = importSeed(seed);

            if (result.success) {
                // Update color inputs to reflect imported values
                const colorInputs = modalContent.querySelectorAll('input[type="color"]');
                const importedColors = getSavedColors();

                colorInputs.forEach(input => {
                    const key = input.dataset.key;
                    input.value = importedColors[key];
                    input.previousElementSibling.style.backgroundColor = importedColors[key];
                });

                // Update the seed display
                seedDisplay.textContent = seed;

                // Show the revert button
                revertButton.style.display = 'block';

                showToast(result.message);
            } else {
                showToast(result.message);
            }
        });
        importInputGroup.appendChild(importButton);

        // Add revert button
        const revertButton = document.createElement('button');
        revertButton.textContent = 'Revert';
        revertButton.style.cssText = `
            background-color: #777;
            color: white;
            border: none;
            padding: 8px 12px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.8em;
            min-width: 80px;
            display: none; /* Hidden by default */
        `;
        revertButton.addEventListener('click', function() {
            console.log("Reverting to previous theme");
            const result = revertImport();

            if (result.success) {
                // Update color inputs to reflect reverted values
                const colorInputs = modalContent.querySelectorAll('input[type="color"]');
                const revertedColors = getSavedColors();

                colorInputs.forEach(input => {
                    const key = input.dataset.key;
                    input.value = revertedColors[key];
                    input.previousElementSibling.style.backgroundColor = revertedColors[key];
                });

                // Update the seed display
                seedDisplay.textContent = generateSeed(revertedColors);

                // Hide the revert button
                this.style.display = 'none';

                showToast(result.message);
            } else {
                showToast(result.message);
            }
        });
        importInputGroup.appendChild(revertButton);

        importSection.appendChild(importInputGroup);

        // Add import note
        const importNote = document.createElement('p');
        importNote.textContent = 'Note: Importing a theme will apply it immediately. Use the Revert button to undo import.';
        importNote.style.cssText = `
            margin-top: 8px;
            font-size: 0.8em;
            color: #777;
            font-style: italic;
        `;
        importSection.appendChild(importNote);

        seedSection.appendChild(importSection);
        modalContent.appendChild(seedSection);

        // Add close button (X)
        const closeButton = document.createElement('span');
        closeButton.textContent = '×';
        closeButton.style.cssText = `
            position: absolute;
            top: 10px;
            right: 15px;
            cursor: pointer;
            font-size: 28px;
            color: #777;
            width: 30px;
            height: 30px;
            line-height: 30px;
            text-align: center;
            border-radius: 50%;
        `;
        closeButton.addEventListener('click', function() {
            document.body.removeChild(modal);
        });
        closeButton.addEventListener('mouseover', function() {
            this.style.backgroundColor = '#f2f2f2';
        });
        closeButton.addEventListener('mouseout', function() {
            this.style.backgroundColor = 'transparent';
        });
        modalContent.appendChild(closeButton);

        // Add close on click outside
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });

        // Add modal content to modal container
        modal.appendChild(modalContent);

        // Add modal to body
        document.body.appendChild(modal);

        // Check if there was a previous import to show the revert button
        const previousColorsString = GM_getValue('previousColors', null);
        if (previousColorsString) {
            revertButton.style.display = 'block';
        }
    }

    // Function to show a toast message
    function showToast(message) {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background-color: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px 20px;
            border-radius: 8px;
            font-family: Arial, sans-serif;
            font-size: 14px;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
            z-index: 10000;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);

        // Fade in
        setTimeout(() => {
            toast.style.opacity = '1';
        }, 10);

        // Fade out and remove
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }

    // Register the menu command
    GM_registerMenuCommand("Configure Colors", showConfigDialog);

    // Add the CSS when the DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', addModernCSS);
    } else {
        addModernCSS();
    }
})();