require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');
const Incident = require('../models/Incident');
const Evidence = require('../models/Evidence');
const OfficialComplaint = require('../models/OfficialComplaint');
const AuditEvent = require('../models/AuditEvent');

const seedData = async () => {
  try {
    await connectDB();
    console.log('[Seeder] Connected to database. Clearing existing collections...');

    await Promise.all([
      User.deleteMany({}),
      Incident.deleteMany({}),
      Evidence.deleteMany({}),
      OfficialComplaint.deleteMany({}),
      AuditEvent.deleteMany({})
    ]);

    console.log('[Seeder] Creating demo users...');
    const citizen = await User.create({
      name: 'Rohan Sharma',
      email: 'rohan@example.com',
      passwordHash: 'password123',
      role: 'citizen'
    });

    const moderator = await User.create({
      name: 'Pooja Iyer (Moderator)',
      email: 'pooja.mod@civicproof.org',
      passwordHash: 'modpass123',
      role: 'moderator'
    });

    const admin = await User.create({
      name: 'Civic Administrator',
      email: 'admin@civicproof.org',
      passwordHash: 'adminpass123',
      role: 'admin'
    });

    console.log('[Seeder] Creating realistic Mumbai municipal incidents...');

    // 1. Pothole in Bandra West (Ward H/West)
    const incident1 = await Incident.create({
      title: 'Deep crater pothole on Linking Road near Waterfield junction',
      description: 'Dangerous pothole measuring approx 2 feet wide and 6 inches deep causing vehicular bottleneck and bike skidding.',
      category: 'pothole',
      location: {
        type: 'Point',
        coordinates: [72.8335, 19.0596] // Linking Road, Bandra West [lng, lat]
      },
      addressLabel: 'Near KFC Junction, Linking Road, Bandra West, Mumbai 400050',
      ward: 'Ward H/West',
      status: 'OfficialComplaintRecorded',
      reporterId: citizen._id,
      visibility: 'public'
    });

    const evidence1 = await Evidence.create({
      incidentId: incident1._id,
      uploadedBy: citizen._id,
      kind: 'before_photo',
      storageKey: 'seed_pothole_bandra.jpg',
      publicUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800',
      contentHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      caption: 'Photograph of hazardous pothole during morning traffic peak',
      reviewStatus: 'accepted'
    });

    const complaint1 = await OfficialComplaint.create({
      incidentId: incident1._id,
      authority: 'BMC',
      officialReference: 'BMC-2026-HW-99824',
      submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      officialChannelUrl: 'https://portal.mcgm.gov.in/',
      statusReportedByUser: 'Assigned to Assistant Engineer (Roads) Ward H/West',
      lastCheckedByUserAt: new Date(),
      notes: 'Logged complaint on 1916 and recorded token number on BMC portal.',
      createdBy: citizen._id
    });

    incident1.evidenceIds = [evidence1._id];
    incident1.officialComplaintId = complaint1._id;
    await incident1.save();

    await AuditEvent.create({
      incidentId: incident1._id,
      actorId: citizen._id,
      action: 'INCIDENT_CREATED',
      newValue: { title: incident1.title, status: 'Submitted' },
      note: 'Report filed by resident'
    });

    await AuditEvent.create({
      incidentId: incident1._id,
      actorId: citizen._id,
      action: 'OFFICIAL_COMPLAINT_RECORDED',
      newValue: { officialReference: complaint1.officialReference, status: 'OfficialComplaintRecorded' },
      note: 'User recorded BMC reference BMC-2026-HW-99824'
    });

    // 2. Garbage overflow in Dadar West (Ward G/North)
    const incident2 = await Incident.create({
      title: 'Uncollected community garbage dump overflowing on Senapati Bapat Marg',
      description: 'Solid waste accumulating across sidewalk for past 4 days emitting stench and attracting stray animals.',
      category: 'garbage',
      location: {
        type: 'Point',
        coordinates: [72.8428, 19.0178] // Dadar West [lng, lat]
      },
      addressLabel: 'Opposite Railway Colony, Senapati Bapat Marg, Dadar West, Mumbai 400028',
      ward: 'Ward G/North',
      status: 'RepairClaimed',
      reporterId: citizen._id,
      visibility: 'public'
    });

    const evidence2 = await Evidence.create({
      incidentId: incident2._id,
      uploadedBy: citizen._id,
      kind: 'before_photo',
      storageKey: 'seed_garbage_dadar.jpg',
      publicUrl: 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=800',
      contentHash: 'f4b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852a123',
      caption: 'Garbage bins overflowing on pavement',
      reviewStatus: 'accepted'
    });

    incident2.evidenceIds = [evidence2._id];
    incident2.repairClaimDetails = {
      claimedBy: moderator._id,
      claimedAt: new Date(),
      note: 'Municipal dumper cleared spot. Community review requested.'
    };
    await incident2.save();

    // 3. Drainage overflow in Andheri East (Ward K/East)
    const incident3 = await Incident.create({
      title: 'Clogged storm drain causing foul water stagnation near Chakala Metro',
      description: 'Drainage water overflowing across road during high tide / rainfall, creating severe health hazard.',
      category: 'drainage',
      location: {
        type: 'Point',
        coordinates: [72.8617, 19.1114] // Andheri East [lng, lat]
      },
      addressLabel: 'Andheri-Kurla Road, Near Chakala Metro Station, Andheri East, Mumbai 400093',
      ward: 'Ward K/East',
      status: 'InProgress',
      reporterId: citizen._id,
      visibility: 'public'
    });

    // 4. Broken Streetlight in Colaba (Ward A)
    const incident4 = await Incident.create({
      title: 'Non-functional streetlights along SBS Road stretch near Regal Cinema',
      description: 'Consecutive streetlamps pitch dark for 2 weeks posing pedestrian safety hazard at night.',
      category: 'streetlight',
      location: {
        type: 'Point',
        coordinates: [72.8315, 18.9242] // Colaba [lng, lat]
      },
      addressLabel: 'Shahid Bhagat Singh Road, Colaba Causeway, Mumbai 400001',
      ward: 'Ward A',
      status: 'VerifiedResolved',
      reporterId: citizen._id,
      visibility: 'public'
    });

    console.log('[Seeder] Database seeding complete!');
    console.log('Sample Accounts:');
    console.log('  Citizen:   rohan@example.com / password123');
    console.log('  Moderator: pooja.mod@civicproof.org / modpass123');
    console.log('  Admin:     admin@civicproof.org / adminpass123');

    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error('[Seeder] Seeding error:', error);
    process.exit(1);
  }
};

seedData();
