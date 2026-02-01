document.addEventListener("DOMContentLoaded", () => {
    let allWorks = [];
    const worksGrid = document.getElementById('works-grid');
    const searchInput = document.getElementById('search-input');
    const sortSelect = document.getElementById('sort-select');
    const suggestionsContainer = document.getElementById('custom-suggestions');
    const patchnoteContainer = document.getElementById('patchnote-container');

    if (worksGrid) {
        fetch('data.json')
            .then(response => response.json())
            .then(data => {
                allWorks = data;
                renderWorks(allWorks);
                initScrollAnimation();
            })
            .catch(err => console.error("Works data load error:", err));
    }

    if (patchnoteContainer) {
        fetch('patchnotes.json')
            .then(response => response.json())
            .then(data => {
                renderPatchNotes(data);
                initScrollAnimation();
            })
            .catch(err => console.error("Patchnote load error:", err));
    }

    if (!worksGrid && !patchnoteContainer) {
        initScrollAnimation();
    }

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const keyword = e.target.value.toLowerCase().trim();
            if (keyword.length > 0) {
                const matches = allWorks.filter(work => 
                    work.title.toLowerCase().includes(keyword) ||
                    work.tags.some(t => t.toLowerCase().includes(keyword))
                ).slice(0, 5);
                showSuggestions(matches);
            } else {
                if (suggestionsContainer) suggestionsContainer.style.display = 'none';
            }
            updateDisplay();
        });

        document.addEventListener('click', (e) => {
            if (suggestionsContainer && !searchInput.contains(e.target) && !suggestionsContainer.contains(e.target)) {
                suggestionsContainer.style.display = 'none';
            }
        });
    }

    function showSuggestions(matches) {
        if (!suggestionsContainer) return;
        if (matches.length === 0) {
            suggestionsContainer.style.display = 'none';
            return;
        }

        suggestionsContainer.innerHTML = matches.map(work => `
            <div class="suggestion-item" data-title="${work.title.replace(/'/g, "\\'")}">
                <div class="suggestion-info">
                    <span class="suggestion-title">${work.title}</span>
                    <span class="suggestion-tags">${work.tags.join(' / ')}</span>
                </div>
                <span class="suggestion-category">${work.category}</span>
            </div>
        `).join('');

        suggestionsContainer.style.display = 'block';

        document.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
                searchInput.value = item.getAttribute('data-title');
                suggestionsContainer.style.display = 'none';
                updateDisplay();
            });
        });
    }

    function updateDisplay() {
        if (!searchInput || !sortSelect) return;
        const keyword = searchInput.value.toLowerCase().trim();
        const sortValue = sortSelect.value;

        let filtered = allWorks.filter(work => 
            work.title.toLowerCase().includes(keyword) ||
            work.category.toLowerCase().includes(keyword) ||
            work.tags.some(tag => tag.toLowerCase().includes(keyword))
        );

        if (sortValue === 'title') {
            filtered.sort((a, b) => a.title.localeCompare(b.title));
        } else if (sortValue === 'category') {
            filtered.sort((a, b) => a.category.localeCompare(b.category));
        } else if (sortValue === 'opus') {
            filtered.sort((a, b) => {
                const numA = parseInt(a.opus.replace(/[^0-9]/g, '')) || 0;
                const numB = parseInt(b.opus.replace(/[^0-9]/g, '')) || 0;
                return numA - numB;
            });
        }
        renderWorks(filtered, true);
    }

    if (sortSelect) {
        sortSelect.addEventListener('change', updateDisplay);
    }

    function renderWorks(data, isInstant = false) {
        if (!worksGrid) return;
        worksGrid.innerHTML = ''; 
        
        if (data.length === 0) {
            worksGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; opacity: 0.5;">No results found.</p>';
            return;
        }

        data.forEach(item => {
            const card = document.createElement('div');
            card.className = isInstant ? 'card visible' : 'card fade-in';
            const tagsHTML = item.tags.map(tag => `<span class="tag">${tag}</span>`).join('');
            
            card.innerHTML = `
                <span class="category">${item.category}</span>
                <span class="opus-label">${item.opus}</span>
                <h3>${item.title}</h3>
                <p>${item.description}</p>
                <div class="tags-container">${tagsHTML}</div>
                <div class="play-btn" onclick="playAudio('${item.spotifyId}', '${item.title.replace(/'/g, "\\'")}')">Listen Now</div>
            `;
            worksGrid.appendChild(card);
        });
    }

    function renderPatchNotes(data) {
        if (!patchnoteContainer) return;
        patchnoteContainer.innerHTML = data.map(item => `
            <div class="patch-item">
                <div class="patch-header">
                    <span class="patch-version">${item.version}</span>
                    <span class="patch-date">${item.date}</span>
                </div>
                <div class="patch-title">${item.title}</div>
                <ul class="patch-list">${item.changes.map(c => `<li>${c}</li>`).join('')}</ul>
            </div>
        `).join('');
    }

    window.playAudio = function(id, title) {
        const bar = document.getElementById('audio-controls');
        const label = document.getElementById('now-playing');
        const container = document.getElementById('spotify-player-container');

        if (!bar || !container) return;

        if (label) label.innerText = `Chopin: ${title}`;
        bar.classList.add('active');

        container.innerHTML = `
            <iframe 
                src="https://open.spotify.com/embed/track/${id}?utm_source=generator&theme=0" 
                width="100%" 
                height="80" 
                frameBorder="0" 
                allowfullscreen="" 
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                loading="lazy">
            </iframe>`;
    };

    document.getElementById('stop-btn')?.addEventListener('click', () => {
        const bar = document.getElementById('audio-controls');
        const container = document.getElementById('spotify-player-container');
        if (bar) bar.classList.remove('active');
        if (container) container.innerHTML = '';
    });

    function initScrollAnimation() {
        const fadeElements = document.querySelectorAll('.fade-in');
        if (fadeElements.length === 0) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        fadeElements.forEach(element => observer.observe(element));
    }
});