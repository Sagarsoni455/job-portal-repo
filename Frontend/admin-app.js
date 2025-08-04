document.addEventListener('DOMContentLoaded', () => {
    // Determine API_BASE_URL based on environment
    const API_BASE_URL = window.location.hostname === 'localhost' ?
                         'http://localhost:3000/api' :
                         'https://mongodb://localhost:27017/jobportaldb/api';

    const sidebarToggle = document.getElementById('sidebarToggle');
    const wrapper = document.getElementById('wrapper');
    const sidebarLinks = document.querySelectorAll('#sidebar-wrapper .list-group-item');
    const contentSections = document.querySelectorAll('.content-section');
    // mainAdminContent and authPrompt are no longer needed for direct visibility

    const addJobForm = document.getElementById('addJobForm');
    const jobsTableBody = document.getElementById('jobsTableBody');
    const applicationsTableBody = document.getElementById('applicationsTableBody');

    const editJobModal = new bootstrap.Modal(document.getElementById('editJobModal'));
    const editJobForm = document.getElementById('editJobForm');
    const editJobId = document.getElementById('editJobId');
    const editJobTitle = document.getElementById('editJobTitle');
    const editCompanyName = document.getElementById('editCompanyName');
    const editJobLocation = document.getElementById('editJobLocation');
    const editJobSalary = document.getElementById('editJobSalary');
    const editJobDescription = document.getElementById('editJobDescription');

    const totalJobsCount = document.getElementById('totalJobsCount');
    const totalApplicationsCount = document.getElementById('totalApplicationsCount');
    const pendingApplicationsCount = document.getElementById('pendingApplicationsCount');

    // Admin login related elements removed: adminSignInForm, adminSignInModal, adminAuthNavLinks

    const adminToastLiveExample = document.getElementById('adminToast');
    const adminToastMessage = document.getElementById('adminToastMessage');

    // Function to show an admin toast message
    function showAdminToast(message, type = 'success') {
        adminToastMessage.textContent = message;
        adminToastLiveExample.classList.remove('text-bg-success', 'text-bg-danger', 'text-bg-warning', 'text-bg-info');
        if (type === 'success') {
            adminToastLiveExample.classList.add('text-bg-success');
        } else if (type === 'error') {
            adminToastLiveExample.classList.add('text-bg-danger');
        } else if (type === 'warning') {
            adminToastLiveExample.classList.add('text-bg-warning');
        } else if (type === 'info') {
            adminToastLiveExample.classList.add('text-bg-info');
        }
        const toast = new bootstrap.Toast(adminToastLiveExample);
        toast.show();
    }

    // --- Authentication functions are now removed for admin panel ---
    // getAdminAuthToken, getAdminLoggedInUser, setAdminAuthData, clearAdminAuthData, fetchWithAuth, updateAdminAuthUI, adminSignInForm.addEventListener are all removed.


    // Toggle sidebar for smaller screens
    sidebarToggle.addEventListener('click', (e) => {
        e.preventDefault();
        wrapper.classList.toggle('toggled');
    });

    // Handle sidebar navigation (no auth check needed here anymore)
    sidebarLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const targetSectionId = event.target.dataset.section;

            // Remove 'active' class from all links and sections
            sidebarLinks.forEach(l => l.classList.remove('active'));
            contentSections.forEach(s => s.classList.remove('active'));

            // Add 'active' class to the clicked link and target section
            event.target.classList.add('active');
            document.getElementById(targetSectionId).classList.add('active');

            // Refresh data based on the section
            if (targetSectionId === 'dashboardOverview') {
                updateDashboardCounts();
            } else if (targetSectionId === 'manageJobs') {
                renderJobsTable();
            } else if (targetSectionId === 'viewApplications') {
                renderApplicationsTable();
            }
        });
    });

    // Dashboard Overview
    async function updateDashboardCounts() {
        try {
            // No fetchWithAuth needed, direct fetch
            const [jobsResponse, applicationsResponse] = await Promise.all([
                fetch(`${API_BASE_URL}/jobs`),
                fetch(`${API_BASE_URL}/applications`)
            ]);

            if (!jobsResponse.ok) throw new Error(`HTTP error! Jobs status: ${jobsResponse.status}`);
            if (!applicationsResponse.ok) throw new Error(`HTTP error! Applications status: ${applicationsResponse.status}`);

            const jobs = await jobsResponse.json();
            const applications = await applicationsResponse.json();

            const pendingApplications = applications.filter(app => app.status === 'Pending');

            totalJobsCount.textContent = jobs.length;
            totalApplicationsCount.textContent = applications.length;
            pendingApplicationsCount.textContent = pendingApplications.length;
        } catch (error) {
            console.error('Error updating dashboard counts:', error);
            showAdminToast('Failed to load dashboard data. Please check backend.', 'error');
        }
    }

    // Manage Jobs Section
    async function renderJobsTable() {
        try {
            // No fetchWithAuth needed, direct fetch
            const response = await fetch(`${API_BASE_URL}/jobs`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const jobs = await response.json();
            jobsTableBody.innerHTML = '';

            if (jobs.length === 0) {
                jobsTableBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No job listings found.</td></tr>';
                return;
            }

            jobs.forEach(job => {
                const row = `
                    <tr>
                        <td>${job.title}</td>
                        <td>${job.company}</td>
                        <td>${job.location}</td>
                        <td>${job.salary || 'N/A'}</td>
                        <td>${new Date(job.postedDate).toLocaleDateString()}</td>
                        <td>
                            <button class="btn btn-sm btn-info me-2 edit-job-btn" data-job-id="${job._id}">Edit</button>
                            <button class="btn btn-sm btn-danger delete-job-btn" data-job-id="${job._id}">Delete</button>
                        </td>
                    </tr>
                `;
                jobsTableBody.innerHTML += row;
            });

            attachJobTableListeners();
        } catch (error) {
            console.error('Error fetching jobs for admin panel:', error);
            showAdminToast('Failed to load jobs for management. Please check backend.', 'error');
        }
    }

    function attachJobTableListeners() {
        document.querySelectorAll('.edit-job-btn').forEach(button => {
            button.removeEventListener('click', handleEditJobClick);
            button.addEventListener('click', handleEditJobClick);
        });

        document.querySelectorAll('.delete-job-btn').forEach(button => {
            button.removeEventListener('click', handleDeleteJobClick);
            button.addEventListener('click', handleDeleteJobClick);
        });
    }

    async function handleEditJobClick(event) {
        const jobId = event.target.dataset.jobId;
        try {
            // No fetchWithAuth needed, direct fetch
            const response = await fetch(`${API_BASE_URL}/jobs/${jobId}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }
            const jobToEdit = await response.json();
            if (jobToEdit) {
                editJobId.value = jobToEdit._id;
                editJobTitle.value = jobToEdit.title;
                editCompanyName.value = jobToEdit.company;
                editJobLocation.value = jobToEdit.location;
                editJobSalary.value = jobToEdit.salary || '';
                editJobDescription.value = jobToEdit.description;
                editJobModal.show();
            }
        } catch (error) {
            console.error('Error fetching job for edit:', error);
            showAdminToast(`Failed to load job details for editing: ${error.message}`, 'error');
        }
    }

    async function handleDeleteJobClick(event) {
        const jobId = event.target.dataset.jobId;
        if (confirm('Are you sure you want to delete this job? This will also delete associated applications!')) {
            try {
                // No fetchWithAuth needed, direct fetch
                const response = await fetch(`${API_BASE_URL}/jobs/${jobId}`, {
                    method: 'DELETE'
                });
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
                }
                showAdminToast('Job deleted successfully!', 'success');
                renderJobsTable();
                updateDashboardCounts();
                renderApplicationsTable();
            } catch (error) {
                console.error('Error deleting job:', error);
                showAdminToast(`Failed to delete job: ${error.message}`, 'error');
            }
        }
    }


    // Add New Job
    addJobForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const newJob = {
            title: document.getElementById('jobTitle').value.trim(),
            company: document.getElementById('companyName').value.trim(),
            location: document.getElementById('jobLocation').value.trim(),
            salary: document.getElementById('jobSalary').value.trim(),
            description: document.getElementById('jobDescription').value.trim(),
        };

        if (!newJob.title || !newJob.company || !newJob.location || !newJob.description) {
            showAdminToast('Please fill all required job fields.', 'error');
            return;
        }

        try {
            // No fetchWithAuth needed, direct fetch
            const response = await fetch(`${API_BASE_URL}/jobs`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newJob)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }

            console.log('Job added:', data);
            renderJobsTable();
            addJobForm.reset();
            showAdminToast('Job added successfully!', 'success');
            updateDashboardCounts();
        } catch (error) {
            console.error('Error adding job:', error);
            showAdminToast(`Failed to add job: ${error.message}`, 'error');
        }
    });

    // Edit Job
    editJobForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const jobId = editJobId.value;
        const updatedJob = {
            title: editJobTitle.value.trim(),
            company: editCompanyName.value.trim(),
            location: editJobLocation.value.trim(),
            salary: editJobSalary.value.trim(),
            description: editJobDescription.value.trim(),
        };

        if (!updatedJob.title || !updatedJob.company || !updatedJob.location || !updatedJob.description) {
            showAdminToast('Please fill all required job fields.', 'error');
            return;
        }

        try {
            // No fetchWithAuth needed, direct fetch
            const response = await fetch(`${API_BASE_URL}/jobs/${jobId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedJob)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }

            console.log('Job updated:', data);
            renderJobsTable();
            editJobModal.hide();
            showAdminToast('Job updated successfully!', 'success');
            updateDashboardCounts();
        } catch (error) {
            console.error('Error updating job:', error);
            showAdminToast(`Failed to update job: ${error.message}`, 'error');
        }
    });

    // View Applications Section
    async function renderApplicationsTable() {
        try {
            // No fetchWithAuth needed, direct fetch
            const response = await fetch(`${API_BASE_URL}/applications`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const applications = await response.json();

            applicationsTableBody.innerHTML = '';

            if (applications.length === 0) {
                applicationsTableBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No applications found.</td></tr>';
                return;
            }

            applications.forEach(app => {
                const jobTitle = app.jobId ? app.jobId.title : 'N/A (Job Deleted)';
                const row = `
                    <tr>
                        <td>${app.name}</td>
                        <td>${app.email}</td>
                        <td><span class="text-primary" title="${jobTitle}">${jobTitle.length > 30 ? jobTitle.substring(0, 27) + '...' : jobTitle}</span></td>
                        <td>${new Date(app.appliedDate).toLocaleDateString()}</td>
                        <td>
                            <span class="badge ${app.status === 'Pending' ? 'bg-warning' : (app.status === 'Accepted' ? 'bg-success' : 'bg-danger')}">${app.status}</span>
                        </td>
                        <td>
                            <a href="${app.resumeLink}" target="_blank" class="btn btn-sm btn-secondary me-2 ${!app.resumeLink ? 'disabled' : ''}">View Resume</a>
                            <button class="btn btn-sm btn-success me-2 status-btn" data-app-id="${app._id}" data-status="Accepted" ${app.status === 'Accepted' ? 'disabled' : ''}>Accept</button>
                            <button class="btn btn-sm btn-danger status-btn" data-app-id="${app._id}" data-status="Rejected" ${app.status === 'Rejected' ? 'disabled' : ''}>Reject</button>
                        </td>
                    </tr>
                `;
                applicationsTableBody.innerHTML += row;
            });

            attachApplicationStatusListeners();
        } catch (error) {
            console.error('Error fetching applications for admin panel:', error);
            showAdminToast('Failed to load applications for management. Please check backend.', 'error');
        }
    }

    function attachApplicationStatusListeners() {
        document.querySelectorAll('.status-btn').forEach(button => {
            button.removeEventListener('click', handleApplicationStatusClick);
            button.addEventListener('click', handleApplicationStatusClick);
        });
    }

    async function handleApplicationStatusClick(event) {
        const appId = event.target.dataset.appId;
        const newStatus = event.target.dataset.status;

        try {
            // No fetchWithAuth needed, direct fetch
            const response = await fetch(`${API_BASE_URL}/applications/${appId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }

            console.log('Application status updated:', data);
            renderApplicationsTable();
            updateDashboardCounts();
            showAdminToast(`Application status updated to '${newStatus}'!`, 'success');
        } catch (error) {
            console.error('Error updating application status:', error);
            showAdminToast(`Failed to update application status: ${error.message}`, 'error');
        }
    }


    // Initial load when the page loads (no auth check needed here)
    updateDashboardCounts(); // Loads initial counts for dashboard
    document.querySelector('[data-section="dashboardOverview"]').click(); // Activates dashboard overview on load
});