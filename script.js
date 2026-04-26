document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const resultsSection = document.getElementById('results-section');
    const imagePreview = document.getElementById('image-preview');
    const imageGrid = document.getElementById('image-grid');
    const resultTitle = document.getElementById('result-title');
    const resultTags = document.getElementById('result-tags');
    const hero = document.querySelector('.hero');

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

    function handleImageUpload(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            // Show preview
            imagePreview.style.backgroundImage = `url(${e.target.result})`;
            
            // UI Transitions
            hero.style.display = 'none';
            resultsSection.classList.remove('hidden');
            
            // Scroll to results
            window.scrollTo({ top: 0, behavior: 'smooth' });

            // Simulate AI Processing
            simulateAIAnalysis();
        };
        reader.readAsDataURL(file);
    }

    function simulateAIAnalysis() {
        resultTitle.textContent = "Analyzing Image...";
        resultTags.innerHTML = '';
        imageGrid.innerHTML = '';

        // Random mock categories for "identification"
        const categories = [
            { title: "Futuristic Architecture", tags: ["Modern", "Minimalist", "Glass", "Structure"], search: "architecture" },
            { title: "Alpine Landscape", tags: ["Nature", "Mountains", "Snow", "Outdoor"], search: "mountain" },
            { title: "Premium Tech Gear", tags: ["Electronic", "Gadget", "Sleek", "Dark"], search: "technology" },
            { title: "Urban Streetwear", tags: ["Fashion", "Style", "City", "Modern"], search: "fashion" }
        ];

        const match = categories[Math.floor(Math.random() * categories.length)];

        setTimeout(() => {
            resultTitle.textContent = match.title;
            
            match.tags.forEach(tagText => {
                const tag = document.createElement('span');
                tag.className = 'tag';
                tag.textContent = tagText;
                resultTags.appendChild(tag);
            });

            // Generate mock similar images
            for (let i = 0; i < 6; i++) {
                const item = document.createElement('div');
                item.className = 'grid-item glass-card';
                const img = document.createElement('img');
                // Use Unsplash source for high-quality mock images
                img.src = `https://source.unsplash.com/featured/?${match.search}&sig=${i + Math.random()}`;
                img.alt = "Similar result";
                item.appendChild(img);
                imageGrid.appendChild(item);
            }
        }, 2500); // 2.5s simulated scan
    }
});
