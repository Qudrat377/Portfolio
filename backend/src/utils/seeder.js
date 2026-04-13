// require('dotenv').config();
// const mongoose = require('mongoose');
// // const User = require('../src/models/User');
// const Group = require('../src/models/Group');
// const Vocabulary = require('../src/models/Vocabulary');
// const logger = require('../src/utils/logger');
// const User = require('../models/User');

require('dotenv').config();
const mongoose = require('mongoose');

// XATOLAR TUZATILGAN QISMI:
const User = require('../models/User');        // To'g'ri
const Group = require('../models/Group');      // To'g'ri (../src/models edi)
const Vocabulary = require('../models/Vocabulary'); // To'g'ri (../src/models edi)
const logger = require('./logger');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info('Connected to MongoDB for seeding...');

    // Clean existing seed data
    await User.deleteMany({ phone: { $in: ['+998901000001', '+998901000002', '+998901000003', '+998901000004', '+998901000005'] } });
    await Group.deleteMany({ name: 'Demo Group A1' });

    // ── Create Admin ──────────────────────────────────────────────────────────
    const admin = await User.create({
      firstName: 'Super',
      lastName: 'Admin',
      phone: '+998901000001',
      email: 'admin@englishcenter.uz',
      password: 'Admin@12345',
      role: 'ADMIN',
    });

    // ── Create Manager ────────────────────────────────────────────────────────
    const manager = await User.create({
      firstName: 'Aziz',
      lastName: 'Karimov',
      phone: '+998901000002',
      email: 'manager@englishcenter.uz',
      password: 'Manager@123',
      role: 'MANAGER',
      createdBy: admin._id,
    });

    // ── Create Teacher ────────────────────────────────────────────────────────
    const teacher = await User.create({
      firstName: 'Dilnoza',
      lastName: 'Yusupova',
      phone: '+998901000003',
      email: 'teacher@englishcenter.uz',
      password: 'Teacher@123',
      role: 'TEACHER',
      createdBy: admin._id,
    });

    // ── Create Assistant ──────────────────────────────────────────────────────
    const assistant = await User.create({
      firstName: 'Bobur',
      lastName: 'Toshmatov',
      phone: '+998901000004',
      email: 'assistant@englishcenter.uz',
      password: 'Assistant@123',
      role: 'ASSISTANT',
      createdBy: teacher._id,
    });

    // ── Create Student ────────────────────────────────────────────────────────
    const student = await User.create({
      firstName: 'Kamola',
      lastName: 'Rahimova',
      phone: '+998901000005',
      email: 'student@englishcenter.uz',
      password: 'Student@123',
      role: 'STUDENT',
      createdBy: teacher._id,
    });

    // ── Create Group ──────────────────────────────────────────────────────────
    const group = await Group.create({
      name: 'Demo Group A1',
      description: 'Beginner English group for demo purposes',
      teacher: teacher._id,
      assistant: assistant._id,
      students: [student._id],
      level: 'BEGINNER',
      startDate: new Date(),
      endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      schedule: {
        days: ['MONDAY', 'WEDNESDAY', 'FRIDAY'],
        startTime: '09:00',
        endTime: '10:30',
        room: 'Room 101',
      },
      createdBy: admin._id,
      maxStudents: 15,
    });

    // Update student's groups
    student.groups = [group._id];
    await student.save();

    // ── Create Vocabulary ─────────────────────────────────────────────────────
    const vocab = await Vocabulary.create({
      title: 'Unit 1 - Greetings',
      group: group._id,
      createdBy: teacher._id,
      items: [
        { word: 'Hello', language: 'EN', translation: 'Salom', autoTranslation: 'Salom' },
        { word: 'Goodbye', language: 'EN', translation: "Xayr", autoTranslation: "Xayr" },
        { word: 'Thank you', language: 'EN', translation: 'Rahmat', autoTranslation: 'Rahmat' },
        { word: 'Please', language: 'EN', translation: 'Iltimos', autoTranslation: 'Iltimos' },
        { word: 'Sorry', language: 'EN', translation: 'Kechirasiz', autoTranslation: 'Kechirasiz' },
      ],
    });

    logger.info('✅ Seed completed successfully!\n');
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.info('👤 ADMIN     | +998901000001 | Admin@12345');
    logger.info('👤 MANAGER   | +998901000002 | Manager@123');
    logger.info('👤 TEACHER   | +998901000003 | Teacher@123');
    logger.info('👤 ASSISTANT | +998901000004 | Assistant@123');
    logger.info('👤 STUDENT   | +998901000005 | Student@123');
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.info(`🏫 Group: "${group.name}" (ID: ${group._id})`);
    logger.info(`📚 Vocabulary: "${vocab.title}" (ID: ${vocab._id})`);

    process.exit(0);
  } catch (err) {
    logger.error('Seeding failed:', err);
    process.exit(1);
  }
};

seed();
