document.addEventListener('DOMContentLoaded', () => {
    // Determine API_BASE_URL based on environment
    const API_BASE_URL = window.location.hostname === 'localhost' ?
                         'http://localhost:3000/api' :
                         'https://https://mongodb://localhost:27017/jobportaldb/api';

    const jobListingsContainer = document.getElementById('jobListings');
    const searchBar = document.getElementById('searchBar');
    const locationSearchBar = document.getElementById('locationSearchBar'); // New element for location search
    const searchButton = document.getElementById('searchButton');
    const applyModal = new bootstrap.Modal(document.getElementById('applyModal'));
    const modalJobTitle = document.getElementById('modalJobTitle');
    const applicationForm = document.getElementById('applicationForm');
    const applicationJobId = document.getElementById('applicationJobId');
    const submitApplicationButton = document.getElementById('submitApplicationButton');
    const authNavLinks = document.getElementById('authNavLinks'); // This might need a re-evaluation based on new header structure

    const signUpForm = document.getElementById('signUpForm');
    const signInForm = document.getElementById('signInForm');
    const signUpModal = bootstrap.Modal.getInstance(document.getElementById('signUpModal')) || new bootstrap.Modal(document.getElementById('signUpModal'));
    const signInModal = bootstrap.Modal.getInstance(document.getElementById('signInModal')) || new bootstrap.Modal(document.getElementById('signInModal'));

    const toastLiveExample = document.getElementById('liveToast');
    const toastMessage = document.getElementById('toastMessage');

    // New elements for the "Learn More" modal
    const learnMoreModal = new bootstrap.Modal(document.getElementById('learnMoreModal'));
    const modalJobDetailsTitle = document.getElementById('modalJobDetailsTitle');
    const modalJobDetailsCompany = document.getElementById('modalJobDetailsCompany');
    const modalJobDetailsLocation = document.getElementById('modalJobDetailsLocation');
    const modalJobDetailsSalary = document.getElementById('modalJobDetailsSalary');
    const modalJobDetailsDate = document.getElementById('modalJobDetailsDate');
    const modalJobDetailsDescription = document.getElementById('modalJobDetailsDescription');


    // Function to show a toast message
    function showToast(message, type = 'success') {
        toastMessage.textContent = message;
        toastLiveExample.classList.remove('text-bg-success', 'text-bg-danger', 'text-bg-warning', 'text-bg-info');
        if (type === 'success') {
            toastLiveExample.classList.add('text-bg-success');
        } else if (type === 'error') {
            toastLiveExample.classList.add('text-bg-danger');
        } else if (type === 'warning') {
            toastLiveExample.classList.add('text-bg-warning');
        } else if (type === 'info') {
            toastLiveExample.classList.add('text-bg-info');
        }
        const toast = new bootstrap.Toast(toastLiveExample);
        toast.show();
    }

    // --- Authentication Functions ---

    function getAuthToken() {
        return localStorage.getItem('token');
    }

    function getLoggedInUser() {
        try {
            const userString = localStorage.getItem('user');
            return userString ? JSON.parse(userString) : null;
        } catch (e) {
            console.error("Error parsing user data from localStorage", e);
            return null;
        }
    }

    function setAuthData(token, user) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        updateAuthUI();
    }

    function clearAuthData() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        updateAuthUI();
        showToast('Logged out successfully!', 'info');
    }

    // Function to update the navigation bar based on login status
    function updateAuthUI() {
        const token = getAuthToken();
        const user = getLoggedInUser();
        const navAuthContainer = document.querySelector('.navbar .d-flex'); // Select the div containing auth buttons

        if (token && user) {
            // User is logged in
            const userEmail = user.email || 'User';
            navAuthContainer.innerHTML = `
                <span class="nav-link text-dark me-2">Welcome, ${userEmail.split('@')[0]}</span>
                <a class="btn btn-outline-danger rounded-pill" href="#" id="logoutButton">Logout</a>
            `;
            // Add event listener for logout button
            document.getElementById('logoutButton').addEventListener('click', clearAuthData);

            // Enable apply buttons if logged in
            document.querySelectorAll('.apply-btn').forEach(button => {
                button.disabled = false;
                button.classList.remove('btn-secondary');
                button.classList.add('btn-primary');
            });
            submitApplicationButton.style.display = 'block';

        } else {
            // User is not logged in
            navAuthContainer.innerHTML = `
                <a class="btn btn-link text-decoration-none text-dark me-2" href="#" data-bs-toggle="modal" data-bs-target="#signInModal">Sign In</a>
                <a class="btn btn-primary-custom rounded-pill" href="#" data-bs-toggle="modal" data-bs-target="#signUpModal">Sign Up</a>
            `;
            // Disable apply buttons if not logged in
            document.querySelectorAll('.apply-btn').forEach(button => {
                button.disabled = true;
                button.classList.remove('btn-primary');
                button.classList.add('btn-secondary');
            });
            submitApplicationButton.style.display = 'none';
        }
    }

    // SignUp Form Submission
    signUpForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const email = document.getElementById('signUpEmail').value.trim();
        const password = document.getElementById('signUpPassword').value.trim();

        try {
            const response = await fetch(`${API_BASE_URL}/auth/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password, role: 'user' })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to sign up.');
            }

            setAuthData(data.token, data.user);
            signUpModal.hide();
            showToast('Sign up successful! Welcome!', 'success');

        } catch (error) {
            console.error('Signup error:', error);
            showToast(`Sign up failed: ${error.message}`, 'error');
        }
    });

    // SignIn Form Submission
    signInForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const email = document.getElementById('signInEmail').value.trim();
        const password = document.getElementById('signInPassword').value.trim();

        try {
            const response = await fetch(`${API_BASE_URL}/auth/signin`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to sign in.');
            }

            setAuthData(data.token, data.user);
            signInModal.hide();
            showToast('Login successful! Welcome back!', 'success');

        } catch (error) {
            console.error('Signin error:', error);
            showToast(`Login failed: ${error.message}`, 'error');
        }
    });


    // --- Job Listing and Application Functions (Modified for Auth) ---

    // Function to render job listings
    function renderJobListings(jobs) {
        jobListingsContainer.innerHTML = '';
        if (jobs.length === 0) {
            jobListingsContainer.innerHTML = '<div class="col-12 text-center text-muted">No jobs found matching your criteria.</div>';
            return;
        }

        const user = getLoggedInUser();
        const isUserLoggedIn = !!user;

        jobs.forEach(job => {
            const applyButtonHTML = isUserLoggedIn ?
                `<button class="btn btn-primary rounded-pill apply-btn" data-job-id="${job._id}" data-job-title="${job.title}">Apply Now</button>` :
                `<button class="btn btn-secondary rounded-pill apply-btn" disabled title="Please sign in to apply">Apply Now</button>`;

            // Format the posted date
            const postedDate = new Date(job.postedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

            const jobCard = `
                <div class="col-md-6 col-lg-4 mb-4">
                    <div class="card job-card-custom h-100">
                        <div class="card-body d-flex flex-column">
                            <div class="job-icon">
                                <i class="fas fa-briefcase"></i>
                            </div>
                            <h5 class="job-title">${job.title}</h5>
                            <div class="mb-2">
                                <span class="job-tag">${job.location}</span>
                                <span class="job-tag">Senior level</span>
                                <span class="job-tag text-muted">Posted: ${postedDate}</span> </div>
                            <p class="job-description">${job.description.substring(0, 120)}${job.description.length > 120 ? '...' : ''}</p>
                            <div class="mt-auto card-buttons">
                                ${applyButtonHTML}
                                <button class="btn btn-outline-primary rounded-pill ms-2 learn-more-btn" data-job-id="${job._id}">Learn more</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            jobListingsContainer.innerHTML += jobCard;
        });

        document.querySelectorAll('.apply-btn:not([disabled])').forEach(button => {
            button.addEventListener('click', (event) => {
                const jobId = event.target.dataset.jobId;
                const jobTitle = event.target.dataset.jobTitle;
                modalJobTitle.textContent = jobTitle;
                applicationJobId.value = jobId;

                const currentUser = getLoggedInUser();
                if (currentUser) {
                    document.getElementById('applicantName').value = currentUser.email.split('@')[0];
                    document.getElementById('applicantEmail').value = currentUser.email;
                } else {
                    document.getElementById('applicantName').value = '';
                    document.getElementById('applicantEmail').value = '';
                }

                applyModal.show();
            });
        });

        // Add event listener for "Learn more" buttons if needed for detailed view
        document.querySelectorAll('.learn-more-btn').forEach(button => {
            button.addEventListener('click', async (event) => {
                const jobId = event.target.dataset.jobId;
                try {
                    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}`);
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    const jobDetails = await response.json();

                    if (jobDetails) {
                        modalJobDetailsTitle.textContent = jobDetails.title;
                        modalJobDetailsCompany.textContent = jobDetails.company;
                        modalJobDetailsLocation.textContent = jobDetails.location;
                        modalJobDetailsSalary.textContent = jobDetails.salary || 'N/A';
                        modalJobDetailsDate.textContent = new Date(jobDetails.postedDate).toLocaleDateString(); // Added to modal
                        modalJobDetailsDescription.innerHTML = jobDetails.description; // Use innerHTML for rich text
                        learnMoreModal.show();
                    } else {
                        showToast('Job details not found.', 'error');
                    }
                } catch (error) {
                    console.error('Error fetching job details:', error);
                    showToast('Failed to load job details. Please try again later.', 'error');
                }
            });
        });
    }

    async function loadJobs(searchTerm = '', locationTerm = '') {
        try {
            const response = await fetch(`${API_BASE_URL}/jobs`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const jobs = await response.json();

            const filteredJobs = jobs.filter(job => {
                const matchesSearch = searchTerm === '' ||
                                      (job.title && job.title.toLowerCase().includes(searchTerm)) ||
                                      (job.company && job.company.toLowerCase().includes(searchTerm)) ||
                                      (job.description && job.description.toLowerCase().includes(searchTerm));
                const matchesLocation = locationTerm === '' ||
                                        (job.location && job.location.toLowerCase().includes(locationTerm));
                return matchesSearch && matchesLocation;
            });

            renderJobListings(filteredJobs);
        } catch (error) {
            console.error('Error fetching jobs:', error);
            showToast('Failed to load jobs. Please try again later.', 'error');
        }
    }

    searchButton.addEventListener('click', () => {
        const searchTerm = searchBar.value.toLowerCase().trim();
        const locationTerm = locationSearchBar.value.toLowerCase().trim();
        loadJobs(searchTerm, locationTerm);
    });

    searchBar.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
            searchButton.click();
        }
    });

    locationSearchBar.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
            searchButton.click();
        }
    });

    // Handle application form submission
    applicationForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const name = document.getElementById('applicantName').value.trim();
        const email = document.getElementById('applicantEmail').value.trim();
        const resumeLink = document.getElementById('resumeLink').value.trim();
        const coverLetter = document.getElementById('coverLetter').value.trim();
        const jobId = applicationJobId.value;
        const token = getAuthToken();

        if (!token) {
            showToast('You must be logged in to apply for a job.', 'error');
            applyModal.hide();
            signInModal.show();
            return;
        }

        if (!name || !email) {
            showToast('Please fill in your Name and Email Address.', 'error');
            return;
        }

        const newApplication = {
            jobId: jobId,
            name: name,
            email: email,
            resumeLink: resumeLink,
            coverLetter: coverLetter,
        };

        try {
            const response = await fetch(`${API_BASE_URL}/applications`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newApplication)
            });

            const data = await response.json();

            if (!response.ok) {
                const errorMessage = data.message || `HTTP error! status: ${response.status}`;
                throw new Error(errorMessage);
            }

            console.log('Application submitted:', data);
            applicationForm.reset();
            applyModal.hide();
            showToast('Application submitted successfully!', 'success');
        } catch (error) {
            console.error('Error submitting application:', error);
            if (error.message.includes('token')) {
                showToast(`Failed to submit application: ${error.message}. Please log in again.`, 'error');
                clearAuthData();
                signInModal.show();
            } else {
                showToast(`Failed to submit application: ${error.message}`, 'error');
            }
        }
    });

    // Initial setup when the page loads
    updateAuthUI();
    loadJobs();
});
