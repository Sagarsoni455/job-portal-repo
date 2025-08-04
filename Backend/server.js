const express = require('express');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/jobportaldb';
const JWT_SECRET = process.env.JWT_SECRET || 'HS256, HS384, HS512'; // **IMPORTANT: CHANGE THIS IN PRODUCTION!**

// --- Mongoose Connection ---
mongoose.connect(MONGODB_URI)
    .then(() => console.log('MongoDB connected successfully!'))
    .catch(err => console.error('MongoDB connection error:', err));
// --- End Mongoose Connection ---

// --- Mongoose Schemas and Models ---
const jobSchema = new mongoose.Schema({
    title: { type: String, required: true },
    company: { type: String, required: true },
    location: { type: String, required: true },
    description: { type: String, required: true },
    salary: { type: String },
    postedDate: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    registeredDate: { type: Date, default: Date.now }
});

const applicationSchema = new mongoose.Schema({
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    name: { type: String, required: true },
    email: { type: String, required: true },
    resumeLink: { type: String },
    coverLetter: { type: String },
    appliedDate: { type: Date, default: Date.now },
    status: { type: String, enum: ['Pending', 'Accepted', 'Rejected'], default: 'Pending' }
});

const Job = mongoose.model('Job', jobSchema);
const User = mongoose.model('User', userSchema);
const Application = mongoose.model('Application', applicationSchema);
// --- End Mongoose Schemas and Models ---


// --- CORS Configuration ---
const productionFrontendOrigins = [
    'https://your-job-portal-frontend.com',
    'https://your-admin-panel-frontend.com'
];

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:') || productionFrontendOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error(`Not allowed by CORS: ${origin}`));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
// --- End CORS Configuration ---

app.use(express.json());

// --- Serve static frontend files ---
const frontendPath = path.join(__dirname, '../Frontend');
app.use(express.static(frontendPath));
// --- End serve static files ---


// --- Authentication Middleware (These remain for job seeker applications) ---

// Middleware to verify JWT token
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ message: 'Authentication token required.' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            console.error('JWT verification failed:', err);
            return res.status(403).json({ message: 'Invalid or expired token.' });
        }
        req.user = user; // Attach user payload to request
        next();
    });
}

// authorizeAdmin middleware is effectively not used for job/app management routes now
// but keeping it here for clarity if you wish to re-introduce admin roles later for other purposes
function authorizeAdmin(req, res, next) {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Access denied: Admin role required.' });
    }
}
// --- End Authentication Middleware ---


// --- Authentication Routes (These remain for job seeker signup/signin) ---
// POST /api/auth/signup: Register a new user
app.post('/api/auth/signup', async (req, res) => {
    const { email, password, role } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }
    if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    try {
        let existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: 'User with that email already exists.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            email,
            password: hashedPassword,
            role: (role === 'admin') ? 'admin' : 'user'
        });

        const savedUser = await newUser.save();

        const token = jwt.sign(
            { id: savedUser._id, email: savedUser.email, role: savedUser.role },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.status(201).json({
            message: 'User registered successfully!',
            token,
            user: {
                id: savedUser._id,
                email: savedUser.email,
                role: savedUser.role
            }
        });

    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ message: 'Server error during registration.', error: error.message });
    }
});

// POST /api/auth/signin: Authenticate user and return JWT
app.post('/api/auth/signin', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials.' });
        }

        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({
            message: 'Logged in successfully!',
            token,
            user: {
                id: user._id,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Signin error:', error);
        res.status(500).json({ message: 'Server error during login.', error: error.message });
    }
});
// --- End Authentication Routes ---


// --- API Endpoints (NOW PUBLICLY ACCESSIBLE FOR JOB/APPLICATION MANAGEMENT) ---

// GET /api/jobs: Retrieve all job listings. (Publicly accessible)
app.get('/api/jobs', async (req, res) => {
    try {
        const jobs = await Job.find().sort({ postedDate: -1 });
        res.json(jobs);
    } catch (error) {
        console.error('Error fetching jobs:', error);
        res.status(500).json({ message: 'Failed to fetch jobs.', error: error.message });
    }
});

// GET /api/jobs/:id: Retrieve a single job listing by ID. (Publicly accessible)
app.get('/api/jobs/:id', async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);
        if (job) {
            res.json(job);
        } else {
            res.status(404).json({ message: 'Job not found' });
        }
    } catch (error) {
        console.error('Error fetching single job:', error);
        res.status(400).json({ message: 'Invalid job ID or job not found.', error: error.message });
    }
});

// POST /api/jobs: Add a new job listing. (NOW PUBLICLY ACCESSIBLE)
app.post('/api/jobs', async (req, res) => { // Removed authenticateToken, authorizeAdmin
    const { title, company, location, salary, description } = req.body;
    if (!title || !company || !location || !description) {
        return res.status(400).json({ message: 'Missing required job fields: title, company, location, description' });
    }
    try {
        const newJob = new Job({
            title,
            company,
            location,
            salary,
            description
        });
        const savedJob = await newJob.save();
        res.status(201).json(savedJob);
    } catch (error) {
        console.error('Error adding job:', error);
        res.status(500).json({ message: 'Failed to add job.', error: error.message });
    }
});

// PUT /api/jobs/:id: Update an existing job listing. (NOW PUBLICLY ACCESSIBLE)
app.put('/api/jobs/:id', async (req, res) => { // Removed authenticateToken, authorizeAdmin
    const { title, company, location, salary, description } = req.body;
    if (!title || !company || !location || !description) {
        return res.status(400).json({ message: 'Missing required job fields: title, company, location, description' });
    }
    try {
        const updatedJob = await Job.findByIdAndUpdate(
            req.params.id,
            { title, company, location, salary, description },
            { new: true, runValidators: true }
        );
        if (updatedJob) {
            res.json(updatedJob);
        } else {
            res.status(404).json({ message: 'Job not found for update.' });
        }
    } catch (error) {
        console.error('Error updating job:', error);
        res.status(400).json({ message: 'Failed to update job.', error: error.message });
    }
});

// DELETE /api/jobs/:id: Delete a job listing. (NOW PUBLICLY ACCESSIBLE)
app.delete('/api/jobs/:id', async (req, res) => { // Removed authenticateToken, authorizeAdmin
    try {
        const deletedJob = await Job.findByIdAndDelete(req.params.id);
        if (deletedJob) {
            await Application.deleteMany({ jobId: req.params.id });
            res.status(204).send();
        } else {
            res.status(404).json({ message: 'Job not found for deletion.' });
        }
    } catch (error) {
        console.error('Error deleting job:', error);
        res.status(500).json({ message: 'Failed to delete job.', error: error.message });
    }
});

// GET /api/applications: Retrieve all job applications. (NOW PUBLICLY ACCESSIBLE)
app.get('/api/applications', async (req, res) => { // Removed authenticateToken, authorizeAdmin
    try {
        const applications = await Application.find().populate('jobId', 'title company').sort({ appliedDate: -1 });
        res.json(applications);
    } catch (error) {
        console.error('Error fetching applications:', error);
        res.status(500).json({ message: 'Failed to fetch applications.', error: error.message });
    }
});

// POST /api/applications: Submit a new job application. (AUTHENTICATED - User or Admin)
// ** This route still requires authentication for the job seeker side **
app.post('/api/applications', authenticateToken, async (req, res) => {
    const { jobId, name, email, resumeLink, coverLetter } = req.body;
    const userId = req.user.id; // Get userId from the authenticated token

    if (!jobId || !name || !email) {
        return res.status(400).json({ message: 'Missing required application fields: jobId, name, email' });
    }
    try {
        const jobExists = await Job.findById(jobId);
        if (!jobExists) {
            return res.status(400).json({ message: 'Invalid jobId provided: Job does not exist.' });
        }

        const newApplication = new Application({
            jobId,
            userId,
            name,
            email,
            resumeLink,
            coverLetter
        });
        const savedApplication = await newApplication.save();
        res.status(201).json(savedApplication);
    } catch (error) {
        console.error('Error submitting application:', error);
        res.status(500).json({ message: 'Failed to submit application.', error: error.message });
    }
});

// PUT /api/applications/:id/status: Update the status of an application. (NOW PUBLICLY ACCESSIBLE)
app.put('/api/applications/:id/status', async (req, res) => { // Removed authenticateToken, authorizeAdmin
    const { status } = req.body;
    if (!status || !['Pending', 'Accepted', 'Rejected'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status provided. Must be Pending, Accepted, or Rejected.' });
    }
    try {
        const updatedApplication = await Application.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true, runValidators: true }
        );
        if (updatedApplication) {
            res.json(updatedApplication);
        } else {
            res.status(404).json({ message: 'Application not found for status update.' });
        }
    } catch (error) {
        console.error('Error updating application status:', error);
        res.status(400).json({ message: 'Failed to update application status.', error: error.message });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`MongoDB connected to: ${MONGODB_URI}`);
    console.log(`Job Portal (Public): http://localhost:${PORT}/index.html`);
    console.log(`Admin Panel (Simplified Access): http://localhost:${PORT}/admin.html`); // Updated message
    console.log(`JWT Secret (Dev Only): ${JWT_SECRET}`);
});