/* ═══════════════════════════════════════════════
   CONTACT MODEL — Mongoose schema
   ═══════════════════════════════════════════════ */

const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
            maxlength: [100, 'Name cannot exceed 100 characters'],
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            trim: true,
            lowercase: true,
            match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address'],
        },
        subject: {
            type: String,
            trim: true,
            maxlength: [200, 'Subject cannot exceed 200 characters'],
            default: 'No Subject',
        },
        message: {
            type: String,
            required: [true, 'Message is required'],
            trim: true,
            minlength: [10, 'Message must be at least 10 characters'],
            maxlength: [5000, 'Message cannot exceed 5000 characters'],
        },
        ip: {
            type: String,
            default: '',
        },
        isRead: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true, // adds createdAt & updatedAt
    }
);

module.exports = mongoose.model('Contact', contactSchema);
