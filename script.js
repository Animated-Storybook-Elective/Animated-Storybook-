// Grab storyId from URL, default to 1 if not provided
const urlParams = new URLSearchParams(window.location.search);
const storyId = urlParams.get("storyId") || 1; // Default to story1 if no storyId is provided
const storyFile = `stories/story${storyId}.json`;

fetch(storyFile)
  .then((response) => {
    if (!response.ok) {
      throw new Error("Story file not found");
    }
    return response.json();
  })
  .then((data) => {
    const totalPages = data.pages.length;
    document.getElementById("total-pages").textContent = totalPages;

    let currentPage = 0;
    let narrationEnabled = true; // This flag is now automatically controlled
    let readOnlyMode = false; // Added read-only mode flag
    let bgMusic = null; // Background music instance
    let narration = null; // Narration instance

    const prevBtn = document.getElementById("prev-btn");
    const nextBtn = document.getElementById("next-btn");
    const readOnlyBtn = document.getElementById("read-only-btn");

    // Initialize page loading
    loadPage(currentPage, data);

    // Button event listeners for page transitions
    prevBtn.addEventListener("click", () => handlePageTurn(-1));
    nextBtn.addEventListener("click", () => handlePageTurn(1));

    // Toggle read-only mode
    readOnlyBtn.addEventListener("click", () => {
      readOnlyMode = !readOnlyMode;
      if (readOnlyMode) {
        // Stop any audio when in read-only mode
        if (narration) narration.stop();
        if (bgMusic) bgMusic.stop();
      }
      updateButtonStates();
    });

    // Handle page turn with sound
    function handlePageTurn(direction) {
      const pageTurnSound = new Howl({
        src: ["audios/sound-effects/pageturn.mp3"], // Make sure this path is correct
        volume: 1,
      });

      // Log for debugging to ensure the sound is being played
      console.log("Page turn sound playing...");
      pageTurnSound.play();

      // Disable buttons temporarily to avoid accidental multiple clicks
      prevBtn.disabled = true;
      nextBtn.disabled = true;

      // Immediately load the next or previous page
      currentPage += direction;

      // Ensure the page doesn't go out of bounds
      if (currentPage < 0) currentPage = 0;
      if (currentPage >= totalPages) currentPage = totalPages - 1;

      // Load the new page
      loadPage(currentPage, data);

      // Re-enable buttons after page load
      updateButtonStates();
    }

    // Function to update button states
    function updateButtonStates() {
      prevBtn.disabled = currentPage === 0; // Disable "Previous" button on the first page
      nextBtn.disabled = currentPage === totalPages - 1; // Disable "Next" button on the last page
    }

    // Function to load a page
    function loadPage(pageIndex, storyData) {
      const page = storyData.pages[pageIndex];
      document.getElementById("page-image").src = page.image;
      document.getElementById("page-text").textContent = page.text || "";
      document.getElementById("current-page").textContent = pageIndex + 1;

      // Stop any currently playing audio
      if (bgMusic) bgMusic.stop();
      if (narration) narration.stop();

      console.log("Loading page", pageIndex + 1); // Log page load to debug

      // Handle background music with delay, only if not on the last page
      if (page.bgMusic && !readOnlyMode && pageIndex !== storyData.pages.length - 1) {
        const delay = page.bgMusicDelay || 0; // Default to no delay
        bgMusic = new Howl({
          src: [page.bgMusic],
          volume: page.bgMusicVolume || 0.5,
          loop: true,
        });

        console.log("Loading background music for page", pageIndex + 1);

        // Start background music with a delay (if any)
        setTimeout(() => {
          bgMusic.play();
          console.log("Background music playing for page", pageIndex + 1);
        }, delay * 1000);
      }

      // Handle narration with delay, only if not in read-only mode
      if (page.narration && narrationEnabled && !readOnlyMode) {
        const narrationDelay = page.narrationDelay || 0; // Default to no delay
        narration = new Howl({
          src: [page.narration],
          volume: page.narrationVolume || 1,
          onend: () => {
            console.log("Narration ended.");
            if (bgMusic) bgMusic.stop(); // Stop background music after narration ends
          },
        });

        console.log("Loading narration for page", pageIndex + 1);

        // Start narration with delay (if any)
        setTimeout(() => {
          narration.play();
          console.log("Narration playing for page", pageIndex + 1);
        }, narrationDelay * 1000);
      }

      // Check if user has finished reading the last page
      if (pageIndex === storyData.pages.length - 1) {
        console.log("Reached the last page. Stopping background music.");
        if (bgMusic) bgMusic.stop(); // Ensure no background music on the last page
        showSuggestionModal(); // Trigger suggestion modal
      }

      updateButtonStates();
    }

    // Function to show the suggestion modal when story is finished
    function showSuggestionModal() {
      document.getElementById("suggestion-modal").classList.remove("hidden");
      document.body.classList.add("no-scroll"); // Prevent background scrolling
    }

    // Function to close the suggestion modal
    function closeSuggestionModal() {
      document.getElementById("suggestion-modal").classList.add("hidden");
      document.body.classList.remove("no-scroll"); // Re-enable background scrolling
    }

    // Function to suggest another story (redirects to book selection page)
    function suggestAnotherStory() {
      window.location.href = "storybook.html"; // Replace with actual path for book selection
    }

    // Event listeners for modal buttons
    document.querySelector(".close-modal").addEventListener("click", closeSuggestionModal);
    document.querySelector(".suggest-more-books").addEventListener("click", suggestAnotherStory);
  })
  .catch((error) => {
    console.error("Error loading story:", error);
  });
