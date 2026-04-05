// ==UserScript==
// @name         Open YouTube in LiveContainer
// @version      3.0.0
// @author       Modified
// @match        *://*.youtube.com/*
// @match        *://*.youtu.be/*
// @match        *://*.yahoo.com/*
// @match        *://*.bing.com/*
// @match        *://*.duckduckgo.com/*
// @match        *://*.ecosia.org/*
// @match        *://*.google.*/*
// @grant        none
// ==/UserScript==

// ---------- Base64 safe encoding ----------
function base64Encode(str) {
	try {
		return btoa(unescape(encodeURIComponent(str)));
	} catch (e) {
		console.error('Base64 encode error:', e);
		return null;
	}
}

// ---------- Convert URL ----------
function convertToYoutubeUrl(urlString) {
	try {
		const url = new URL(urlString);
		const hostname = url.hostname.toLowerCase();

		// Only process YouTube links
		if (!hostname.includes('youtube.com') && !hostname.includes('youtu.be')) {
			return null;
		}

		// Skip redirect loops
		if (url.pathname === '/redirect') {
			return null;
		}

		const encoded = base64Encode(url.href);
		if (!encoded) return null;

		// ✅ LiveContainer deep link
		return `livecontainer://open-web-page?url=${encoded}`;

	} catch (error) {
		console.error('Error converting URL:', error);
		return null;
	}
}

// ---------- Open when already on YouTube ----------
function openInYoutube() {
	if (window.self !== window.top) return;
	if (window.location.pathname === '/redirect') return;

	const newUrl = convertToYoutubeUrl(window.location.href);
	if (newUrl) {
		window.location.href = newUrl;
	}
}

// ---------- Modify search results ----------
function processSearchResults() {
	const links = document.querySelectorAll('a:not([data-lc-added])');

	links.forEach(link => {
		const href = link.href;
		if (!href) return;

		try {
			const url = new URL(href);
			const hostname = url.hostname.toLowerCase();

			if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
				const newUrl = convertToYoutubeUrl(href);
				if (!newUrl) return;

				link.setAttribute('data-lc-added', 'true');

				link.addEventListener('click', (event) => {
					event.preventDefault();
					event.stopPropagation();
					window.location.href = newUrl;
				}, { capture: true });
			}
		} catch (e) {
			// ignore invalid URLs
		}
	});
}

// ---------- Init ----------
if (location.hostname.includes('youtube.com') || location.hostname.includes('youtu.be')) {
	openInYoutube();
} else {
	processSearchResults();

	const observer = new MutationObserver(() => {
		processSearchResults();
	});

	observer.observe(document.body, {
		childList: true,
		subtree: true
	});
}
