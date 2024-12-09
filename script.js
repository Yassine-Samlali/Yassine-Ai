// Constants
const HUGGING_FACE_API_URL = 'https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5';
const HUGGING_FACE_API_KEY = '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';
const API_KEY = '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';
const MAX_REQUESTS = 1000;
const STORAGE_KEY = 'imageGeneratorRequests';

// Updated to use SDXL model
const MODEL_URL = "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0";

// Better prompt engineering helper
function enhancePrompt(prompt) {
    const enhancers = [
        "high quality",
        "highly detailed",
        "masterpiece",
        "sharp focus",
        "stunning",
        "professional"
    ];
    
    const negativePrompt = "blur, blurry, low quality, low resolution, poorly drawn, bad anatomy, watermark, signature, text";
    
    return {
        prompt: `${prompt}, ${enhancers.join(", ")}`,
        negative_prompt: negativePrompt
    };
}

// DOM Elements
const generateBtn = document.getElementById('generate-btn');
const promptInput = document.getElementById('prompt');
const loadingAnimation = document.querySelector('.loading-animation');
const resultContainer = document.getElementById('result');
const generatedImage = document.getElementById('generated-image');
const downloadBtn = document.getElementById('download-btn');
const themeToggle = document.getElementById('theme-toggle');
const requestsLeftDisplay = document.getElementById('requests-left');

// Request Counter Management
let requestsLeft = parseInt(localStorage.getItem(STORAGE_KEY)) || MAX_REQUESTS;

function updateRequestsDisplay() {
    requestsLeftDisplay.textContent = requestsLeft;
    if (requestsLeft <= 0) {
        generateBtn.disabled = true;
        generateBtn.title = 'Maximum requests reached';
    }
}

function decrementRequests() {
    if (requestsLeft > 0) {
        requestsLeft--;
        localStorage.setItem(STORAGE_KEY, requestsLeft.toString());
        updateRequestsDisplay();
    }
}

// Theme Management
function setTheme(isDark) {
    if (isDark) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
    localStorage.setItem('darkMode', isDark);
}

// Initialize theme
const savedTheme = localStorage.getItem('darkMode') === 'true';
setTheme(savedTheme);

// Event Listeners
themeToggle.addEventListener('click', () => {
    const isDark = !document.body.classList.contains('dark-mode');
    setTheme(isDark);
});

// Loading State Management
function updateLoadingStep(step) {
    const steps = document.querySelectorAll('.generating-steps .step');
    steps.forEach(s => s.classList.remove('active'));
    
    for (let i = 0; i < step; i++) {
        steps[i].classList.add('active');
    }
}

async function generateImage(prompt) {
    if (requestsLeft <= 0) {
        alert('You have reached the maximum number of requests. Please try again later.');
        return;
    }

    loadingAnimation.style.display = 'block';
    updateLoadingStep(1);

    await new Promise(resolve => setTimeout(resolve, 1000));
    updateLoadingStep(2);

    try {
        const enhancedPrompts = enhancePrompt(prompt);
        
        const response = await fetch(MODEL_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${API_KEY}`,
            },
            body: JSON.stringify({
                inputs: enhancedPrompts.prompt,
                parameters: {
                    negative_prompt: enhancedPrompts.negative_prompt,
                    num_inference_steps: 50,  // More steps for better quality
                    guidance_scale: 7.5,      // Better prompt adherence
                    width: 1024,              // Larger size
                    height: 1024,             // Larger size
                    seed: Math.floor(Math.random() * 1000000) // Random seed for variety
                },
                wait_for_model: true
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to generate image');
        }

        updateLoadingStep(3);
        await new Promise(resolve => setTimeout(resolve, 500));

        const blob = await response.blob();
        decrementRequests();
        return URL.createObjectURL(blob);
    } catch (error) {
        console.error('Image generation error:', error);
        throw error;
    }
}

// Event Listeners
generateBtn.addEventListener('click', async () => {
    const prompt = promptInput.value.trim();
    if (!prompt) {
        alert('Please enter a prompt');
        return;
    }

    try {
        loadingAnimation.style.display = 'block';
        resultContainer.style.display = 'none';
        downloadBtn.style.display = 'none';
        generateBtn.disabled = true;
        promptInput.disabled = true;

        const imageUrl = await generateImage(prompt);
        
        generatedImage.src = imageUrl;
        resultContainer.style.display = 'block';
        downloadBtn.style.display = 'inline-flex';
        
        downloadBtn.onclick = () => {
            const a = document.createElement('a');
            a.href = imageUrl;
            a.download = 'generated-image.png';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        };
    } catch (error) {
        alert('Error generating image: ' + error.message);
    } finally {
        loadingAnimation.style.display = 'none';
        generateBtn.disabled = false;
        promptInput.disabled = false;
    }
});

downloadBtn.addEventListener('click', async () => {
    try {
        const response = await fetch(generatedImage.src);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'generated-image.png';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch (error) {
        console.error('Download error:', error);
        alert('Failed to download image');
    }
});

// Update the prompt input placeholder to guide users
promptInput.placeholder = "Describe your image in detail (e.g., 'a majestic mountain landscape at sunset, with snow-capped peaks and golden clouds')";

// Initialize request counter display
updateRequestsDisplay();
