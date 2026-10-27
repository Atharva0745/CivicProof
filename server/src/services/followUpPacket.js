const crypto = require('crypto');
const FollowUpPacket = require('../models/FollowUpPacket');
const AuditEvent = require('../models/AuditEvent');

/**
 * Service to generate structured, neutral follow-up / escalation packets
 * for submission through official BMC / Maharashtra Grievance portals.
 */
const generateFollowUpPacket = async ({ incident, officialComplaint, user }) => {
  const packetId = `CP-ESC-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

  // Gather audit timeline
  const auditTrail = await AuditEvent.find({ incidentId: incident._id })
    .sort({ createdAt: 1 })
    .lean();

  const formattedDates = {
    reported: new Date(incident.createdAt).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }),
    current: new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  };

  const officialRef = officialComplaint?.officialReference || 'Pending / User Recorded Reference';
  const authority = officialComplaint?.authority || 'Brihanmumbai Municipal Corporation (BMC)';

  // Draft neutral letter
  const subject = `Follow-up Regarding Unresolved Civic Grievance: ${incident.category.toUpperCase()} at ${incident.ward}, Mumbai (Ref: ${officialRef})`;

  const neutralDraftText = `To,
The Ward Officer / Grievance Redressal Cell,
${authority} (${incident.ward}),
Mumbai, Maharashtra.

Subject: ${subject}

Respected Sir/Madam,

I am writing to respectfully draw your urgent attention to an ongoing municipal issue that was previously reported on ${formattedDates.reported} and remains pending resolution on-ground.

1. Issue Details:
   - Category: ${incident.category}
   - Location / Landmark: ${incident.addressLabel}
   - BMC Ward: ${incident.ward}
   - CivicProof Incident Tracking ID: ${incident._id}
   - Official Grievance Token/Reference: ${officialRef}
   - Current Status: ${incident.status}

2. Chronology & Observation:
   - Initial Grievance Summary: "${incident.description}"
   ${
     officialComplaint?.statusReportedByUser
       ? `- User Recorded Status on Portal: "${officialComplaint.statusReportedByUser}" (Checked: ${new Date(officialComplaint.lastCheckedByUserAt || officialComplaint.updatedAt).toLocaleDateString('en-IN')})`
       : ''
   }
   ${
     incident.status === 'Disputed'
       ? '- Note: A previous resolution was marked, but on-ground inspection confirmed the repair is incomplete or defective.'
       : ''
   }

3. Evidence Submitted:
   Evidence photographs and visual records verifying the persisting condition at the site have been cataloged with verified timestamps and cryptographic hashes.

4. Action Requested:
   Considering the public safety, hygiene, and inconvenience to local residents and commuters in Ward ${incident.ward}, we request the concerned municipal department to inspect the site and expedite appropriate remedial action.

Thank you for your service and prompt intervention.

Yours sincerely,
A Concerned Resident / Civic Citizen
(Generated via CivicProof Follow-up Dossier on ${formattedDates.current})
`;

  // Compile evidence list
  const evidenceList = (incident.evidenceIds || []).map((ev) => ({
    kind: ev.kind || 'photo',
    url: ev.publicUrl,
    uploadedAt: ev.uploadedAt || ev.createdAt,
    caption: ev.caption || ''
  }));

  const officialChannelLinks = [
    {
      name: 'BMC Citizen Portal (MCGM)',
      url: 'https://portal.mcgm.gov.in/',
      description: 'Official BMC grievance tracking and submission portal'
    },
    {
      name: 'BMC MARG Grievance Portal',
      url: 'https://marg.mcgm.gov.in/MARG/welcomePage.html',
      description: 'Pothole and road repair tracking portal'
    },
    {
      name: 'Maharashtra State Grievance Portal (Aaple Sarkar)',
      url: 'https://grievances.maharashtra.gov.in/en',
      description: 'State government grievance redressal platform'
    },
    {
      name: 'BMC Civic Helpline',
      url: 'tel:1916',
      description: 'Official 24x7 BMC centralized helpline: 1916'
    }
  ];

  const packet = await FollowUpPacket.create({
    packetId,
    incidentId: incident._id,
    generatedBy: user._id,
    authority,
    officialReference: officialRef,
    subject,
    neutralDraftText,
    incidentSnapshot: {
      title: incident.title,
      category: incident.category,
      addressLabel: incident.addressLabel,
      ward: incident.ward,
      coordinates: incident.location?.coordinates,
      reportedAt: incident.createdAt,
      currentStatus: incident.status
    },
    evidenceList,
    officialChannelLinks
  });

  return packet;
};

module.exports = {
  generateFollowUpPacket
};
