/* ═══════════════════════════════════════════════
   CONTACT ROUTES — /api/contact
   ═══════════════════════════════════════════════
   Works with MongoDB OR JSON file storage.
   POST /api/contact      → submit a contact message
   GET  /api/contact      → list all messages (admin)
   GET  /api/contact/:id  → get single message
   PATCH /api/contact/:id → mark as read
   DELETE /api/contact/:id → delete a message
   ═══════════════════════════════════════════════ */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const fileStore = require('../utils/fileStore');

// Try to load MongoDB model (may not be available)
let Contact;
try {
    Contact = require('../models/Contact');
} catch (e) {
    Contact = null;
}

const { sendNotificationEmail } = require('../utils/mailer');

/* ── Validation rules ────────────────────────── */
const contactValidation = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Name is required.')
        .isLength({ max: 100 })
        .withMessage('Name cannot exceed 100 characters.'),
    body('email')
        .trim()
        .notEmpty()
        .withMessage('Email is required.')
        .isEmail()
        .withMessage('Please enter a valid email address.')
        .normalizeEmail(),
    body('subject')
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage('Subject cannot exceed 200 characters.'),
    body('message')
        .trim()
        .notEmpty()
        .withMessage('Message is required.')
        .isLength({ min: 10 })
        .withMessage('Message must be at least 10 characters.')
        .isLength({ max: 5000 })
        .withMessage('Message cannot exceed 5000 characters.'),
];

/* ── Helper: check if MongoDB is active ──────── */
function useMongo(req) {
    return req.app.get('useMongoDb') && Contact;
}

/* ── POST /api/contact — Submit a message ────── */
router.post('/', contactValidation, async (req, res) => {
    try {
        // Check validation
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed.',
                errors: errors.array().map((e) => ({
                    field: e.path,
                    message: e.msg,
                })),
            });
        }

        const { name, email, subject, message } = req.body;
        let contact;

        if (useMongo(req)) {
            // Save to MongoDB
            contact = await Contact.create({
                name,
                email,
                subject: subject || 'No Subject',
                message,
                ip: req.ip || req.headers['x-forwarded-for'] || '',
            });
        } else {
            // Save to JSON file
            contact = fileStore.createContact({
                name,
                email,
                subject,
                message,
                ip: req.ip || req.headers['x-forwarded-for'] || '',
            });
        }

        console.log(`📩 New message from ${name} (${email})`);

        // Send notification email (non-blocking — don't fail if email fails)
        sendNotificationEmail({ name, email, subject, message }).catch((err) =>
            console.error('⚠️  Email failed:', err.message)
        );

        res.status(201).json({
            success: true,
            message: 'Message sent successfully! I will get back to you soon. 🚀',
            data: {
                id: contact._id,
                name: contact.name,
                createdAt: contact.createdAt,
            },
        });
    } catch (err) {
        console.error('❌ Contact save error:', err);
        res.status(500).json({
            success: false,
            message: 'Something went wrong. Please try again later.',
        });
    }
});

/* ── GET /api/contact — List all messages (admin) ── */
router.get('/', async (req, res) => {
    try {
        let contacts;
        if (useMongo(req)) {
            contacts = await Contact.find().sort({ createdAt: -1 }).select('-ip -__v');
        } else {
            contacts = fileStore.findAllContacts();
        }

        res.json({
            success: true,
            count: contacts.length,
            data: contacts,
        });
    } catch (err) {
        console.error('❌ Fetch contacts error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch contacts.',
        });
    }
});

/* ── GET /api/contact/:id — Single message ───── */
router.get('/:id', async (req, res) => {
    try {
        let contact;
        if (useMongo(req)) {
            contact = await Contact.findById(req.params.id).select('-ip -__v');
        } else {
            contact = fileStore.findContactById(req.params.id);
        }

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Message not found.',
            });
        }
        res.json({ success: true, data: contact });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch message.',
        });
    }
});

/* ── PATCH /api/contact/:id — Mark as read ───── */
router.patch('/:id', async (req, res) => {
    try {
        let contact;
        if (useMongo(req)) {
            contact = await Contact.findByIdAndUpdate(
                req.params.id,
                { isRead: true },
                { new: true }
            ).select('-ip -__v');
        } else {
            contact = fileStore.updateContact(req.params.id, { isRead: true });
        }

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Message not found.',
            });
        }
        res.json({ success: true, data: contact });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Failed to update message.',
        });
    }
});

/* ── DELETE /api/contact/all — Delete ALL messages ── */
router.delete('/all', async (req, res) => {
    try {
        if (useMongo(req)) {
            await Contact.deleteMany({});
        } else {
            fileStore.deleteAllContacts();
        }
        res.json({ success: true, message: 'All messages deleted.' });
    } catch (err) {
        console.error('❌ Delete all error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to delete messages.',
        });
    }
});

/* ── DELETE /api/contact/:id — Delete message ── */
router.delete('/:id', async (req, res) => {
    try {
        let contact;
        if (useMongo(req)) {
            contact = await Contact.findByIdAndDelete(req.params.id);
        } else {
            contact = fileStore.deleteContact(req.params.id);
        }

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Message not found.',
            });
        }
        res.json({ success: true, message: 'Message deleted.' });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Failed to delete message.',
        });
    }
});

module.exports = router;
