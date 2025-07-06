document.addEventListener('DOMContentLoaded', () => {
    // TMDB API Configuration
    const API_KEY = '3fc2d75975d64c859a0934943df14e93'; // <<<<<<<<<<<<<<< API KEY REPLACED HERE
    const BASE_URL = 'https://api.themoviedb.org/3';
    const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/';

    const requests = {
        fetchNetflixOriginals: `${BASE_URL}/discover/tv?api_key=${API_KEY}&with_networks=213`,
        fetchTrending: `${BASE_URL}/trending/all/week?api_key=${API_KEY}&language=en-US`,
        fetchTopRated: `${BASE_URL}/movie/top_rated?api_key=${API_KEY}&language=en-US`,
        fetchActionMovies: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=28`,
        fetchComedyMovies: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=35`,
        // Add more genres as needed
    };

    // DOM Elements
    const navbar = document.querySelector('.navbar');
    const heroSection = document.querySelector('.hero-section');
    const heroTitle = document.querySelector('.hero-title');
    const heroDescription = document.querySelector('.hero-description');
    const moreInfoButton = document.querySelector('.more-info-button');

    const movieModal = document.getElementById('movie-modal');
    const closeModalButton = document.querySelector('.close-button');
    const modalPoster = document.querySelector('.modal-poster');
    const modalTitle = document.querySelector('.modal-title');
    const modalDescription = document.querySelector('.modal-description');
    const modalReleaseDate = document.querySelector('.modal-release-date');
    const modalVoteAverage = document.querySelector('.modal-vote-average');
    const modalTrailerDiv = document.querySelector('.modal-trailer');
    const modalPlayButton = document.querySelector('.modal-play-button');

    let currentMovieId = null; // To store the ID of the movie currently in the modal

    // --- Helper Functions ---

    // Function to truncate text (for hero description)
    function truncate(str, n) {
        return str?.length > n ? str.substr(0, n - 1) + "..." : str;
    }

    // Function to fetch data from TMDB API
    async function fetchData(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data.results;
        } catch (error) {
            console.error("Error fetching data:", error);
            return [];
        }
    }

    // Function to populate a movie row
    async function populateMovieRow(selector, fetchUrl, isLargeCard = false) {
        const movies = await fetchData(fetchUrl);
        const movieRow = document.querySelector(selector);
        if (!movieRow) return;

        movieRow.innerHTML = ''; // Clear existing content

        movies.forEach(movie => {
            const movieCard = document.createElement('div');
            movieCard.classList.add('movie-card');
            if (isLargeCard) {
                movieCard.classList.add('large-card');
            }

            // Use 'poster_path' for large cards (originals), 'backdrop_path' for others
            const imageUrl = isLargeCard && movie.poster_path
                ? `${IMAGE_BASE_URL}w300${movie.poster_path}` // w300 for vertical posters
                : movie.backdrop_path
                    ? `${IMAGE_BASE_URL}w500${movie.backdrop_path}` // w500 for horizontal posters
                    : 'https://via.placeholder.com/250x140?text=No+Image'; // Placeholder if no image

            const img = document.createElement('img');
            img.src = imageUrl;
            img.alt = movie.title || movie.name || 'Movie Poster'; // Use title or name

            movieCard.appendChild(img);
            movieRow.appendChild(movieCard);

            // Attach click listener to open modal
            movieCard.addEventListener('click', () => openMovieModal(movie.id, movie.media_type));
        });
    }

    // Function to set up the Hero Section
    async function setupHeroSection() {
        const movies = await fetchData(requests.fetchNetflixOriginals);
        if (movies.length > 0) {
            const randomMovie = movies[Math.floor(Math.random() * movies.length)];
            const backdropUrl = `${IMAGE_BASE_URL}original${randomMovie.backdrop_path}`;

            heroSection.style.backgroundImage = `url('${backdropUrl}')`;
            heroTitle.textContent = randomMovie.title || randomMovie.name;
            heroDescription.textContent = truncate(randomMovie.overview, 150);
            moreInfoButton.dataset.movieId = randomMovie.id; // Store movie ID
            moreInfoButton.dataset.mediaType = randomMovie.media_type || 'movie'; // Store media type
        }
    }

    // --- Modal Functions ---

    // Function to fetch movie details (including videos)
    async function getMovieDetails(movieId, mediaType) {
        const type = mediaType === 'tv' ? 'tv' : 'movie'; // TMDB uses 'tv' for TV shows
        const detailsUrl = `${BASE_URL}/${type}/${movieId}?api_key=${API_KEY}&language=en-US`;
        const videosUrl = `${BASE_URL}/${type}/${movieId}/videos?api_key=${API_KEY}&language=en-US`;

        try {
            const [detailsResponse, videosResponse] = await Promise.all([
                fetch(detailsUrl),
                fetch(videosUrl)
            ]);

            const details = await detailsResponse.json();
            const videos = await videosResponse.json();

            return { details, videos: videos.results };
        } catch (error) {
            console.error("Error fetching movie details or videos:", error);
            return null;
        }
    }

    // Function to open the movie modal
    async function openMovieModal(movieId, mediaType) {
        const data = await getMovieDetails(movieId, mediaType);
        if (!data) return;

        const { details, videos } = data;
        currentMovieId = movieId; // Set current movie ID for modal play button

        modalPoster.src = details.poster_path ? `${IMAGE_BASE_URL}w300${details.poster_path}` : 'https://via.placeholder.com/300x450?text=No+Poster';
        modalTitle.textContent = details.title || details.name;
        modalDescription.textContent = details.overview || 'No description available.';
        modalReleaseDate.textContent = `Release Date: ${details.release_date || details.first_air_date || 'N/A'}`;
        modalVoteAverage.innerHTML = `Rating: <strong>${details.vote_average ? details.vote_average.toFixed(1) : 'N/A'}</strong> / 10`;

        // Find the trailer
        const trailer = videos.find(video => video.type === 'Trailer' && video.site === 'YouTube');

        modalTrailerDiv.innerHTML = ''; // Clear previous trailer
        if (trailer) {
            modalTrailerDiv.innerHTML = `
                <iframe
                    src="https://www.youtube.com/embed/${trailer.key}?autoplay=1&controls=0&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1"
                    frameborder="0"
                    allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                    allowfullscreen
                ></iframe>
            `;
            modalPlayButton.style.display = 'none'; // Hide play button if trailer auto-plays
        } else {
            modalTrailerDiv.innerHTML = '<p>No trailer available for this title.</p>';
            modalPlayButton.style.display = 'block'; // Show if no auto-play trailer found
            modalPlayButton.onclick = () => alert('No trailer found to play!');
        }


        movieModal.classList.add('show'); // Show the modal with animation
        document.body.style.overflow = 'hidden'; // Prevent scrolling background
    }

    // Function to close the movie modal
    function closeMovieModal() {
        movieModal.classList.remove('show');
        modalTrailerDiv.innerHTML = ''; // Stop video playback by removing iframe
        document.body.style.overflow = ''; // Restore scrolling
        currentMovieId = null;
    }

    // --- Event Listeners ---

    // Navbar background change on scroll
    window.addEventListener('scroll', () => {
        if (window.scrollY > 80) {
            navbar.style.backgroundColor = 'var(--netflix-black)';
        } else {
            navbar.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        }
    });

    // Close modal when close button is clicked
    closeModalButton.addEventListener('click', closeMovieModal);

    // Close modal when clicking outside the modal content
    window.addEventListener('click', (event) => {
        if (event.target === movieModal) {
            closeMovieModal();
        }
    });

    // Close modal with Escape key
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && movieModal.classList.contains('show')) {
            closeMovieModal();
        }
    });

    // Hero "More Info" button
    moreInfoButton.addEventListener('click', () => {
        const movieId = moreInfoButton.dataset.movieId;
        const mediaType = moreInfoButton.dataset.mediaType;
        if (movieId) {
            openMovieModal(movieId, mediaType);
        }
    });

    // Hero "Play" button (mock functionality)
    document.querySelector('.hero-buttons .play-button').addEventListener('click', () => {
        const movieId = moreInfoButton.dataset.movieId; // Use the current hero movie ID
        if (movieId) {
            alert(`Simulating playing movie ID: ${movieId}!`);
            // In a real app, this would redirect to a video player page
        } else {
            alert('No movie selected to play!');
        }
    });

    // Modal Play Trailer Button
    modalPlayButton.addEventListener('click', () => {
        if (currentMovieId) {
             alert(`Simulating playing trailer for movie ID: ${currentMovieId}!`);
            // In a real app, you might trigger a full screen video player here
        }
    });

    // --- Initialize the Page ---
    async function initializePage() {
        await setupHeroSection(); // Set up hero first
        await populateMovieRow('.originals-row', requests.fetchNetflixOriginals, true); // True for large cards
        await populateMovieRow('.trending-row', requests.fetchTrending);
        await populateMovieRow('.top-rated-row', requests.fetchTopRated);
        await populateMovieRow('.action-row', requests.fetchActionMovies);
        await populateMovieRow('.comedy-row', requests.fetchComedyMovies);
    }

    initializePage();
});
