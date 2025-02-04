// DOM Elements
const apiKeyInput = document.getElementById('apiKeyInput');
const saveApiKeyBtn = document.getElementById('saveApiKey');
const apiKeyStatus = document.getElementById('apiKeyStatus');
const apiKeySection = document.getElementById('apiKeySection');
const urlInput = document.getElementById('urlInput');
const generateBtn = document.getElementById('generateBtn');
const exportBtn = document.getElementById('exportBtn');
const statusSection = document.getElementById('statusSection');
const statusMessage = document.getElementById('statusMessage');
const previewSection = document.getElementById('previewSection');
const norwegianContent = document.getElementById('norwegianContent');
const englishContent = document.getElementById('englishContent');

// Initialize from localStorage
let apiKey = localStorage.getItem('claudeApiKey');
if (apiKey) {
    showSavedApiKeyState();
}

// Event Listeners
saveApiKeyBtn.addEventListener('click', handleSaveApiKey);
generateBtn.addEventListener('click', handleGenerate);
exportBtn.addEventListener('click', handleExport);

// Show API key is saved
function showSavedApiKeyState() {
    apiKeySection.innerHTML = `
        <div class="flex justify-between items-center">
            <p class="text-sm text-gray-600">API key is saved and ready to use</p>
            <button id="changeApiKey" class="text-blue-500 hover:text-blue-600 text-sm">
                Change API Key
            </button>
        </div>
    `;
    const changeApiKeyBtn = document.getElementById('changeApiKey');
    changeApiKeyBtn.addEventListener('click', showApiKeyInput);
}

// Show API Key input form
function showApiKeyInput() {
    apiKeySection.innerHTML = `
        <div class="space-y-2">
            <label class="block font-medium">Enter your Claude API Key:</label>
            <div class="flex gap-2">
                <input type="password" id="apiKeyInput" class="flex-1 p-2 border rounded-md" placeholder="sk-...">
                <button id="saveApiKey" class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md">
                    Save Key
                </button>
            </div>
            <p id="apiKeyStatus" class="text-sm text-gray-600"></p>
        </div>
    `;
    document.getElementById('saveApiKey').addEventListener('click', handleSaveApiKey);
}

// Process article with Claude API
async function processArticle(url) {
    try {
        const prompt = `You are a professional tech news editor creating a newsletter about AI and tech developments.
        Based on the URL: ${url}, write:

        1. A 3-5 line summary in Norwegian capturing the key points. Use a formal, professional tone.
        2. The same summary in English.

        Format your response exactly as shown below, including only the summaries:
        {
            "norwegianSummary": "Your Norwegian summary here...",
            "englishSummary": "Your English summary here..."
        }`;

        // Use a CORS proxy
        const response = await fetch('https://cors-anywhere.herokuapp.com/https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2024-01-01',
                'origin': 'https://api.anthropic.com'
            },
            body: JSON.stringify({
                model: "claude-3-sonnet-20240229",
                max_tokens: 1000,
                messages: [{
                    role: "user",
                    content: prompt
                }]
            })
        });
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'API request failed');
        }

        const data = await response.json();
        if (!data.content || !Array.isArray(data.content) || !data.content[0]?.text) {
            throw new Error('Invalid API response format');
        }

        // Parse the response text
        try {
            return JSON.parse(data.content[0].text);
        } catch (e) {
            console.error('Parse error:', e);
            throw new Error('Failed to parse API response');
        }
    } catch (error) {
        console.error('Error processing article:', error);
        throw error;
    }
}

// Handle API key saving
async function handleSaveApiKey() {
    const input = document.getElementById('apiKeyInput');
    const status = document.getElementById('apiKeyStatus');
    const key = input.value.trim();

    if (!key.startsWith('sk-')) {
        status.textContent = 'Invalid API key format. Should start with "sk-"';
        status.className = 'text-sm text-red-600';
        return;
    }

    apiKey = key;
    localStorage.setItem('claudeApiKey', key);
    
    status.textContent = 'API key saved successfully!';
    status.className = 'text-sm text-green-600';
    
    setTimeout(showSavedApiKeyState, 1500);
}

// Handle generate button click
async function handleGenerate() {
    if (!apiKey) {
        showStatus('Please enter your Claude API key first', 'error');
        return;
    }

    const urls = urlInput.value.trim().split('\n').filter(url => url.trim());
    if (urls.length === 0) {
        showStatus('Please enter at least one URL', 'error');
        return;
    }

    generateBtn.disabled = true;
    generateBtn.classList.add('loading');
    previewSection.classList.add('hidden');
    norwegianContent.textContent = '';
    englishContent.textContent = '';

    let hasContent = false;

    try {
        for (let i = 0; i < urls.length; i++) {
            const url = urls[i].trim();
            if (!url) continue;

            showStatus(`Processing article ${i + 1} of ${urls.length}: ${url}`, 'info');
            
            try {
                const result = await processArticle(url);
                norwegianContent.textContent += (norwegianContent.textContent ? '\n\n' : '') + result.norwegianSummary;
                englishContent.textContent += (englishContent.textContent ? '\n\n' : '') + result.englishSummary;
                hasContent = true;
            } catch (error) {
                showStatus(`Error processing ${url}: ${error.message}`, 'error');
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        if (hasContent) {
            previewSection.classList.remove('hidden');
            exportBtn.classList.remove('hidden');
            showStatus('Processing complete!', 'success');
        }
    } catch (error) {
        showStatus(`Error: ${error.message}`, 'error');
    } finally {
        generateBtn.disabled = false;
        generateBtn.classList.remove('loading');
    }
}

// Show status message
function showStatus(message, type = 'info') {
    statusSection.classList.remove('hidden');
    statusMessage.textContent = message;
    
    const baseClasses = 'rounded-md p-4 ';
    statusSection.firstElementChild.className = baseClasses + 
        (type === 'error' ? 'bg-red-50 border border-red-200' :
         type === 'success' ? 'bg-green-50 border border-green-200' :
         'bg-blue-50 border border-blue-200');
    
    statusMessage.className = type === 'error' ? 'text-red-700' :
                             type === 'success' ? 'text-green-700' :
                             'text-blue-700';
}

// Handle export (to be implemented)
function handleExport() {
    // TODO: Implement Word export functionality
    alert('Export to Word feature coming soon!');
}
