/* ═══════════════════════════════════════════════
   FILE STORE — JSON file-based storage
   ═══════════════════════════════════════════════
   Simple alternative to MongoDB. Stores contact
   messages in a local JSON file. No setup needed!
   ═══════════════════════════════════════════════ */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_FILE = path.join(__dirname, '..', 'data', 'contacts.json');

// Ensure data directory exists
function ensureDir() {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
        fs.writeFileSync(DATA_FILE, '[]', 'utf-8');
    }
}

// Read all contacts
function readContacts() {
    ensureDir();
    try {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        return JSON.parse(raw);
    } catch {
        return [];
    }
}

// Write all contacts
function writeContacts(contacts) {
    ensureDir();
    fs.writeFileSync(DATA_FILE, JSON.stringify(contacts, null, 2), 'utf-8');
}

// Create a new contact
function createContact({ name, email, subject, message, ip }) {
    const contacts = readContacts();
    const newContact = {
        _id: crypto.randomUUID(),
        name,
        email,
        subject: subject || 'No Subject',
        message,
        ip: ip || '',
        isRead: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    contacts.unshift(newContact); // newest first
    writeContacts(contacts);
    return newContact;
}

// Get all contacts
function findAllContacts() {
    return readContacts();
}

// Find contact by ID
function findContactById(id) {
    const contacts = readContacts();
    return contacts.find((c) => c._id === id) || null;
}

// Update contact (mark as read)
function updateContact(id, updates) {
    const contacts = readContacts();
    const index = contacts.findIndex((c) => c._id === id);
    if (index === -1) return null;
    contacts[index] = { ...contacts[index], ...updates, updatedAt: new Date().toISOString() };
    writeContacts(contacts);
    return contacts[index];
}

// Delete contact
function deleteContact(id) {
    const contacts = readContacts();
    const index = contacts.findIndex((c) => c._id === id);
    if (index === -1) return null;
    const deleted = contacts.splice(index, 1)[0];
    writeContacts(contacts);
    return deleted;
}

// Delete ALL contacts
function deleteAllContacts() {
    writeContacts([]);
}

module.exports = {
    createContact,
    findAllContacts,
    findContactById,
    updateContact,
    deleteContact,
    deleteAllContacts,
};
