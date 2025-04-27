// Sentinel Content Script
// Executes in the context of web pages

// Initialize when the content script is injected
initialize();

// Main initialization function
function initialize() {
  // Avoid running in frames or iframes
  if (window.self !== window.top) {
    return;
  }

  console.log('Sentinel content script initialized');

  // Perform page analysis
  setTimeout(() => {
    analyzePageContent();
  }, 1000);

  // Add listeners for dynamic content changes
  observeDomChanges();
}

// Analyze the current page content for security issues
function analyzePageContent() {
  try {
    // Check for common security risks in the page
    const securityRisks = [];

    // 1. Check for mixed content
    if (window.location.protocol === 'https:') {
      const mixedContent = checkMixedContent();
      if (mixedContent.count > 0) {
        securityRisks.push({
          type: 'mixed_content',
          severity: 'medium',
          details: `Found ${mixedContent.count} mixed content resources (HTTP resources on an HTTPS page)`
        });
      }
    }

    // 2. Check for suspicious forms
    const suspiciousForms = checkSuspiciousForms();
    if (suspiciousForms.length > 0) {
      securityRisks.push({
        type: 'suspicious_forms',
        severity: 'high',
        details: `Found ${suspiciousForms.length} suspicious forms that may collect sensitive information`
      });
    }

    // 3. Check for dangerous links
    const dangerousLinks = checkDangerousLinks();
    if (dangerousLinks.count > 0) {
      securityRisks.push({
        type: 'dangerous_links',
        severity: 'medium',
        details: `Found ${dangerousLinks.count} potentially dangerous outbound links`
      });
    }

    // Send results back to the extension
    if (securityRisks.length > 0) {
      chrome.runtime.sendMessage({
        action: 'contentAnalysisResults',
        url: window.location.href,
        risks: securityRisks
      });
    }
  } catch (error) {
    console.error('Error analyzing page content:', error);
  }
}

// Check for mixed content (HTTP resources on HTTPS pages)
function checkMixedContent() {
  let count = 0;
  const mixedContentElements = [];

  // Check images
  document.querySelectorAll('img[src^="http:"]').forEach(el => {
    count++;
    mixedContentElements.push({
      type: 'image',
      url: el.src
    });
  });

  // Check scripts
  document.querySelectorAll('script[src^="http:"]').forEach(el => {
    count++;
    mixedContentElements.push({
      type: 'script',
      url: el.src
    });
  });

  // Check stylesheets
  document.querySelectorAll('link[rel="stylesheet"][href^="http:"]').forEach(el => {
    count++;
    mixedContentElements.push({
      type: 'stylesheet',
      url: el.href
    });
  });

  // Check iframes
  document.querySelectorAll('iframe[src^="http:"]').forEach(el => {
    count++;
    mixedContentElements.push({
      type: 'iframe',
      url: el.src
    });
  });

  return {
    count,
    elements: mixedContentElements
  };
}

// Check for suspicious forms (login forms, payment forms, etc.)
function checkSuspiciousForms() {
  const suspiciousForms = [];

  // Get all forms
  document.querySelectorAll('form').forEach(form => {
    const inputs = form.querySelectorAll('input');
    
    // Check for sensitive input types
    const hasPasswordField = Array.from(inputs).some(input => 
      input.type === 'password'
    );
    
    const hasCreditCardField = Array.from(inputs).some(input => 
      input.name && input.name.toLowerCase().match(/credit|card|cc|ccnum|cardnumber/)
    );
    
    const hasSSNField = Array.from(inputs).some(input => 
      input.name && input.name.toLowerCase().match(/ssn|social|security/)
    );
    
    // Check form action
    const formAction = form.action;
    const isSecureSubmission = formAction && formAction.startsWith('https:');
    
    // Determine if form is suspicious
    if ((hasPasswordField || hasCreditCardField || hasSSNField) && !isSecureSubmission) {
      suspiciousForms.push({
        element: form,
        sensitiveData: {
          password: hasPasswordField,
          creditCard: hasCreditCardField,
          ssn: hasSSNField
        },
        action: formAction || 'No action specified'
      });
    }
  });

  return suspiciousForms;
}

// Check for dangerous outbound links
function checkDangerousLinks() {
  const dangerousLinks = [];
  const currentDomain = window.location.hostname;
  
  // Suspicious TLDs
  const suspiciousTlds = [
    '.xyz', '.info', '.top', '.tk', '.ml', '.ga', '.cf', '.gq',
    '.work', '.click', '.loan', '.date', '.racing', '.download'
  ];
  
  // Suspicious keywords in URLs
  const suspiciousKeywords = [
    'free', 'prize', 'winner', 'bitcoin', 'crypto', 'wallet',
    'login', 'signin', 'account', 'verify', 'password', 'bank'
  ];
  
  // Check all links
  document.querySelectorAll('a[href]').forEach(link => {
    try {
      const href = link.href;
      
      // Skip non-HTTP links
      if (!href.startsWith('http')) return;
      
      const linkUrl = new URL(href);
      const linkDomain = linkUrl.hostname;
      
      // Skip internal links
      if (linkDomain === currentDomain) return;
      
      // Check for suspicious TLDs
      const hasSuspiciousTld = suspiciousTlds.some(tld => 
        linkDomain.endsWith(tld)
      );
      
      // Check for suspicious keywords in path
      const hasSuspiciousKeyword = suspiciousKeywords.some(keyword =>
        linkUrl.pathname.toLowerCase().includes(keyword)
      );
      
      if (hasSuspiciousTld || hasSuspiciousKeyword) {
        dangerousLinks.push({
          element: link,
          url: href,
          suspicious: {
            tld: hasSuspiciousTld,
            keyword: hasSuspiciousKeyword
          }
        });
      }
    } catch (e) {
      // Skip invalid URLs
    }
  });

  return {
    count: dangerousLinks.length,
    links: dangerousLinks
  };
}

// Monitor DOM changes to analyze dynamic content
function observeDomChanges() {
  // Create a MutationObserver to watch for significant DOM changes
  const observer = new MutationObserver(mutations => {
    let shouldAnalyze = false;
    
    for (const mutation of mutations) {
      // If nodes are being added
      if (mutation.addedNodes.length > 0) {
        for (const node of mutation.addedNodes) {
          // Only re-analyze for element nodes with significant content
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check if this is a significant change (form, iframe, script, or many links)
            if (node.tagName === 'FORM' || 
                node.tagName === 'IFRAME' || 
                node.tagName === 'SCRIPT' ||
                node.querySelectorAll('a').length > 3) {
              shouldAnalyze = true;
              break;
            }
          }
        }
      }
      
      if (shouldAnalyze) break;
    }
    
    if (shouldAnalyze) {
      // Debounce the analysis to avoid excessive CPU usage
      if (window._sentinelAnalysisTimeout) {
        clearTimeout(window._sentinelAnalysisTimeout);
      }
      
      window._sentinelAnalysisTimeout = setTimeout(() => {
        analyzePageContent();
      }, 1000);
    }
  });
  
  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: false,
    characterData: false
  });
}
