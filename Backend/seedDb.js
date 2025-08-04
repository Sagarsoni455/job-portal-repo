// seedDb.js
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid'); // Just for consistency in mock data IDs if needed, Mongoose generates _id

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/jobportaldb';

const jobSchema = new mongoose.Schema({
    title: { type: String, required: true },
    company: { type: String, required: true },
    location: { type: String, required: true },
    description: { type: String, required: true },
    salary: { type: String },
    postedDate: { type: Date, default: Date.now }
});

const Job = mongoose.model('Job', jobSchema);

const initialJobs = [
    {
        title: 'Senior Software Engineer',
        company: 'InnovateX',
        location: 'Remote',
        description: 'Seeking an experienced software engineer to build scalable web applications using modern frameworks like Node.js and React.',
        salary: '$120,000 - $150,000',
        postedDate: new Date('2025-07-29')
    },
    {
        title: 'Product Manager',
        company: 'GrowthCorp',
        location: 'San Francisco, CA',
        description: 'Lead the product lifecycle from ideation to launch for our flagship mobile app. Strong communication skills required.',
        salary: '$130,000 - $160,000',
        postedDate: new Date('2025-07-28')
    },
    {
        title: 'DevOps Specialist',
        company: 'CloudFlow Solutions',
        location: 'New York, NY',
        description: 'Implement and manage CI/CD pipelines, cloud infrastructure (AWS/Azure), and automation tools (Terraform, Ansible).',
        salary: '$110,000 - $140,000',
        postedDate: new Date('2025-07-27')
    },
    {
        title: 'Junior Frontend Developer',
        company: 'WebPulse',
        location: 'Remote',
        description: 'Entry-level position for a passionate developer eager to learn React, Vue.js, and build engaging user interfaces. HTML, CSS, JS fundamentals are a must.',
        salary: '$60,000 - $75,000',
        postedDate: new Date('2025-07-26')
    },
    {
        title: 'Data Analyst',
        company: 'QuantInsights',
        location: 'Boston, MA',
        description: 'Analyze complex datasets using SQL, Python (Pandas), and R to provide actionable insights and support data-driven decisions.',
        salary: '$85,000 - $105,000',
        postedDate: new Date('2025-07-25')
    },
    {
        title: 'Marketing Specialist',
        company: 'BrandBoost Agency',
        location: 'Los Angeles, CA',
        description: 'Develop and execute digital marketing campaigns, manage social media, and analyze performance metrics.',
        salary: '$55,000 - $70,000',
        postedDate: new Date('2025-07-24')
    },
    {
        title: 'Human Resources Generalist',
        company: 'PeopleFirst Inc.',
        location: 'Chicago, IL',
        description: 'Manage employee relations, recruitment, and HR policies. Experience with HRIS systems a plus.',
        salary: '$65,000 - $80,000',
        postedDate: new Date('2025-07-23')
    }
];

async function seedDatabase() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('MongoDB connected for seeding.');

        // Check if jobs collection is empty before seeding
        const jobCount = await Job.countDocuments();
        if (jobCount === 0) {
            await Job.insertMany(initialJobs);
            console.log('Initial job data seeded successfully!');
        } else {
            console.log('Jobs collection already has data. Skipping seeding.');
        }

    } catch (err) {
        console.error('Database seeding failed:', err);
    } finally {
        await mongoose.disconnect();
        console.log('MongoDB disconnected.');
    }
}

seedDatabase();