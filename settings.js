document.addEventListener('DOMContentLoaded', () => {
  // Load saved settings
  loadSettings();
  
  // Save button handler
  document.getElementById('saveSettings').addEventListener('click', saveSettings);
  
  // Toggle advanced settings
  const showAdvancedCheckbox = document.getElementById('showAdvanced');
  const advancedSettings = document.getElementById('advancedSettings');
  
  showAdvancedCheckbox.addEventListener('change', () => {
    advancedSettings.style.display = showAdvancedCheckbox.checked ? 'block' : 'none';
  });
  
  // Update temperature display value
  const temperatureInput = document.getElementById('temperature');
  const temperatureValue = document.getElementById('temperatureValue');
  
  temperatureInput.addEventListener('input', () => {
    temperatureValue.textContent = temperatureInput.value;
  });

  // Toggle control for checkboxes
  const includeFramesCheckbox = document.getElementById('includeFrames');
  const toggleLabel = includeFramesCheckbox.nextElementSibling;
  
  includeFramesCheckbox.addEventListener('change', () => {
    toggleLabel.textContent = includeFramesCheckbox.checked ? 'Enabled' : 'Disabled';
  });
});

// Load saved settings from Chrome storage
async function loadSettings() {
  const apiKeyInput = document.getElementById('groqApiKey');
  const modelSelect = document.getElementById('defaultModel');
  const maxTokensInput = document.getElementById('maxTokens');
  const temperatureInput = document.getElementById('temperature');
  const temperatureValue = document.getElementById('temperatureValue');
  const fetchLimitInput = document.getElementById('fetchLimit');
  const timeRangeSelect = document.getElementById('timeRange');
  const includeFramesCheckbox = document.getElementById('includeFrames');
  const defaultContentTypeSelect = document.getElementById('defaultContentType');
  const showAdvancedCheckbox = document.getElementById('showAdvanced');
  const advancedSettings = document.getElementById('advancedSettings');
  const toggleLabel = includeFramesCheckbox.nextElementSibling;
  
  try {
    const { groqApiKey, defaultModel, maxTokens, temperature, fetchLimit, timeRange, includeFrames, defaultContentType, showAdvanced } = 
      await chrome.storage.sync.get(['groqApiKey', 'defaultModel', 'maxTokens', 'temperature', 'fetchLimit', 'timeRange', 'includeFrames', 'defaultContentType', 'showAdvanced']);
    
    if (groqApiKey) {
      // Mask API key for display
      apiKeyInput.value = groqApiKey.substring(0, 4) + '...' + groqApiKey.substring(groqApiKey.length - 4);
      apiKeyInput.dataset.original = groqApiKey;
      
      // When input is focused, show the real API key
      apiKeyInput.addEventListener('focus', function() {
        if (this.dataset.original) {
          this.value = this.dataset.original;
        }
      });
    }
    
    if (defaultModel) {
      modelSelect.value = defaultModel;
    }
    
    if (maxTokens) {
      maxTokensInput.value = maxTokens;
    }
    
    if (temperature !== undefined) {
      temperatureInput.value = temperature;
      temperatureValue.textContent = temperature;
    }

    if (fetchLimit) {
      fetchLimitInput.value = fetchLimit;
    }
    
    if (timeRange) {
      timeRangeSelect.value = timeRange;
    }
    
    if (includeFrames !== undefined) {
      includeFramesCheckbox.checked = includeFrames;
      toggleLabel.textContent = includeFrames ? 'Enabled' : 'Disabled';
    }
    
    if (defaultContentType) {
      defaultContentTypeSelect.value = defaultContentType;
    }

    if (showAdvanced) {
      showAdvancedCheckbox.checked = showAdvanced;
      advancedSettings.style.display = showAdvanced ? 'block' : 'none';
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
    showStatus('Failed to load settings: ' + error.message, 'error');
  }
}

// Save settings to Chrome storage
async function saveSettings() {
  const apiKeyInput = document.getElementById('groqApiKey');
  const modelSelect = document.getElementById('defaultModel');
  const maxTokensInput = document.getElementById('maxTokens');
  const temperatureInput = document.getElementById('temperature');
  const fetchLimitInput = document.getElementById('fetchLimit');
  const timeRangeSelect = document.getElementById('timeRange');
  const includeFramesCheckbox = document.getElementById('includeFrames');
  const defaultContentTypeSelect = document.getElementById('defaultContentType');
  const showAdvancedCheckbox = document.getElementById('showAdvanced');
  
  const apiKey = apiKeyInput.dataset.original || apiKeyInput.value;
  const model = modelSelect.value;
  const maxTokens = parseInt(maxTokensInput.value);
  const temperature = parseFloat(temperatureInput.value);
  const fetchLimit = parseInt(fetchLimitInput.value);
  const timeRange = timeRangeSelect.value;
  const includeFrames = includeFramesCheckbox.checked;
  const defaultContentType = defaultContentTypeSelect.value;
  const showAdvanced = showAdvancedCheckbox.checked;
  
  // Simple validation
  if (!apiKey) {
    showStatus('Please enter your Groq API key', 'error');
    return;
  }

  if (isNaN(fetchLimit) || fetchLimit < 5 || fetchLimit > 100) {
    showStatus('Please enter a valid fetch limit between 5 and 100', 'error');
    return;
  }
  
  try {
    await chrome.storage.sync.set({
      groqApiKey: apiKey,
      defaultModel: model,
      maxTokens: maxTokens,
      temperature: temperature,
      fetchLimit,
      timeRange,
      includeFrames,
      defaultContentType,
      showAdvanced
    });
    
    showStatus('Settings saved successfully!', 'success');
  } catch (error) {
    console.error('Failed to save settings:', error);
    showStatus('Failed to save settings: ' + error.message, 'error');
  }
}

// Display status message
function showStatus(message, type = 'success') {
  const statusDiv = document.getElementById('status');
  statusDiv.textContent = message;
  statusDiv.className = 'status ' + type;
  
  // Clear status after 3 seconds
  setTimeout(() => {
    statusDiv.textContent = '';
    statusDiv.className = 'status';
  }, 3000);
}
