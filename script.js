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

    let model = null;

    // Load MobileNet Model
    async function loadModel() {
        console.log("Loading model...");
        model = await mobilenet.load();
        console.log("Model loaded!");
    }
    loadModel();

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
        if (query) {
            performSearch(query, null);
        }
    });

    manualSearchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const query = manualSearchInput.value.trim();
            if (query) performSearch(query, null);
        }
    });

    function handleImageUpload(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const imgUrl = e.target.result;
            // Show preview
            imagePreview.style.backgroundImage = `url(${imgUrl})`;
            
            // Create a temporary image element for the model
            const tempImg = new Image();
            tempImg.src = imgUrl;
            tempImg.onload = () => identifyImage(tempImg);

            // UI Transitions
            hero.style.display = 'none';
            resultsSection.classList.remove('hidden');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        };
        reader.readAsDataURL(file);
    }

    async function identifyImage(imgElement) {
        resultTitle.textContent = "Analyzing Content...";
        resultTags.innerHTML = '';
        imageGrid.innerHTML = '';

        if (!model) {
            resultTitle.textContent = "Loading AI Engine...";
            await loadModel();
        }

        try {
            const predictions = await model.classify(imgElement);
            console.log('Predictions: ', predictions);
            
            if (predictions && predictions.length > 0) {
                const topPrediction = predictions[0].className.split(',')[0];
                const tags = predictions.map(p => p.className.split(',')[0]);
                performSearch(topPrediction, tags);
            } else {
                performSearch("Unknown Object", ["General"]);
            }
        } catch (error) {
            console.error("Analysis failed", error);
            performSearch("Error", ["Failed"]);
        }
    }

    async function performSearch(query, tags) {
        // UI Transitions for manual search if hero is still visible
        if (hero.style.display !== 'none') {
            hero.style.display = 'none';
            resultsSection.classList.remove('hidden');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        resultTitle.textContent = query;
        resultTags.innerHTML = '';
        
        if (tags) {
            tags.forEach(tagText => {
                const tag = document.createElement('span');
                tag.className = 'tag';
                tag.textContent = tagText;
                resultTags.appendChild(tag);
            });
        } else {
            // If manual search, just show the query as a tag
            const tag = document.createElement('span');
            tag.className = 'tag';
            tag.textContent = query;
            resultTags.appendChild(tag);
        }

        imageGrid.innerHTML = '';
        // Fetch real images from Unsplash
        for (let i = 0; i < 9; i++) {
            const item = document.createElement('div');
            item.className = 'grid-item glass-card';
            const img = document.createElement('img');
            img.src = `https://source.unsplash.com/featured/?${encodeURIComponent(query)}&sig=${i + Math.random()}`;
            img.alt = query;
            img.loading = "lazy";
            item.appendChild(img);
            imageGrid.appendChild(item);
        }
    }
});
