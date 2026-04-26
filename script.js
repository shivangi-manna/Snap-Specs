document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const resultsSection = document.getElementById('results-section');
    const imagePreview = document.getElementById('image-preview');
    const imageGrid = document.getElementById('image-grid');
    const resultTitle = document.getElementById('result-title');
    const resultTags = document.getElementById('result-tags');
    const hero = document.querySelector('.hero');
    const manualSearchInput = document.getElementById('manual-search-input');
    const searchBtn = document.getElementById('search-btn');
    const confidenceBar = document.getElementById('confidence-bar');
    const historyGrid = document.getElementById('history-grid');
    
    const lensSearchBtn = document.getElementById('lens-search');
    const googleSearchBtn = document.getElementById('google-search');

    let model = null;
    let currentPrediction = "";
    let history = JSON.parse(localStorage.getItem('snap_specs_history') || '[]');

    // Load MobileNet Model
    async function loadModel() {
        console.log("Loading model...");
        model = await mobilenet.load();
        console.log("Model loaded!");
    }
    loadModel();
    renderHistory();

    // Scroll Reveal Logic
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('reveal');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('section').forEach(section => {
        observer.observe(section);
    });

    // Action Buttons Logic
    lensSearchBtn.addEventListener('click', () => {
        if (currentPrediction) {
            window.open(`https://www.google.com/search?q=${encodeURIComponent(currentPrediction)}&tbm=isch`, '_blank');
        }
    });

    googleSearchBtn.addEventListener('click', () => {
        if (currentPrediction) {
            window.open(`https://www.google.com/search?q=${encodeURIComponent(currentPrediction)}`, '_blank');
        }
    });

    // Handle drag and drop
    dropZone.addEventListener('click', () => fileInput.click());

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            handleImageUpload(file);
        }
    });

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) handleImageUpload(file);
    });

    // Handle Manual Search
    searchBtn.addEventListener('click', () => {
        const query = manualSearchInput.value.trim();
        if (query) performSearch(query, null, 0.95);
    });

    manualSearchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const query = manualSearchInput.value.trim();
            if (query) performSearch(query, null, 0.95);
        }
    });

    function handleImageUpload(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const imgUrl = e.target.result;
            imagePreview.style.backgroundImage = `url(${imgUrl})`;
            
            const tempImg = new Image();
            tempImg.src = imgUrl;
            tempImg.onload = () => identifyImage(tempImg, imgUrl);

            hero.style.display = 'none';
            resultsSection.classList.remove('hidden');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        };
        reader.readAsDataURL(file);
    }

    async function identifyImage(imgElement, originalUrl) {
        resultTitle.textContent = "Analyzing Content...";
        resultTags.innerHTML = '';
        imageGrid.innerHTML = '';
        confidenceBar.style.width = '0%';

        if (!model) {
            resultTitle.textContent = "Loading AI Engine...";
            await loadModel();
        }

        try {
            const predictions = await model.classify(imgElement);
            if (predictions && predictions.length > 0) {
                const topPrediction = predictions[0].className.split(',')[0];
                const confidence = predictions[0].probability;
                const tags = predictions.map(p => p.className.split(',')[0]);
                
                addToHistory(topPrediction, originalUrl);
                performSearch(topPrediction, tags, confidence);
            } else {
                performSearch("Unknown Object", ["General"], 0.1);
            }
        } catch (error) {
            console.error("Analysis failed", error);
            performSearch("Error", ["Failed"], 0);
        }
    }

    function addToHistory(query, imgUrl) {
        const item = { query, imgUrl, date: new Date().getTime() };
        history = [item, ...history.slice(0, 7)];
        localStorage.setItem('snap_specs_history', JSON.stringify(history));
        renderHistory();
    }

    function renderHistory() {
        if (!historyGrid) return;
        if (history.length === 0) {
            historyGrid.innerHTML = '<p class="empty-msg">No recent scans. Start by uploading an image!</p>';
            return;
        }

        historyGrid.innerHTML = history.map(item => `
            <div class="history-item glass-card reveal" onclick="window.scrollTo({top:0, behavior:'smooth'})">
                <div class="thumb" style="background-image: url(${item.imgUrl})"></div>
                <p>${item.query}</p>
            </div>
        `).join('');
    }

    async function performSearch(query, tags, confidence) {
        currentPrediction = query;
        if (hero.style.display !== 'none') {
            hero.style.display = 'none';
            resultsSection.classList.remove('hidden');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        resultTitle.textContent = query;
        resultTags.innerHTML = '';
        confidenceBar.style.width = `${Math.round(confidence * 100)}%`;
        
        if (tags) {
            tags.forEach(tagText => {
                const tag = document.createElement('span');
                tag.className = 'tag';
                tag.textContent = tagText;
                resultTags.appendChild(tag);
            });
        } else {
            const tag = document.createElement('span');
            tag.className = 'tag';
            tag.textContent = query;
            resultTags.appendChild(tag);
        }

        imageGrid.innerHTML = '';
        const providers = [
            (q, s) => `https://source.unsplash.com/400x400/?${q}&sig=${s}`,
            (q, s) => `https://loremflickr.com/400/400/${q}?lock=${s}`,
            (q, s) => `https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80&sig=${s}&keyword=${q}`
        ];

        for (let i = 0; i < 9; i++) {
            const item = document.createElement('div');
            item.className = 'grid-item glass-card reveal';
            const img = document.createElement('img');
            const randomSig = Math.floor(Math.random() * 1000);
            
            // Cycle through providers to ensure variety and reliability
            const provider = providers[i % providers.length];
            img.src = provider(encodeURIComponent(query), randomSig);
            img.alt = query;
            img.loading = "lazy";
            
            item.appendChild(img);
            imageGrid.appendChild(item);
        }
    }
});
