const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// MongoDB Connection
const connectDB = async () => {
    try {
        // Set debug to false in production for cleaner logs
        mongoose.set('debug', process.env.NODE_ENV !== 'production');
        await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/emergencyDB", {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ MongoDB Connected Successfully');
    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error);
        process.exit(1);
    }
};

connectDB();

const emergencySchema = new mongoose.Schema({
    reporter: { type: String, required: true },
    type: { type: String, required: true },
    description: { type: String, required: true },
    priority: { type: String, required: true },
    location: { type: String, required: true },
    status: {
        type: String,
        default: 'pending', // Can be 'pending' or 'resolved'
        enum: ['pending', 'resolved']
    },
}, { timestamps: true }); // Automatically adds createdAt and updatedAt

const Emergency = mongoose.model('Emergency', emergencySchema);

// CREATE a new emergency
app.post('/api/emergencies', async (req, res) => {
    try {
        const emergency = await Emergency.create(req.body);
        res.status(201).json(emergency);
    } catch (error) {
        res.status(400).json({
            message: 'Failed to create emergency. Please check input data.',
            error: error.message
        });
    }
});

// READ all pending emergencies and recently resolved ones
app.get('/api/emergencies', async (req, res) => {
    try {
        // Get all pending and all resolved emergencies from the last 24 hours
        const startOfDay = new Date();
        startOfDay.setDate(startOfDay.getDate() - 1); // Go back 24 hours

        const emergencies = await Emergency.find({
            $or: [
                { status: 'pending' },
                { status: 'resolved', updatedAt: { $gte: startOfDay } }
            ]
        }).sort({ createdAt: -1 }); // Show newest first

        res.json(emergencies);
    } catch (error) {
        res.status(500).json({
            message: 'Failed to fetch emergencies',
            error: error.message
        });
    }
});

// UPDATE an emergency to 'resolved'
app.patch('/api/emergencies/:id', async (req, res) => {
    try {
        const emergency = await Emergency.findByIdAndUpdate(
            req.params.id,
            { status: 'resolved' }, // Only update the status
            { new: true } // Return the updated document
        );

        if (!emergency) {
            return res.status(404).json({ message: 'Emergency not found' });
        }

        res.json(emergency);
    } catch (error) {
        res.status(500).json({
            message: 'Failed to update emergency',
            error: error.message
        });
    }
});

// GET statistics
app.get('/api/stats', async (req, res) => {
    try {
        const stats = await Emergency.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        const formattedStats = {
            active: 0,
            resolved: 0,
            pending: 0,
        };

        stats.forEach(stat => {
            if (stat._id === 'pending') {
                formattedStats.active = stat.count;
                formattedStats.pending = stat.count;
            } else if (stat._id === 'resolved') {
                formattedStats.resolved = stat.count;
            }
        });
        
        res.json(formattedStats);
    } catch (error) {
        res.status(500).json({
            message: 'Failed to calculate statistics',
            error: error.message
        });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
