const Incident = require('../models/Incident');

/**
 * Duplicate detection service
 * Finds existing incidents within maxDistance (default 100 meters)
 * having the same or similar category within a given time window (e.g. 60 days).
 */
const findPotentialDuplicates = async ({
  longitude,
  latitude,
  category,
  excludeId = null,
  maxDistanceMeters = 100,
  daysLookback = 60
}) => {
  const sinceDate = new Date();
  sinceDate.setDate(sinceDate.getDate() - daysLookback);

  const query = {
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [Number(longitude), Number(latitude)]
        },
        $maxDistance: Number(maxDistanceMeters)
      }
    },
    status: { $nin: ['VerifiedResolved', 'Duplicate'] },
    createdAt: { $gte: sinceDate }
  };

  if (category) {
    query.category = category;
  }

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  const matches = await Incident.find(query)
    .populate('reporterId', 'name')
    .populate('evidenceIds')
    .limit(10)
    .lean();

  return matches.map((match) => {
    const coords = match.location?.coordinates || [0, 0];
    const dist = calculateHaversineDistanceMeters(
      latitude,
      longitude,
      coords[1],
      coords[0]
    );

    return {
      ...match,
      distanceMeters: Math.round(dist),
      similarityReason: `Same category (${match.category}) within ${Math.round(dist)}m reported in last ${daysLookback} days`
    };
  });
};

/**
 * Haversine formula to compute distance between two coords in meters
 */
function calculateHaversineDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const toRad = (deg) => (deg * Math.PI) / 180;
  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const deltaPhi = toRad(lat2 - lat1);
  const deltaLambda = toRad(lon2 - lon1);

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

module.exports = {
  findPotentialDuplicates,
  calculateHaversineDistanceMeters
};
