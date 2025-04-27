console.log("popup.js loaded");

// More aggressive approach to disable analytics - define before any imports
if (typeof window !== 'undefined') {
  window.SCREENPIPE_CONFIG = {
    disableAnalytics: true,
    disableSSE: true,
    disablePostHog: true,
    disableReporting: true,
    disableErrorLogging: true,
    disable_external_dependency_loading: true
  };

  // Block analytics/PostHog requests at fetch level
  const origFetch = window.fetch;
  window.fetch = function(url, ...args) {
    if (typeof url === 'string' && (
      url.includes('posthog.com') ||
      url.includes('analytics') ||
      url.includes('telemetry')
    )) {
      console.log('Blocked analytics/PostHog request:', url);
      return Promise.resolve(new Response('{}', {status: 200}));
    }
    return origFetch.apply(this, [url, ...args]);
  };
}

// Import modules - after analytics blocking
const screenpipe = require('@screenpipe/browser');

// --- PATCH PostHog/Screenpipe analytics loader to prevent CSP errors ---
if (window && window.__PosthogExtensions__ && typeof window.__PosthogExtensions__.loadExternalDependency === 'function') {
  window.__PosthogExtensions__.loadExternalDependency = function(instance, script, cb) {
    // Prevent loading any external analytics scripts
    if (typeof cb === 'function') cb("Blocked by extension CSP patch");
  };
}

// --- PATCH Screenpipe SDK to block remote config and SSE ---
if (screenpipe && screenpipe.pipe) {
  // Patch any method that tries to load remote config or analytics
  if (screenpipe.pipe.initAnalyticsIfNeeded) {
    screenpipe.pipe.initAnalyticsIfNeeded = async () => {
      // No-op: always return analytics disabled
      return { analyticsEnabled: false, userId: undefined, email: undefined };
    };
  }
  if (screenpipe.pipe._loadRemoteConfigJs) {
    screenpipe.pipe._loadRemoteConfigJs = () => {};
  }
  if (screenpipe.pipe._loadRemoteConfigJSON) {
    screenpipe.pipe._loadRemoteConfigJSON = () => {};
  }
  if (screenpipe.pipe._loadSSESettings) {
    screenpipe.pipe._loadSSESettings = () => {};
  }
}

// Cache for screen data
let cachedScreenData = null;

// Global variables for real-time scanning
let autoScanEnabled = true;
let scanInterval = 10; // minutes
let notificationsEnabled = true;
let notifyThreshold = 'high';
let nextScanTimeoutId = null;
let historyRetention = 30; // days

// Cache for scan history
let scanHistory = [];

document.addEventListener('DOMContentLoaded', async function() {
  // Initialize tabs
  initTabs();
  
  // Get site information for the current tab
  await getSiteInfo();
  
  // Setup event listeners
  setupEventListeners();
  
  // Load API key from storage
  loadApiKey();
  
  // Initialize security analysis
  initSecurityAnalysis();

  // Set default content type from settings (original functionality)
  try {
    const { defaultContentType } = await chrome.storage.sync.get(['defaultContentType']);
    if (defaultContentType) {
      document.getElementById("contentType").value = defaultContentType;
    }
  } catch (error) {
    console.error('Failed to load default content type:', error);
  }

  // Check that background script is responsive (original functionality)
  chrome.runtime.sendMessage({ action: "ping" }, response => {
    console.log("Background status:", response?.status || "No response");
  });

  // Load scan settings
  loadScanSettings();
  
  // Initialize auto scanning if enabled
  if (autoScanEnabled) {
    scheduleNextScan();
  }
  
  // Load scan history
  await loadScanHistory();

  // Initialize Link Markers UI
  initLinkMarkersUI();
  
  // Add event listeners for Link Markers
  addLinkMarkerEventListeners();

  // Initialize toggle switches
  initializeToggleSwitches();
  
  // Add event listener for save button
  const saveSettingsBtn = document.getElementById('saveSettings');
  if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener('click', saveAllSettings);
  }
});

// Tab functionality
function initTabs() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove active class from all buttons and panes
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabPanes.forEach(pane => pane.classList.remove('active'));
      
      // Add active class to clicked button and corresponding pane
      button.classList.add('active');
      const tabId = button.dataset.tab;
      document.getElementById(tabId).classList.add('active');
    });
  });
}

// Get current site information
async function getSiteInfo() {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const currentTab = tabs[0];
    
    // Update site name and URL
    document.getElementById('site-name').textContent = currentTab.title || 'Unknown Site';
    document.getElementById('site-url').textContent = currentTab.url || 'Unknown URL';
    
    // Get and display favicon
    const faviconUrl = currentTab.favIconUrl || 'icons/globe.png';
    document.getElementById('site-icon').src = faviconUrl;
    
    // Store current URL for later use
    window.currentUrl = currentTab.url;
  } catch (error) {
    console.error('Error getting site info:', error);
  }
}

// Setup event listeners
function setupEventListeners() {
  // Save API key button
  const saveApiKeyBtn = document.getElementById('save-api-key');
  if (saveApiKeyBtn) {
    saveApiKeyBtn.addEventListener('click', saveApiKey);
  }
  
  // Chat input and send button
  const chatInput = document.getElementById('chat-input');
  const sendBtn = document.getElementById('send-btn');
  
  if (chatInput && sendBtn) {
    sendBtn.addEventListener('click', () => handleChatInput(chatInput.value));
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        handleChatInput(chatInput.value);
      }
    });
  }
  
  // Original functionality - Fetch data button handler
  const fetchDataBtn = document.getElementById("fetchData");
  if (fetchDataBtn) {
    fetchDataBtn.addEventListener("click", fetchScreenData);
  }
  
  // Original functionality - Display captured content button
  const displayContentBtn = document.getElementById("displayContent");
  if (displayContentBtn) {
    displayContentBtn.addEventListener("click", displayScreenContent);
  }
  
  // Original functionality - Filter content button handler
  const filterContentBtn = document.getElementById("filterContent");
  if (filterContentBtn) {
    filterContentBtn.addEventListener("click", filterContent);
  }
  
  // Original functionality - Settings link handler
  const openSettingsBtn = document.getElementById("openSettings");
  if (openSettingsBtn) {
    openSettingsBtn.addEventListener("click", () => {
      // Show the settings tab
      const tabButtons = document.querySelectorAll('.tab-btn');
      const tabPanes = document.querySelectorAll('.tab-pane');
      
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabPanes.forEach(pane => pane.classList.remove('active'));
      
      const settingsPane = document.getElementById('settings');
      if (settingsPane) {
        settingsPane.classList.add('active');
      }
    });
  }

  // Real-time tab event handlers
  const analyzeDataBtn = document.getElementById('analyzeData');
  if (analyzeDataBtn) {
    analyzeDataBtn.addEventListener('click', analyzeScreenData);
  }
  
  // History tab event handlers
  const refreshHistoryBtn = document.getElementById('refreshHistory');
  if (refreshHistoryBtn) {
    refreshHistoryBtn.addEventListener('click', refreshScanHistory);
  }
  
  const historyPeriodSelect = document.getElementById('historyPeriod');
  if (historyPeriodSelect) {
    historyPeriodSelect.addEventListener('change', filterScanHistory);
  }
  
  // Settings tab event handlers
  const saveSettingsBtn = document.getElementById('saveSettings');
  if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener('click', saveScanSettings);
  }
  
  const enableAutoScanToggle = document.getElementById('enableAutoScan');
  if (enableAutoScanToggle) {
    enableAutoScanToggle.addEventListener('change', function() {
      const scanIntervalSelect = document.getElementById('scanInterval');
      if (scanIntervalSelect) {
        scanIntervalSelect.disabled = !this.checked;
      }
    });
  }
  
  const clearHistoryBtn = document.getElementById('clearHistory');
  if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener('click', clearScanHistory);
  }
  
  const saveGroqApiKeyBtn = document.getElementById('saveGroqApiKey');
  if (saveGroqApiKeyBtn) {
    saveGroqApiKeyBtn.addEventListener('click', saveGroqApiKey);
  }
}

// Handle chat input
async function handleChatInput(message) {
  if (!message.trim()) return;
  
  const chatInput = document.getElementById('chat-input');
  const chatMessages = document.getElementById('chat-messages');
  
  // Clear input
  chatInput.value = '';
  
  // Add user message to chat
  addMessageToChat('user', message);
  
  // Show loading indicator
  const assistantMessage = addMessageToChat('assistant', '...');
  
  try {
    // Get API key from storage
    const apiKey = await getApiKey();
    if (!apiKey) {
      updateAssistantMessage(assistantMessage, 'Please add your Groq API key in the settings below.');
      return;
    }
    
    // Get current URL context
    const currentUrlContext = `This question is about the website: ${window.currentUrl}`;
    const securityContext = generateSecurityContext();
    
    // Send to Groq API
    const response = await queryGroqAPI(message, apiKey, currentUrlContext, securityContext);
    
    // Update assistant message with response
    updateAssistantMessage(assistantMessage, response);
  } catch (error) {
    console.error('Error processing message:', error);
    updateAssistantMessage(assistantMessage, 'Sorry, there was an error processing your request.');
  }
}

// Generate security context based on current analysis
function generateSecurityContext() {
  const connectionStatusEl = document.querySelector('#connection-status .value');
  const sslStatusEl = document.querySelector('#ssl-status .value');
  const riskScoreEl = document.querySelector('#risk-score .value');
  const securityHeadersEl = document.querySelector('#security-headers .value');
  const vendorRatingsEl = document.querySelector('#vendor-ratings .value');
  const securityScoreEl = document.getElementById('security-score-value');
  
  const connectionStatus = connectionStatusEl ? connectionStatusEl.textContent : 'Unknown';
  const sslStatus = sslStatusEl ? sslStatusEl.textContent : 'Unknown';
  const riskScore = riskScoreEl ? riskScoreEl.textContent : 'Unknown';
  const securityHeaders = securityHeadersEl ? securityHeadersEl.textContent : 'Unknown';
  const vendorRatings = vendorRatingsEl ? vendorRatingsEl.textContent : 'Unknown';
  const securityScore = securityScoreEl ? securityScoreEl.textContent : 'Unknown';
  
  return `Security analysis of this website:
Connection: ${connectionStatus}
SSL/TLS: ${sslStatus}
Risk Score: ${riskScore}
Security Headers: ${securityHeaders}
Vendor Ratings: ${vendorRatings}
Overall Security Score: ${securityScore}/100`;
}

// Add message to chat
function addMessageToChat(sender, content) {
  const chatMessages = document.getElementById('chat-messages');
  if (!chatMessages) return;
  
  const messageElement = document.createElement('div');
  messageElement.classList.add('chat-message', `${sender}-message`);
  messageElement.textContent = content;
  chatMessages.appendChild(messageElement);
  
  // Scroll to bottom
  chatMessages.scrollTop = chatMessages.scrollHeight;
  
  return messageElement;
}

// Update assistant message
function updateAssistantMessage(messageElement, content) {
  if (!messageElement) return;
  
  messageElement.textContent = content;
  
  // Scroll to bottom
  const chatMessages = document.getElementById('chat-messages');
  if (chatMessages) {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
}

// Query Groq API
async function queryGroqAPI(message, apiKey, urlContext, securityContext) {
  try {
    // Use background script as proxy to avoid CSP issues
    const response = await chrome.runtime.sendMessage({
      action: 'groqChatQuery',
      apiKey: apiKey,
      message: message,
      urlContext: urlContext,
      securityContext: securityContext,
      model: 'llama3-70b-8192' // Using Llama3 70B model
    });
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    return response.result;
  } catch (error) {
    console.error('Error querying Groq API:', error);
    return "I'm having trouble connecting to my AI service right now. Please check your API key in settings and ensure you have an internet connection.";
  }
}

// API key functions
async function saveApiKey() {
  const apiKeyInput = document.getElementById('api-key-input');
  if (!apiKeyInput) return;
  
  const apiKey = apiKeyInput.value.trim();
  
  if (apiKey) {
    try {
      await chrome.storage.sync.set({ 'sentinelApiKey': apiKey });
      apiKeyInput.value = '';
      apiKeyInput.placeholder = 'API key saved!';
      setTimeout(() => {
        apiKeyInput.placeholder = 'Enter Groq API Key';
      }, 3000);
    } catch (error) {
      console.error('Error saving API key:', error);
    }
  }
}

async function loadApiKey() {
  try {
    const data = await chrome.storage.sync.get('sentinelApiKey');
    const apiKey = data.sentinelApiKey;
    
    const apiKeyInput = document.getElementById('api-key-input');
    if (apiKey && apiKeyInput) {
      apiKeyInput.placeholder = 'API key is set';
    }
  } catch (error) {
    console.error('Error loading API key:', error);
  }
}

async function getApiKey() {
  try {
    const data = await chrome.storage.sync.get('sentinelApiKey');
    return data.sentinelApiKey;
  } catch (error) {
    console.error('Error getting API key:', error);
    return null;
  }
}

// Save Groq API key from settings tab
async function saveGroqApiKey() {
  const apiKeyInput = document.getElementById('groqApiKey');
  if (!apiKeyInput) return;
  
  const apiKey = apiKeyInput.value.trim();
  if (apiKey) {
    try {
      await chrome.storage.sync.set({ 'sentinelApiKey': apiKey });
      apiKeyInput.value = '';
      apiKeyInput.placeholder = 'API key saved!';
      setTimeout(() => {
        apiKeyInput.placeholder = 'Enter Groq API Key';
      }, 3000);
    } catch (error) {
      console.error('Error saving API key:', error);
    }
  }
}

// Security analysis functions
function initSecurityAnalysis() {
  // Start security analysis for current site
  analyzeSiteSecurity();
}

async function analyzeSiteSecurity() {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const currentTab = tabs[0];
    const url = new URL(currentTab.url);
    
    // Show loading indicators for all data fields
    updateSecurityItem('connection-status', 'Analyzing...', '');
    updateSecurityItem('ssl-status', 'Analyzing...', '');
    updateSecurityItem('risk-score', 'Analyzing...', '');
    updateSecurityItem('security-headers', 'Analyzing...', '');
    updateSecurityItem('domain-age', 'Analyzing...', '');
    updateSecurityItem('vendor-ratings', 'Analyzing...', '');
    
    const securityScoreEl = document.getElementById('security-score-value');
    if (securityScoreEl) {
      securityScoreEl.textContent = '...';
    }
    
    // Set up a timeout to ensure we always show something
    const analysisTimeout = setTimeout(() => {
      calculateAndDisplaySecurityScore();
    }, 5000); // 5 second timeout
    
    // Update connection status - Real check
    const isHttps = url.protocol === 'https:';
    updateSecurityItem('connection-status', isHttps ? 'Secure (HTTPS)' : 'Insecure (HTTP)', isHttps ? 'secure' : 'danger');
    
    // Get VirusTotal data - Real API data
    chrome.runtime.sendMessage({ action: 'getVirusTotalReport', url: currentTab.url }, (response) => {
      clearTimeout(analysisTimeout);
      
      if (response && response.report) {
        const report = response.report;
        
        // Update vendor ratings
        if (report.vendorRatings) {
          const { safe, warning, unsafe, total } = report.vendorRatings;
          
          let statusClass = 'secure';
          let statusText = 'Safe';
          
          // Fix logic to properly identify safe sites
          if (unsafe > 0 && unsafe > safe / 10) {
            // Only mark as unsafe if there are significant unsafe votes
            statusClass = 'danger';
            statusText = 'Unsafe';
          } else if (warning > safe && warning > 10) {
            // Only mark as warning if warnings are significant
            statusClass = 'warning';
            statusText = 'Warning';
          }
          // Otherwise stays "Safe"
          
          updateSecurityItem('vendor-ratings', 
            `${statusText} (${safe} Safe / ${warning} Warning / ${unsafe} Unsafe)`, 
            statusClass);
        } else {
          updateSecurityItem('vendor-ratings', 'No vendor data available', 'warning');
        }
        
        // Update domain age if available from VirusTotal
        if (report.lastAnalysisDate) {
          try {
            // Try to estimate domain age from VirusTotal data
            // Parse attributes.creation_date if available or use lastAnalysisDate as fallback
            const creationDate = report.creationDate ? new Date(report.creationDate * 1000) : null;
            
            if (creationDate) {
              const now = new Date();
              const ageInMilliseconds = now - creationDate;
              const ageInYears = Math.floor(ageInMilliseconds / (1000 * 60 * 60 * 24 * 365.25));
              const ageInMonths = Math.floor(ageInMilliseconds / (1000 * 60 * 60 * 24 * 30.44)) % 12;
              
              let ageClass = 'secure';
              if (ageInYears < 1) {
                ageClass = 'danger'; // New domains are more suspicious
              } else if (ageInYears < 2) {
                ageClass = 'warning'; // Relatively new domains get warning
              }
              
              updateSecurityItem('domain-age', 
                `${ageInYears} year${ageInYears !== 1 ? 's' : ''} ${ageInMonths > 0 ? `, ${ageInMonths} month${ageInMonths !== 1 ? 's' : ''}` : ''}`, 
                ageClass);
            } else {
              // If we don't have creation date, estimate from categories or other data
              const knownSafeDomains = [
                'google.com', 'microsoft.com', 'github.com', 'apple.com',
                'amazon.com', 'facebook.com', 'twitter.com', 'linkedin.com',
                'wikipedia.org', 'mozilla.org', 'adobe.com', 'cloudflare.com',
                'dropbox.com', 'instagram.com', 'netflix.com', 'spotify.com',
                'paypal.com', 'stripe.com', 'slack.com', 'zoom.us'
              ];
              
              const domain = url.hostname;
              const isKnownSafeDomain = knownSafeDomains.some(d => domain.includes(d));
              
              if (isKnownSafeDomain) {
                updateSecurityItem('domain-age', 'Established (10+ years)', 'secure');
              } else {
                updateSecurityItem('domain-age', 'Unknown age', 'warning');
              }
            }
          } catch (error) {
            console.error('Error processing domain age:', error);
            updateSecurityItem('domain-age', 'Unknown age', 'warning');
          }
        } else {
          updateSecurityItem('domain-age', 'Unknown age', 'warning');
        }
      } else {
        updateSecurityItem('vendor-ratings', 'No data available', 'warning');
        updateSecurityItem('domain-age', 'Unknown age', 'warning');
      }
      
      calculateAndDisplaySecurityScore();
    });
    
    // Analyze SSL/TLS - Real certificate check
    chrome.runtime.sendMessage({ action: 'checkCertificate', url: currentTab.url }, (response) => {
      if (response && response.certificate) {
        updateCertificateInfo(response.certificate);
        
        // Update SSL status
        const validSsl = response.certificate.valid;
        updateSecurityItem('ssl-status', validSsl ? 'Valid' : 'Invalid or Missing', validSsl ? 'secure' : 'danger');
      } else {
        updateSecurityItem('ssl-status', 'Unknown', 'warning');
      }
      
      calculateAndDisplaySecurityScore();
    });
    
    // Get security headers from background
    chrome.runtime.sendMessage({ action: 'getSecurityInfo', url: currentTab.url }, (response) => {
      if (response && response.securityInfo && response.securityInfo.securityHeaders) {
        const headers = response.securityInfo.securityHeaders;
        const presentHeaders = Object.keys(headers).filter(key => headers[key] !== null).length;
        const totalHeaders = Object.keys(headers).length;
        
        // Update security headers status
        const headerRatio = Math.round((presentHeaders / totalHeaders) * 100);
        let headerStatus = 'Poor';
        let headerClass = 'danger';
        
        if (headerRatio >= 70) {
          headerStatus = 'Good';
          headerClass = 'secure';
        } else if (headerRatio >= 40) {
          headerStatus = 'Moderate';
          headerClass = 'warning';
        }
        
        updateSecurityItem('security-headers', `${headerStatus} (${presentHeaders}/${totalHeaders})`, headerClass);
      } else {
        updateSecurityItem('security-headers', 'Unknown', 'warning');
      }
      
      calculateAndDisplaySecurityScore();
    });
    
    // Get risk score from background service
    chrome.runtime.sendMessage({ action: 'getRiskScore', url: currentTab.url }, (response) => {
      if (response && response.riskScore !== undefined) {
        // Update risk score
        const score = response.riskScore;
        let riskClass = 'danger';
        if (score < 30) riskClass = 'secure';
        else if (score < 70) riskClass = 'warning';
        
        updateSecurityItem('risk-score', `${score}/100`, riskClass);
      } else {
        updateSecurityItem('risk-score', 'Unknown', 'warning');
      }
      
      calculateAndDisplaySecurityScore();
    });
    
  } catch (error) {
    console.error('Error analyzing site security:', error);
    
    // Ensure we still show a score even on error
    calculateAndDisplaySecurityScore();
  }
}

function updateSecurityItem(id, value, className) {
  const element = document.querySelector(`#${id} .value`);
  if (element) {
    element.textContent = value;
    element.className = 'value ' + (className || '');
  }
}

function updateCertificateInfo(certificate) {
  const certificateDetails = document.querySelector('.certificate-details');
  if (!certificateDetails) return;
  
  if (certificate) {
    let html = `
      <h3>SSL/TLS Certificate</h3>
      <div class="certificate-item">
        <strong>Subject:</strong>
        ${certificate.subject || 'Unknown'}
      </div>
      <div class="certificate-item">
        <strong>Issuer:</strong>
        ${certificate.issuer || 'Unknown'}
      </div>
      <div class="certificate-item">
        <strong>Valid From:</strong>
        ${certificate.validFrom || 'Unknown'}
      </div>
      <div class="certificate-item">
        <strong>Valid To:</strong>
        ${certificate.validTo || 'Unknown'}
      </div>
      <div class="certificate-item">
        <strong>Status:</strong>
        <span class="${certificate.valid ? 'secure' : 'danger'}">${certificate.valid ? 'Valid' : 'Invalid'}</span>
      </div>`;
      
    // Include additional details if available
    if (certificate.details) {
      if (certificate.details.serialNumber) {
        html += `
          <div class="certificate-item">
            <strong>Serial Number:</strong>
            ${certificate.details.serialNumber}
          </div>`;
      }
      
      if (certificate.details.fingerprint) {
        html += `
          <div class="certificate-item">
            <strong>Fingerprint:</strong>
            ${certificate.details.fingerprint}
          </div>`;
      }
      
      if (certificate.details.subjectAltNames && certificate.details.subjectAltNames.length > 0) {
        html += `
          <div class="certificate-item">
            <strong>Subject Alternative Names:</strong>
            <ul>`;
        
        certificate.details.subjectAltNames.slice(0, 5).forEach(name => {
          html += `<li>${name}</li>`;
        });
        
        if (certificate.details.subjectAltNames.length > 5) {
          html += `<li>And ${certificate.details.subjectAltNames.length - 5} more...</li>`;
        }
        
        html += `</ul>
          </div>`;
      }
    }
    
    certificateDetails.innerHTML = html;
  } else {
    certificateDetails.innerHTML = '<p>No certificate information available</p>';
  }
}

function calculateAndDisplaySecurityScore() {
  const scoreCircle = document.querySelector('.score-circle');
  const securityScoreElement = document.getElementById('security-score-value');
  if (!scoreCircle || !securityScoreElement) return;
  
  // Get all security factors
  const connectionStatusEl = document.querySelector('#connection-status .value');
  const sslStatusEl = document.querySelector('#ssl-status .value');
  const riskScoreEl = document.querySelector('#risk-score .value');
  const securityHeadersEl = document.querySelector('#security-headers .value');
  const vendorRatingsEl = document.querySelector('#vendor-ratings .value');
  
  const connectionStatus = connectionStatusEl ? connectionStatusEl.textContent : '';
  const sslStatus = sslStatusEl ? sslStatusEl.textContent : '';
  const riskScore = riskScoreEl ? riskScoreEl.textContent : '';
  const securityHeaders = securityHeadersEl ? securityHeadersEl.textContent : '';
  const vendorRatings = vendorRatingsEl ? vendorRatingsEl.textContent : '';
  
  // Don't calculate if we're still loading data
  if (connectionStatus === 'Analyzing...' || 
      sslStatus === 'Analyzing...' || 
      riskScore === 'Analyzing...' || 
      securityHeaders === 'Analyzing...' ||
      vendorRatings === 'Analyzing...') {
    return;
  }
  
  let score = 50; // Start with neutral score
  
  // Adjust score based on connection
  if (connectionStatus.includes('Secure')) {
    score += 20;
  } else if (connectionStatus.includes('Insecure')) {
    score -= 20;
  }
  
  // Adjust score based on SSL
  if (sslStatus.includes('Valid')) {
    score += 15;
  } else if (sslStatus.includes('Invalid')) {
    score -= 15;
  }
  
  // Adjust score based on risk
  if (riskScore !== 'Unknown') {
    const riskValue = parseInt(riskScore);
    if (!isNaN(riskValue)) {
      score += (100 - riskValue) / 10; // Higher is riskier, so invert
    }
  }
  
  // Adjust score based on security headers
  if (securityHeaders.includes('Good')) {
    score += 15;
  } else if (securityHeaders.includes('Moderate')) {
    score += 7;
  } else if (securityHeaders.includes('Poor')) {
    score -= 7;
  }
  
  // Adjust score based on vendor ratings
  if (vendorRatings.includes('Safe')) {
    score += 20;
  } else if (vendorRatings.includes('Warning')) {
    score -= 10;
  } else if (vendorRatings.includes('Unsafe')) {
    score -= 30;
  }
  
  // Clamp score between 0 and 100
  score = Math.max(0, Math.min(100, Math.round(score)));
  
  // Update score display
  securityScoreElement.textContent = score;
  
  // Update score circle class
  scoreCircle.classList.remove('score-high', 'score-medium', 'score-low');
  
  if (score >= 70) {
    scoreCircle.classList.add('score-high');
  } else if (score >= 40) {
    scoreCircle.classList.add('score-medium');
  } else {
    scoreCircle.classList.add('score-low');
  }
}

// Original ScreenPipe functionality - Fetch screen data from Screenpipe
async function fetchScreenData() {
  const dataDiv = document.getElementById("data");
  const contentDisplayDiv = document.getElementById("contentDisplay");
  
  if (!dataDiv || !contentDisplayDiv) return;
  
  const contentType = document.getElementById("contentType")?.value || "ocr";
  
  contentDisplayDiv.innerHTML = "<p>Fetching data...</p>";
  dataDiv.textContent = "Fetching data...";
  console.log("Fetch button clicked. Starting data fetch...");

  try {
    // Revert to simple time calculation to avoid issues with Screenpipe's video handling
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const now = new Date().toISOString();

    console.log("Querying Screenpipe API...");
    const results = await screenpipe.pipe.queryScreenpipe({
      contentType: contentType.toLowerCase(),
      startTime: oneHourAgo,
      endTime: now,
      limit: 20,
      includeFrames: false // Set to false initially to prevent video processing errors
    });

    console.log("Data fetched successfully:", results);
    
    if (results && results.data) {
      cachedScreenData = results.data;
      dataDiv.textContent = JSON.stringify(results.data, null, 2);
      
      // Immediately display the content
      displayScreenContent();
    } else {
      contentDisplayDiv.innerHTML = "<p>No data returned from Screenpipe.</p>";
      dataDiv.textContent = "No data returned from Screenpipe.";
    }
  } catch (error) {
    console.error("Failed to fetch data:", error);
    contentDisplayDiv.innerHTML = `<p>Failed to fetch data: ${error.message}</p>`;
    if (dataDiv) {
      dataDiv.textContent = `Failed to fetch data: ${error.message}`;
    }
  }

  // After fetching data, provide option to analyze
  const analyzeBtn = document.getElementById('analyzeData');
  if (analyzeBtn) {
    analyzeBtn.classList.add('highlight');
    setTimeout(() => {
      analyzeBtn.classList.remove('highlight');
    }, 2000);
  }
}

// Original functionality - Display screen content in a user-friendly format
function displayScreenContent() {
  const contentDiv = document.getElementById("contentDisplay");
  if (!contentDiv) return;
  
  if (!cachedScreenData || cachedScreenData.length === 0) {
    contentDiv.innerHTML = "<p>No screen data available. Please fetch screen data first.</p>";
    return;
  }
  
  let html = "";
  
  cachedScreenData.forEach((item, index) => {
    html += `<div class="content-item">`;
    
    if (item.type && item.type.toLowerCase() === "ocr") {
      html += `<h3>Captured Text #${index + 1}</h3>`;
      
      // Add timestamp
      if (item.content && item.content.timestamp) {
        const timestamp = new Date(item.content.timestamp).toLocaleString();
        html += `<p class="timestamp">Time: ${timestamp}</p>`;
      }
      
      // Add app name if available
      if (item.content && item.content.app_name) {
        html += `<p class="app-name">App: ${item.content.app_name}</p>`;
      }
      
      // Add browser URL if available
      if (item.content && item.content.browserUrl) {
        html += `<p class="browser-url">URL: ${item.content.browserUrl}</p>`;
      }
      
      // Add text content
      html += `<div class="text-content">${item.content && item.content.text ? item.content.text : "No text content"}</div>`;
      
      // Add image frame if available
      if (item.content && item.content.frame) {
        html += `<div class="image-container">
          <img src="data:image/png;base64,${item.content.frame}" alt="Screen capture" />
        </div>`;
      }
    } else if (item.type && item.type.toLowerCase() === "audio") {
      html += `<h3>Audio Transcription #${index + 1}</h3>`;
      html += `<div class="audio-content">${item.content && item.content.transcription ? item.content.transcription : "No transcription available"}</div>`;
    } else {
      html += `<h3>Data Item #${index + 1}</h3>`;
      html += `<pre>${JSON.stringify(item, null, 2)}</pre>`;
    }
    
    html += `</div>`;
  });
  
  if (html === "") {
    html = "<p>No displayable content found in the data.</p>";
  }
  
  contentDiv.innerHTML = html;
}

// Original functionality - Filter content based on search query
function filterContent() {
  const filterQuery = document.getElementById("filterQuery")?.value.toLowerCase() || "";
  const contentDiv = document.getElementById("contentDisplay");
  if (!contentDiv) return;
  
  if (!cachedScreenData || cachedScreenData.length === 0) {
    contentDiv.innerHTML = "<p>Please fetch screen data first.</p>";
    return;
  }
  
  if (!filterQuery) {
    displayScreenContent();
    return;
  }
  
  const filteredData = cachedScreenData.filter(item => {
    if (item.type === "OCR") {
      const text = item.content.text?.toLowerCase() || "";
      const appName = item.content.app_name?.toLowerCase() || "";
      const browserUrl = item.content.browserUrl?.toLowerCase() || "";
      
      return text.includes(filterQuery) || appName.includes(filterQuery) || browserUrl.includes(filterQuery);
    } else if (item.type === "Audio") {
      const transcription = item.content.transcription?.toLowerCase() || "";
      return transcription.includes(filterQuery);
    }
    return false;
  });
  
  let html = "";
  
  if (filteredData.length === 0) {
    html = `<p>No results found for "${filterQuery}"</p>`;
  } else {
    filteredData.forEach((item, index) => {
      html += `<div class="content-item">`;
      
      if (item.type === "OCR") {
        html += `<h3>Captured Text #${index + 1}</h3>`;
        
        if (item.content.timestamp) {
          const timestamp = new Date(item.content.timestamp).toLocaleString();
          html += `<p class="timestamp">Time: ${timestamp}</p>`;
        }
        
        if (item.content.app_name) {
          html += `<p class="app-name">App: ${item.content.app_name}</p>`;
        }
        
        if (item.content.browserUrl) {
          html += `<p class="browser-url">URL: ${item.content.browserUrl}</p>`;
        }
        
        const text = item.content.text || "No text content";
        const highlightedText = text.replace(new RegExp(filterQuery, 'gi'), match => `<mark>${match}</mark>`);
        html += `<div class="text-content">${highlightedText}</div>`;
        
        if (item.content.frame) {
          html += `<div class="image-container">
            <img src="data:image/png;base64,${item.content.frame}" alt="Screen capture" />
          </div>`;
        }
      } else if (item.type === "Audio") {
        html += `<h3>Audio Transcription #${index + 1}</h3>`;
        const transcription = item.content.transcription || "No transcription available";
        const highlightedTranscription = transcription.replace(new RegExp(filterQuery, 'gi'), match => `<mark>${match}</mark>`);
        html += `<div class="audio-content">${highlightedTranscription}</div>`;
      }
      
      html += `</div>`;
    });
  }
  
  contentDiv.innerHTML = html;
}

// Load scan settings from storage
async function loadScanSettings() {
  try {
    const data = await chrome.storage.sync.get([
      'autoScanEnabled',
      'scanInterval',
      'notificationsEnabled',
      'notifyThreshold',
      'historyRetention',
      'sentinelApiKey'
    ]);
    
    // Set global variables
    autoScanEnabled = data.autoScanEnabled !== undefined ? data.autoScanEnabled : true;
    scanInterval = data.scanInterval || 10;
    notificationsEnabled = data.notificationsEnabled !== undefined ? data.notificationsEnabled : true;
    notifyThreshold = data.notifyThreshold || 'high';
    historyRetention = data.historyRetention || 30;
    
    // Update UI
    const enableAutoScanToggle = document.getElementById('enableAutoScan');
    const scanIntervalSelect = document.getElementById('scanInterval');
    const enableNotificationsToggle = document.getElementById('enableNotifications');
    const notifyThresholdSelect = document.getElementById('notifyThreshold');
    const historyRetentionSelect = document.getElementById('historyRetention');
    const autoScanStatus = document.getElementById('autoScanStatus');
    const groqApiKeyInput = document.getElementById('groqApiKey');
    
    if (enableAutoScanToggle) enableAutoScanToggle.checked = autoScanEnabled;
    if (scanIntervalSelect) {
      scanIntervalSelect.value = scanInterval.toString();
      scanIntervalSelect.disabled = !autoScanEnabled;
    }
    if (enableNotificationsToggle) enableNotificationsToggle.checked = notificationsEnabled;
    if (notifyThresholdSelect) notifyThresholdSelect.value = notifyThreshold;
    if (historyRetentionSelect) historyRetentionSelect.value = historyRetention.toString();
    
    // If API key exists, show placeholder
    if (data.sentinelApiKey && groqApiKeyInput) {
      groqApiKeyInput.placeholder = 'API key is set';
    }
    
    // Update auto scan status text
    if (autoScanStatus) {
      if (autoScanEnabled) {
        autoScanStatus.textContent = `Auto-scan: Enabled (Next scan in calculating...)`;
      } else {
        autoScanStatus.textContent = 'Auto-scan: Disabled';
      }
    }
  } catch (error) {
    console.error('Error loading scan settings:', error);
  }
}

// Save scan settings to storage
async function saveScanSettings() {
  try {
    const enableAutoScanToggle = document.getElementById('enableAutoScan');
    const scanIntervalSelect = document.getElementById('scanInterval');
    const enableNotificationsToggle = document.getElementById('enableNotifications');
    const notifyThresholdSelect = document.getElementById('notifyThreshold');
    const historyRetentionSelect = document.getElementById('historyRetention');
    
    // Get current values
    const newAutoScanEnabled = enableAutoScanToggle ? enableAutoScanToggle.checked : autoScanEnabled;
    const newScanInterval = scanIntervalSelect ? parseInt(scanIntervalSelect.value, 10) : scanInterval;
    const newNotificationsEnabled = enableNotificationsToggle ? enableNotificationsToggle.checked : notificationsEnabled;
    const newNotifyThreshold = notifyThresholdSelect ? notifyThresholdSelect.value : notifyThreshold;
    const newHistoryRetention = historyRetentionSelect ? parseInt(historyRetentionSelect.value, 10) : historyRetention;
    
    // Save to storage
    await chrome.storage.sync.set({
      'autoScanEnabled': newAutoScanEnabled,
      'scanInterval': newScanInterval,
      'notificationsEnabled': newNotificationsEnabled,
      'notifyThreshold': newNotifyThreshold,
      'historyRetention': newHistoryRetention
    });
    
    // Update global variables
    autoScanEnabled = newAutoScanEnabled;
    scanInterval = newScanInterval;
    notificationsEnabled = newNotificationsEnabled;
    notifyThreshold = newNotifyThreshold;
    historyRetention = newHistoryRetention;
    
    // Reset auto scan schedule
    if (nextScanTimeoutId) {
      clearTimeout(nextScanTimeoutId);
      nextScanTimeoutId = null;
    }
    
    if (autoScanEnabled) {
      scheduleNextScan();
    }
    
    // Update auto scan status text
    const autoScanStatus = document.getElementById('autoScanStatus');
    if (autoScanStatus) {
      if (autoScanEnabled) {
        autoScanStatus.textContent = `Auto-scan: Enabled (Next scan in ${scanInterval} minutes)`;
      } else {
        autoScanStatus.textContent = 'Auto-scan: Disabled';
      }
    }
    
    // Show settings saved notification
    showToast('Settings saved successfully');
    
    // Apply retention policy to scan history
    applyScanHistoryRetention();
    
  } catch (error) {
    console.error('Error saving scan settings:', error);
    showToast('Failed to save settings', 'error');
  }
}

// Schedule next auto scan
function scheduleNextScan() {
  if (!autoScanEnabled) return;
  
  if (nextScanTimeoutId) {
    clearTimeout(nextScanTimeoutId);
  }
  
  nextScanTimeoutId = setTimeout(async () => {
    await performAutoScan();
    scheduleNextScan(); // Schedule next scan after current one completes
  }, scanInterval * 60 * 1000);
  
  // Update countdown timer
  updateScanCountdown(scanInterval);
}

// Update countdown display
function updateScanCountdown(minutesLeft) {
  const autoScanStatus = document.getElementById('autoScanStatus');
  if (!autoScanStatus) return;
  
  autoScanStatus.textContent = `Auto-scan: Enabled (Next scan in ${minutesLeft} minutes)`;
  
  if (minutesLeft > 0) {
    setTimeout(() => {
      updateScanCountdown(minutesLeft - 1);
    }, 60000); // Update every minute
  }
}

// Perform automatic screen data scan
async function performAutoScan() {
  console.log('Performing automatic scan...');
  
  try {
    // Get screen data
    const screenData = await fetchScreenDataForAnalysis();
    
    if (!screenData || screenData.length === 0) {
      console.log('No screen data available for analysis');
      return;
    }
    
    // Analyze the data
    const analysisResult = await analyzeDataWithGroq(screenData);
    
    // Save to history
    saveScanToHistory(analysisResult);
    
    // Show notification if enabled and issues found
    if (notificationsEnabled && analysisResult.issues.length > 0) {
      let shouldNotify = false;
      
      if (notifyThreshold === 'high') {
        shouldNotify = analysisResult.issues.some(issue => issue.severity === 'high');
      } else if (notifyThreshold === 'medium') {
        shouldNotify = analysisResult.issues.some(issue => issue.severity === 'high' || issue.severity === 'medium');
      } else {
        shouldNotify = true;
      }
      
      if (shouldNotify) {
        showSecurityNotification(analysisResult);
      }
    }
  } catch (error) {
    console.error('Error during automatic scan:', error);
  }
}

// Show security notification for auto scan
function showSecurityNotification(result) {
  if (!('Notification' in window)) return;
  
  const highCount = result.issues.filter(i => i.severity === 'high').length;
  const medCount = result.issues.filter(i => i.severity === 'medium').length;
  const lowCount = result.issues.filter(i => i.severity === 'low').length;
  
  let message = '';
  let title = 'Security Scan Complete';
  
  if (highCount > 0) {
    title = '⚠️ High Security Risk Detected';
    message = `Found ${highCount} high risk issue${highCount !== 1 ? 's' : ''}`;
    if (medCount > 0 || lowCount > 0) {
      message += ` and ${medCount + lowCount} other concern${medCount + lowCount !== 1 ? 's' : ''}`;
    }
  } else if (medCount > 0) {
    title = '⚠️ Security Issues Found';
    message = `Found ${medCount} medium risk issue${medCount !== 1 ? 's' : ''}`;
    if (lowCount > 0) {
      message += ` and ${lowCount} minor concern${lowCount !== 1 ? 's' : ''}`;
    }
  } else if (lowCount > 0) {
    message = `Found ${lowCount} minor security concern${lowCount !== 1 ? 's' : ''}`;
  } else {
    message = 'No security issues found in your recent activity';
  }
  
  // Create and show notification
  try {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/sentinel48.png',
      title: title,
      message: message,
      buttons: [{ title: 'View Details' }],
      priority: highCount > 0 ? 2 : 1
    });
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
}

// Show toast message
function showToast(message, type = 'success') {
  // Create toast element
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  
  // Add to container
  const container = document.body;
  container.appendChild(toast);
  
  // Animate in
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);
  
  // Remove after delay
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      container.removeChild(toast);
    }, 300);
  }, 3000);
}

// Manual analysis of screen data - simplified flow
async function analyzeScreenData() {
  const analyzeBtn = document.getElementById('analyzeData');
  const analysisResult = document.getElementById('analysisResult');
  const timeRange = document.getElementById('timeRange');
  
  if (!analyzeBtn || !analysisResult) return;
  
  try {
    // Show loading state
    analyzeBtn.disabled = true;
    analyzeBtn.innerHTML = '<span class="loading-spinner"></span> Analyzing...';
    analysisResult.innerHTML = '<p class="loading-text">Analyzing your screen data...</p>';
    
    // Get time range
    const minutes = timeRange ? parseInt(timeRange.value, 10) : 10;
    
    // Step 1: Fetch screen content
    const screenData = await fetchScreenDataForAnalysis(minutes);
    
    if (!screenData || screenData.length === 0) {
      analysisResult.innerHTML = '<p class="placeholder-text">No screen data available for analysis</p>';
      analyzeBtn.disabled = false;
      analyzeBtn.innerHTML = 'Analyze';
      return;
    }
    
    // Step 2: Check for API key
    const apiKey = await getApiKey();
    if (!apiKey) {
      analysisResult.innerHTML = '<p class="error-text">API key not found. Please add your Groq API key in settings.</p>';
      analyzeBtn.disabled = false;
      analyzeBtn.innerHTML = 'Analyze';
      return;
    }

    // Step 3: Clean and organize the data to make the prompt more focused
    const cleanedData = cleanScreenData(screenData);
    
    // Show processing status with data count
    analysisResult.innerHTML = `<p class="loading-text">Analyzing ${cleanedData.length} data points for security issues...</p>`;
    
    // Step 4: Process in batches with improved context
    const result = await analyzeDataInBatches(apiKey, cleanedData);
    
    // Step 5: Display results
    displayAnalysisResults(result);
    
    // Save to history
    saveScanToHistory(result);
    
  } catch (error) {
    console.error('Error analyzing screen data:', error);
    analysisResult.innerHTML = `<p class="error-text">Error analyzing data: ${error.message}</p>`;
  } finally {
    // Restore button state
    if (analyzeBtn) {
      analyzeBtn.disabled = false;
      analyzeBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
        Analyze
      `;
    }
  }
}

// Clean and organize screen data before sending to AI
function cleanScreenData(screenData) {
  // Filter out irrelevant or overly complex items
  return screenData
    .filter(item => {
      // Keep only items with meaningful content
      if (item.type === 'OCR' && (!item.content?.text || item.content.text.trim().length < 3)) {
        return false;
      }
      return true;
    })
    .map(item => {
      if (item.type === 'OCR') {
        // Extract only the most relevant parts of OCR data
        const text = item.content?.text || '';
        const cleanedText = text
          .replace(/\s+/g, ' ')         // Normalize whitespace
          .replace(/\b\d{16,}\b/g, '[LONG NUMBER REDACTED]')  // Redact long numbers (potential card numbers)
          .trim();
          
        return {
          type: 'OCR',
          text: cleanedText.length > 500 ? cleanedText.substring(0, 500) + "..." : cleanedText,
          source: item.content?.app_name || 'Unknown Application',
          url: item.content?.browserUrl || null
        };
      } 
      else if (item.type === 'Audio') {
        const transcription = item.content?.transcription || '';
        return {
          type: 'Audio Transcription',
          content: transcription.length > 300 ? transcription.substring(0, 300) + "..." : transcription
        };
      }
      // Skip other types or convert to simpler format
      return {
        type: item.type,
        timestamp: new Date(item.content?.timestamp || Date.now()).toLocaleString()
      };
    });
}

// Display analysis results in the UI
function displayAnalysisResults(result) {
  const analysisResultElement = document.getElementById('analysisResult');
  if (!analysisResultElement) return;
  
  let html = '';
  
  // Add risk level indicator
  const riskLevelClass = 
    result.riskLevel === 'high' ? 'danger' : 
    result.riskLevel === 'medium' ? 'warning' : 
    'secure';
  
  html += `
    <div class="risk-level ${riskLevelClass}">
      <h4>Risk Level: ${result.riskLevel.toUpperCase()}</h4>
      <p>${result.summary}</p>
    </div>
  `;
  
  // Add issues
  if (result.issues && result.issues.length > 0) {
    html += '<div class="issues-list">';
    
    result.issues.forEach(issue => {
      html += `
        <div class="issue-item issue-${issue.severity}">
          <h4>${issue.title}</h4>
          <p>${issue.description}</p>
          <div class="issue-recommendation">
            <strong>Recommendation:</strong> ${issue.recommendation}
          </div>
        </div>
      `;
    });
    
    html += '</div>';
  } else {
    html += '<p class="no-issues">No security issues found!</p>';
  }
  
  // Add timestamp
  html += `
    <div class="scan-timestamp">
      Scan completed at ${new Date(result.timestamp).toLocaleString()}
    </div>
  `;
  
  analysisResultElement.innerHTML = html;
}

// Save scan to history
async function saveScanToHistory(scan) {
  try {
    // Load existing history
    await loadScanHistory();
    
    // Add new scan to history
    scanHistory.push(scan);
    
    // Sort by timestamp (newest first)
    scanHistory.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Apply retention policy
    applyScanHistoryRetention();
    
    // Save to storage
    await chrome.storage.local.set({ 'sentinel_scan_history': scanHistory });
    
    // Refresh history display if visible
    refreshScanHistory();
  } catch (error) {
    console.error('Error saving scan to history:', error);
  }
}

// Analyze data in smaller batches to avoid API limits
async function analyzeDataInBatches(apiKey, screenData) {
  // Determine batch size based on data complexity
  // Text data is more token-heavy than other types
  const textItems = screenData.filter(item => item.type === 'OCR' && item.text).length;
  
  // Adjust batch size based on content - smaller batches for text-heavy content
  const BATCH_SIZE = textItems > 10 ? 2 : (textItems > 5 ? 3 : 5);
  
  console.log(`Processing ${screenData.length} items in batches of ${BATCH_SIZE}`);
  
  let allIssues = [];
  let riskLevels = [];
  let summaries = [];
  let successfulBatches = 0;
  
  // Split data into smaller batches
  for (let i = 0; i < screenData.length; i += BATCH_SIZE) {
    const batchData = screenData.slice(i, i + BATCH_SIZE);
    const batchNumber = Math.floor(i/BATCH_SIZE) + 1;
    console.log(`Processing batch ${batchNumber}: ${batchData.length} items`);
    
    try {
      // Send small batch to Groq - now with better error handling
      const batchResult = await sendToGroq(apiKey, batchData);
      
      if (batchResult) {
        successfulBatches++;
        
        // Collect issues from this batch
        if (batchResult.issues && Array.isArray(batchResult.issues) && batchResult.issues.length > 0) {
          allIssues = allIssues.concat(batchResult.issues);
        }
        
        // Track risk level
        if (batchResult.riskLevel) {
          riskLevels.push(batchResult.riskLevel);
        }
        
        // Collect summaries
        if (batchResult.summary) {
          summaries.push(batchResult.summary);
        }
      }
    } catch (error) {
      console.error(`Error processing batch ${batchNumber}:`, error);
      // Continue with next batch even if one fails
    }
  }
  
  // If all batches failed, provide a meaningful error
  if (successfulBatches === 0 && screenData.length > 0) {
    return {
      summary: "Unable to analyze security data. The AI service returned errors for all data batches.",
      riskLevel: "medium", // Default to medium as we don't know
      issues: [
        {
          title: "Analysis Failed",
          description: "The security analysis service was unable to process your data. This may be due to API limits or temporary service issues.",
          severity: "medium",
          recommendation: "Please try again with a smaller sample of data or check your API key."
        }
      ],
      timestamp: new Date().toISOString(),
      dataPoints: screenData.length,
      batchCount: Math.ceil(screenData.length / BATCH_SIZE),
      successfulBatches: 0
    };
  }
  
  // Remove duplicate issues based on title
  allIssues = allIssues.filter((issue, index, self) =>
    index === self.findIndex(i => i.title === issue.title)
  );
  
  // Determine overall risk level (highest risk wins)
  let overallRiskLevel = 'safe';
  if (riskLevels.includes('high')) {
    overallRiskLevel = 'high';
  } else if (riskLevels.includes('medium')) {
    overallRiskLevel = 'medium';
  } else if (riskLevels.includes('low')) {
    overallRiskLevel = 'low';
  }
  
  // Create overall summary
  let overallSummary;
  if (allIssues.length > 0) {
    const highCount = allIssues.filter(i => i.severity === 'high').length;
    const mediumCount = allIssues.filter(i => i.severity === 'medium').length;
    const lowCount = allIssues.filter(i => i.severity === 'low').length;
    
    overallSummary = `Analysis found ${allIssues.length} potential security ${allIssues.length === 1 ? 'issue' : 'issues'}: `;
    
    if (highCount > 0) {
      overallSummary += `${highCount} high risk, `;
    }
    if (mediumCount > 0) {
      overallSummary += `${mediumCount} medium risk, `;
    }
    if (lowCount > 0) {
      overallSummary += `${lowCount} low risk, `;
    }
    
    // Remove trailing comma
    overallSummary = overallSummary.replace(/,\s*$/, '.');
  } else {
    overallSummary = "No security issues were found in the analyzed screen data.";
  }
  
  // Return consolidated result
  return {
    summary: overallSummary,
    riskLevel: overallRiskLevel,
    issues: allIssues,
    batchCount: Math.ceil(screenData.length / BATCH_SIZE),
    successfulBatches: successfulBatches,
    timestamp: new Date().toISOString(),
    dataPoints: screenData.length
  };
}

// Send to Groq API with improved prompting
async function sendToGroq(apiKey, screenData) {
  try {
    // Create a more focused prompt for security analysis
    const prompt = `
Please analyze this user's recent screen activity data for security risks:
- Look for potential password exposure, sensitive information, or security threats
- Identify any risky websites or suspicious activity patterns
- Focus on concrete security issues, not general warnings
- Return ONLY valid JSON in the format {"summary": "brief summary", "riskLevel": "high|medium|low|safe", "issues": [{"title": "issue name", "description": "description", "severity": "high|medium|low", "recommendation": "advice"}]}

Screen data summary: ${screenData.length} items to analyze for security concerns.
`;

    // Send to background script for processing with the improved prompt
    const response = await chrome.runtime.sendMessage({
      action: 'groqAnalysisLight',
      apiKey: apiKey,
      data: screenData,
      prompt: prompt,
      ensureValidJson: true // Add flag to ensure JSON response
    });
    
    if (response.error) {
      console.warn('Error response from Groq:', response.error);
      
      // If we got an error, return a fallback result
      return {
        summary: "Unable to analyze data due to API error. Please try again later.",
        riskLevel: "medium", // Default to medium as we don't know
        issues: [
          {
            title: "Analysis Error",
            description: `The security analysis encountered an error: ${response.error.substring(0, 100)}`,
            severity: "medium",
            recommendation: "Please try again with a smaller data sample or check your API key."
          }
        ],
        timestamp: new Date().toISOString(),
        dataPoints: screenData.length,
        error: true
      };
    }
    
    return response.result;
  } catch (error) {
    console.error('Error communicating with Groq:', error);
    
    // Return fallback result on error
    return {
      summary: "Unable to complete security analysis due to technical error.",
      riskLevel: "medium",
      issues: [
        {
          title: "Analysis Service Unavailable",
          description: "The security analysis service encountered a technical problem and could not analyze your data.",
          severity: "medium",
          recommendation: "Please try again later or with a smaller data sample."
        }
      ],
      timestamp: new Date().toISOString(),
      dataPoints: screenData.length,
      error: true
    };
  }
}

// Fetch screen data for analysis
async function fetchScreenDataForAnalysis(minutes = 10) {
  try {
    // Calculate time range
    const startTime = new Date(Date.now() - minutes * 60 * 1000).toISOString();
    const endTime = new Date().toISOString();
    
    console.log(`Fetching screen data from ${startTime} to ${endTime}...`);
    
    // Use Screenpipe to fetch data
    const results = await screenpipe.pipe.queryScreenpipe({
      contentType: 'all',
      startTime: startTime,
      endTime: endTime,
      limit: 50,
      includeFrames: false
    });
    
    return results.data || [];
  } catch (error) {
    console.error("Failed to fetch screen data:", error);
    throw error;
  }
}

// Refresh scan history display
function refreshScanHistory() {
  const historyList = document.getElementById('historyList');
  if (!historyList) return;
  
  // Get period filter
  const historyPeriodSelect = document.getElementById('historyPeriod');
  const period = historyPeriodSelect ? historyPeriodSelect.value : 'all';
  
  // Filter history
  const filteredHistory = filterHistoryByPeriod(scanHistory, period);
  
  // Display history
  if (filteredHistory.length === 0) {
    historyList.innerHTML = '<p class="placeholder-text">No scan history available for this period</p>';
    return;
  }
  
  let html = '';
  
  filteredHistory.forEach(scan => {
    const timestamp = new Date(scan.timestamp).toLocaleString();
    const badgeClass = 
      scan.riskLevel === 'high' ? 'danger' : 
      scan.riskLevel === 'medium' ? 'warning' : 
      'safe';
      
    const issueCount = scan.issues ? scan.issues.length : 0;
    
    html += `
      <div class="history-item" data-timestamp="${scan.timestamp}">
        <div class="history-item-header">
          <span class="history-item-time">${timestamp}</span>
          <span class="history-item-badge ${badgeClass}">${scan.riskLevel.toUpperCase()}</span>
        </div>
        <div class="history-item-summary">
          ${scan.summary}
          ${issueCount > 0 ? `<br><strong>${issueCount} issue${issueCount !== 1 ? 's' : ''} found</strong>` : ''}
        </div>
      </div>
    `;
  });
  
  historyList.innerHTML = html;
  
  // Add click event to view history items
  const items = historyList.querySelectorAll('.history-item');
  items.forEach(item => {
    item.addEventListener('click', () => {
      const timestamp = item.dataset.timestamp;
      const scan = scanHistory.find(s => s.timestamp === timestamp);
      if (scan) {
        showHistoryDetail(scan);
      }
    });
  });
}

// Show history item details
function showHistoryDetail(scan) {
  // Switch to the analysis tab and display this scan
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');
  
  tabButtons.forEach(btn => btn.classList.remove('active'));
  tabPanes.forEach(pane => pane.classList.remove('active'));
  
  const realtimeTab = document.querySelector('.tab-btn[data-tab="realtime"]');
  if (realtimeTab) realtimeTab.classList.add('active');
  
  const realtimePane = document.getElementById('realtime');
  if (realtimePane) realtimePane.classList.add('active');
  
  const analysisResultElement = document.getElementById('analysisResult');
  if (analysisResultElement) {
    displayAnalysisResults(scan);
    
    // Scroll to the result
    analysisResultElement.scrollIntoView({ behavior: 'smooth' });
  }
}

// Filter scan history based on selected period
function filterScanHistory() {
  refreshScanHistory();
}

// Filter history by time period
function filterHistoryByPeriod(history, period) {
  if (period === 'all') return history;
  
  const now = new Date();
  let cutoff = new Date();
  
  switch (period) {
    case 'day':
      cutoff.setHours(0, 0, 0, 0); // Start of today
      break;
    case 'week':
      cutoff.setHours(0, 0, 0, 0);
      cutoff.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
      break;
    case 'month':
      cutoff.setHours(0, 0, 0, 0);
      cutoff.setDate(1); // Start of month
      break;
  }
  
  return history.filter(scan => new Date(scan.timestamp) >= cutoff);
}

// Apply retention policy
function applyScanHistoryRetention() {
  if (historyRetention === -1) return; // Keep forever
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - historyRetention);
  
  scanHistory = scanHistory.filter(scan => {
    return new Date(scan.timestamp) >= cutoffDate;
  });
}

// Clear scan history
async function clearScanHistory() {
  try {
    // Confirm with user
    if (!confirm('Are you sure you want to delete all scan history? This cannot be undone.')) {
      return;
    }
    
    // Clear history
    scanHistory = [];
    await chrome.storage.local.set({ 'sentinel_scan_history': [] });
    
    // Refresh display
    refreshScanHistory();
    
    showToast('Scan history cleared');
  } catch (error) {
    console.error('Error clearing scan history:', error);
    showToast('Failed to clear scan history', 'error');
  }
}

// Load scan history from storage
async function loadScanHistory() {
  try {
    const result = await chrome.storage.local.get(['sentinel_scan_history']);
    scanHistory = result.sentinel_scan_history || [];
    
    // Apply retention policy
    applyScanHistoryRetention();
    
    // Refresh display
    refreshScanHistory();
    return scanHistory;
  } catch (error) {
    console.error('Error loading scan history:', error);
    scanHistory = [];
    return [];
  }
}

// Add these functions to handle Link Marker settings

// Initialize Link Markers UI elements based on saved settings
function initLinkMarkersUI() {
  const enableLinkMarkersCheckbox = document.getElementById('enableLinkMarkers');
  const markerStyleSelect = document.getElementById('markerStyle');
  const linkMarkersOptions = document.querySelector('.link-markers-options');
  
  if (enableLinkMarkersCheckbox && markerStyleSelect && linkMarkersOptions) {
    // Load saved settings
    chrome.storage.sync.get(['enableLinkMarkers', 'markerStyle'], function(result) {
      enableLinkMarkersCheckbox.checked = result.enableLinkMarkers || false;
      
      if (markerStyleSelect) {
        markerStyleSelect.value = result.markerStyle || 'icon';
      }
      
      // Update UI state based on checkbox
      if (!enableLinkMarkersCheckbox.checked) {
        linkMarkersOptions.classList.add('disabled');
      } else {
        linkMarkersOptions.classList.remove('disabled');
      }
    });
    
    // Add event listener for the checkbox
    enableLinkMarkersCheckbox.addEventListener('change', function() {
      if (this.checked) {
        linkMarkersOptions.classList.remove('disabled');
      } else {
        linkMarkersOptions.classList.add('disabled');
      }
    });
  }
}

// Save Link Markers settings
function saveLinkMarkersSettings() {
  const enableLinkMarkers = document.getElementById('enableLinkMarkers').checked;
  const markerStyle = document.getElementById('markerStyle').value;
  
  chrome.storage.sync.set({
    enableLinkMarkers: enableLinkMarkers,
    markerStyle: markerStyle
  }, function() {
    // Notify all tabs that settings have changed
    chrome.tabs.query({}, function(tabs) {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, {
          action: "updateLinkMarkerSettings",
          enableLinkMarkers: enableLinkMarkers,
          markerStyle: markerStyle
        }).catch(() => {}); // Ignore errors for tabs that don't have content scripts
      });
    });
  });
}

// Add this to your setupEventListeners function
function addLinkMarkerEventListeners() {
  const saveSettingsBtn = document.getElementById('saveSettings');
  if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener('click', function() {
      // Save all settings including link markers
      saveLinkMarkersSettings();
      // Show a success message
      showStatus('Settings saved successfully!');
    });
  }
}

// Helper function to show status messages
function showStatus(message, type = 'success') {
  const statusContainer = document.createElement('div');
  statusContainer.className = `status-message status-${type}`;
  statusContainer.textContent = message;
  
  document.body.appendChild(statusContainer);
  
  // Animate in
  setTimeout(() => {
    statusContainer.classList.add('show');
  }, 10);
  
  // Remove after delay
  setTimeout(() => {
    statusContainer.classList.remove('show');
    setTimeout(() => {
      statusContainer.remove();
    }, 300);
  }, 3000);
}

// Add this function to initialize all toggle switches
function initializeToggleSwitches() {
  // Get all toggle switches
  const toggleSwitches = document.querySelectorAll('.toggle-switch input[type="checkbox"]');
  
  // For each toggle switch, load saved state and add event listener
  toggleSwitches.forEach(toggle => {
    const settingId = toggle.id;
    
    // Load saved state from storage
    chrome.storage.sync.get([settingId], function(result) {
      // If we have a saved state, use it; otherwise use the default (checked attribute in HTML)
      if (result[settingId] !== undefined) {
        toggle.checked = result[settingId];
      }
      
      // Handle conditional displays based on toggle state
      handleToggleDependencies(toggle);
    });
    
    // Add change event listener
    toggle.addEventListener('change', function() {
      // Save new state to storage
      const setting = {};
      setting[settingId] = this.checked;
      chrome.storage.sync.set(setting);
      
      // Handle any UI elements that depend on this toggle
      handleToggleDependencies(this);
    });
  });
}

// Handle any UI elements that depend on toggle states
function handleToggleDependencies(toggle) {
  // Handle specific toggle dependencies
  switch(toggle.id) {
    case 'enableAutoScan':
      // If auto-scan is disabled, disable scan interval
      const scanIntervalSetting = document.querySelector('.setting-item:has(#scanInterval)');
      if (scanIntervalSetting) {
        scanIntervalSetting.classList.toggle('disabled', !toggle.checked);
      }
      break;
      
    case 'enableNotifications':
      // If notifications are disabled, disable notification threshold
      const notifyThresholdSetting = document.querySelector('.setting-item:has(#notifyThreshold)');
      if (notifyThresholdSetting) {
        notifyThresholdSetting.classList.toggle('disabled', !toggle.checked);
      }
      break;
      
    case 'enableLinkMarkers':
      // If link markers are disabled, disable marker style
      const linkMarkersOptions = document.querySelector('.link-markers-options');
      if (linkMarkersOptions) {
        linkMarkersOptions.classList.toggle('disabled', !toggle.checked);
      }
      break;
  }
}

// Add this to the saveSettings function to save all toggle states
function saveAllSettings() {
  const settings = {};
  
  // Save all toggle switch states
  document.querySelectorAll('.toggle-switch input[type="checkbox"]').forEach(toggle => {
    settings[toggle.id] = toggle.checked;
  });
  
  // Save all select values
  document.querySelectorAll('.setting-item select').forEach(select => {
    settings[select.id] = select.value;
  });
  
  // Save to storage
  chrome.storage.sync.set(settings, function() {
    showStatus('Settings saved successfully!');
  });
}

// Function to save Link Markers settings and notify content scripts
function saveLinkMarkerSettings() {
  const enableLinkMarkers = document.getElementById('enableLinkMarkers')?.checked || false;
  const markerStyle = document.getElementById('markerStyle')?.value || 'icon';
  
  console.log(`Saving link marker settings: enabled=${enableLinkMarkers}, style=${markerStyle}`);
  
  // Save to Chrome storage
  chrome.storage.sync.set({
    enableLinkMarkers: enableLinkMarkers,
    markerStyle: markerStyle
  }, function() {
    console.log('Link marker settings saved');
    
    // Notify all open tabs about the setting change
    chrome.tabs.query({}, function(tabs) {
      for (let tab of tabs) {
        try {
          chrome.tabs.sendMessage(tab.id, {
            action: "updateLinkMarkerSettings",
            enableLinkMarkers: enableLinkMarkers,
            markerStyle: markerStyle
          }).catch(() => {
            // Ignore errors for tabs where content script isn't loaded
          });
        } catch (e) {
          console.log(`Error sending message to tab ${tab.id}: ${e.message}`);
        }
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', function() {
  // Handle the Save Settings button
  const saveSettingsBtn = document.getElementById('saveSettings');
  if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener('click', function() {
      // Save link marker settings
      saveLinkMarkerSettings();
      
      // Show feedback to the user
      const statusDiv = document.getElementById('status') || document.createElement('div');
      statusDiv.id = 'status';
      statusDiv.className = 'status-message success visible';
      statusDiv.textContent = 'Settings saved successfully!';
      
      if (!statusDiv.parentNode) {
        document.body.appendChild(statusDiv);
      }
      
      // Hide the status message after a delay
      setTimeout(() => {
        statusDiv.classList.remove('visible');
      }, 3000);
    });
  }
  
  // Initialize the link markers UI
  const enableLinkMarkersCheckbox = document.getElementById('enableLinkMarkers');
  if (enableLinkMarkersCheckbox) {
    chrome.storage.sync.get(['enableLinkMarkers'], function(result) {
      enableLinkMarkersCheckbox.checked = result.enableLinkMarkers || false;
    });
  }
  
  const markerStyleSelect = document.getElementById('markerStyle');
  if (markerStyleSelect) {
    chrome.storage.sync.get(['markerStyle'], function(result) {
      markerStyleSelect.value = result.markerStyle || 'icon';
    });
  }
});
