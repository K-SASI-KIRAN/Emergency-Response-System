
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
        mongoose.set('debug', true);
        await mongoose.connect("mongodb://localhost:27017/emergencyDB", {
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
    reporter: String,
    type: String,
    description: String,
    priority: String,
    location: String,
    status: {
        type: String,
        default: 'pending'
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

const Emergency = mongoose.model('Emergency', emergencySchema);

app.post('/api/emergencies', async (req, res) => {
    try {
        console.log('📥 Received emergency data:', req.body);
        const emergency = await Emergency.create(req.body);
        res.status(201).json({
            message: 'Emergency created successfully',
            data: emergency
        });
    } catch (error) {
        res.status(500).json({
            message: 'Failed to create emergency',
            error: error.message
        });
    }
});

app.get('/api/emergencies', async (req, res) => {
    try {
        console.log('📤 Fetching emergencies...');
        
        
        
       

        const emergencies = await Emergency.find({
            $or: [
                { status: 'pending' },
                { status: 'resolved', timestamp: { $gte: startOfDay } }
            ]
        }).sort('-createdAt');
        

        res.json(emergencies);
    } catch (error) {
        res.status(500).json({
            message: 'Failed to fetch emergencies',
            error: error.message
        });
    }
});


app.patch('/api/emergencies/:id', async (req, res) => {
    try {
        const emergency = await Emergency.findByIdAndUpdate(
            req.params.id,
            { status: 'resolved' },
            { new: true }
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

app.get('/api/stats', async (req, res) => {
    try {
        const stats = await Emergency.aggregate([
            {
                $group: {
                    _id: null,
                    active: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
                    resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
                    pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } }
                }
            }
        ]);
        res.json(stats[0] || { active: 0, resolved: 0, pending: 0 });
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
