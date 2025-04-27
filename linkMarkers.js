/**
 * Link Markers functionality for Sentinel Mk2
 * This script handles marking links on webpages with security indicators
 */

// Add debug logging
const DEBUG = true;
function log(message) {
  if (DEBUG) console.log('[Sentinel Link Markers]', message);
}

// Log that the script has loaded
log('Content script loaded');

// Store security ratings for domains
const domainSecurityRatings = {};

// Initialize link markers
function initLinkMarkers() {
  log('Initializing link markers');
  
  // Check if link markers are enabled in settings
  chrome.storage.sync.get(['enableLinkMarkers', 'markerStyle'], function(result) {
    log(`Settings retrieved: ${JSON.stringify(result)}`);
    
    if (result.enableLinkMarkers) {
      log('Link markers are enabled, applying...');
      // Register message listener for background script communications
      setupMessageListener();
      
      // Initial scan for links on the page
      applyLinkMarkers(result.markerStyle || 'icon');
    } else {
      log('Link markers are disabled');
      // Remove any existing markers
      removeAllMarkers();
    }
  });
}

// Set up listener for messages from popup or background
function setupMessageListener() {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    log(`Received message: ${JSON.stringify(request)}`);
    
    if (request.action === "updateDomainRating") {
      domainSecurityRatings[request.domain] = request.rating;
      applyLinkMarkers('icon'); // Default to icon if style not specified
      sendResponse({success: true});
    } 
    else if (request.action === "updateLinkMarkerSettings") {
      if (request.enableLinkMarkers) {
        applyLinkMarkers(request.markerStyle || 'icon');
      } else {
        removeAllMarkers();
      }
      sendResponse({success: true});
    }
    return true; // Keep the message channel open for async response
  });
}

// Apply markers to all links on the page
function applyLinkMarkers(style = 'icon') {
  log(`Applying link markers with style: ${style}`);
  
  // Find all links on the page
  const links = document.querySelectorAll('a[href^="http"]');
  log(`Found ${links.length} links to process`);
  
  links.forEach(link => {
    try {
      const url = new URL(link.href);
      const domain = url.hostname;
      
      // Check if we have a security rating for this domain
      if (domainSecurityRatings[domain]) {
        addMarkerToLink(link, domainSecurityRatings[domain], style);
      } else {
        // Request rating from background script
        requestDomainRating(domain);
      }
      
    } catch (e) {
      log(`Error processing link: ${e.message}`);
    }
  });
}

// Add visual marker to a link based on its security rating
function addMarkerToLink(link, rating, style) {
  // Remove any existing markers
  const existingMarker = link.querySelector('.sentinel-link-marker');
  if (existingMarker) {
    existingMarker.remove();
  }
  
  // Create marker element
  const marker = document.createElement('span');
  marker.className = 'sentinel-link-marker';
  
  // Determine marker class based on rating status, not score
  let markerClass = '';
  let markerIcon = '';
  
  // Use the same logic as vendor ratings in the overview tab
  if (rating === 'safe') {
    markerClass = 'sentinel-marker-safe';
    markerIcon = `<svg class="sentinel-marker-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
  } else if (rating === 'warning') {
    markerClass = 'sentinel-marker-warning';
    markerIcon = `<svg class="sentinel-marker-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
  } else {
    // Unsafe or danger rating
    markerClass = 'sentinel-marker-danger';
    markerIcon = `<svg class="sentinel-marker-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
  }
  
  // Apply styles based on user preference
  marker.classList.add(markerClass);
  
  if (style === 'icon' || style === 'both') {
    marker.innerHTML = markerIcon;
  } else if (style === 'color') {
    marker.innerHTML = '•';
  }
  
  // Add tooltip with security information
  marker.title = `Security rating: ${rating.toUpperCase()} - Analyzed by Sentinel`;
  
  // Add marker to the link
  link.appendChild(marker);
  
  // Add click handler for more information
  marker.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    log(`Marker clicked for ${link.href}`);
  });
}

// Remove all markers from the page
function removeAllMarkers() {
  log('Removing all link markers');
  const markers = document.querySelectorAll('.sentinel-link-marker');
  markers.forEach(marker => marker.remove());
}

// Request domain rating from the background script
function requestDomainRating(domain) {
  chrome.runtime.sendMessage({
    action: "getDomainRating",
    domain: domain
  });
}

// Show detailed security information in a popup
function showSecurityDetails(url) {
  chrome.runtime.sendMessage({
    action: "showSecurityDetails",
    url: url
  });
}

// Inject required CSS for markers
function injectMarkerStyles() {
  log('Injecting marker styles');
  const style = document.createElement('style');
  style.id = 'sentinel-marker-styles';
  style.textContent = `
    .sentinel-link-marker {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      margin-left: 4px;
      vertical-align: middle;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      cursor: pointer;
      transition: transform 0.2s ease;
    }
    
    .sentinel-link-marker:hover {
      transform: scale(1.2);
    }
    
    .sentinel-marker-icon {
      width: 12px;
      height: 12px;
    }
    
    .sentinel-marker-safe {
      background-color: rgba(0, 200, 83, 0.1);
      color: #00c853;
    }
    
    .sentinel-marker-warning {
      background-color: rgba(255, 214, 0, 0.1);
      color: #ffd600;
    }
    
    .sentinel-marker-danger {
      background-color: rgba(255, 61, 0, 0.1);
      color: #ff3d00;
    }
  `;
  document.head.appendChild(style);
}

// Initialize when DOM is fully loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    log('DOM content loaded');
    injectMarkerStyles();
    initLinkMarkers();
  });
} else {
  log('DOM already loaded');
  injectMarkerStyles();
  initLinkMarkers();
}

// Listen for dynamic content changes
const observer = new MutationObserver((mutations) => {
  chrome.storage.sync.get(['enableLinkMarkers', 'markerStyle'], function(result) {
    if (result.enableLinkMarkers) {
      log('DOM mutation detected, updating markers');
      applyLinkMarkers(result.markerStyle || 'icon');
    }
  });
});

// Start observing changes to the DOM
observer.observe(document.body, {
  childList: true,
  subtree: true
});
