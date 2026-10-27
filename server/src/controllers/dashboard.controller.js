const Incident = require('../models/Incident');

// @desc    Get aggregate summary counts by category, status, and ward
// @route   GET /api/dashboard/summary
// @access  Public
const getSummary = async (req, res, next) => {
  try {
    const { days = 30 } = req.query;

    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - parseInt(days, 10));

    const [
      totalCount,
      resolvedCount,
      inProgressCount,
      byCategory,
      byStatus,
      byWard
    ] = await Promise.all([
      Incident.countDocuments({ createdAt: { $gte: sinceDate } }),
      Incident.countDocuments({ status: 'VerifiedResolved', createdAt: { $gte: sinceDate } }),
      Incident.countDocuments({
        status: { $in: ['InProgress', 'OfficialComplaintRecorded', 'RepairClaimed'] },
        createdAt: { $gte: sinceDate }
      }),
      Incident.aggregate([
        { $match: { createdAt: { $gte: sinceDate } } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Incident.aggregate([
        { $match: { createdAt: { $gte: sinceDate } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Incident.aggregate([
        { $match: { createdAt: { $gte: sinceDate } } },
        { $group: { _id: '$ward', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
    ]);

    const resolutionRate = totalCount > 0 ? ((resolvedCount / totalCount) * 100).toFixed(1) : 0;

    res.status(200).json({
      success: true,
      timeframeDays: parseInt(days, 10),
      metrics: {
        totalReports: totalCount,
        resolvedReports: resolvedCount,
        inProgressReports: inProgressCount,
        resolutionRatePercent: Number(resolutionRate)
      },
      breakdowns: {
        byCategory: byCategory.map((item) => ({ category: item._id, count: item.count })),
        byStatus: byStatus.map((item) => ({ status: item._id, count: item.count })),
        topWards: byWard.map((item) => ({ ward: item._id, count: item.count }))
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get recurring civic hotspots
// @route   GET /api/dashboard/recurring-hotspots
// @access  Public
const getRecurringHotspots = async (req, res, next) => {
  try {
    const { category, minReports = 2 } = req.query;

    const matchStage = {
      status: { $ne: 'Duplicate' }
    };
    if (category) {
      matchStage.category = category;
    }

    // Grouping by rounded coordinates (approx 100m grid) and ward
    const hotspots = await Incident.aggregate([
      { $match: matchStage },
      {
        $project: {
          category: 1,
          ward: 1,
          addressLabel: 1,
          title: 1,
          status: 1,
          roundedLng: { $round: [{ $arrayElemAt: ['$location.coordinates', 0] }, 3] },
          roundedLat: { $round: [{ $arrayElemAt: ['$location.coordinates', 1] }, 3] }
        }
      },
      {
        $group: {
          _id: {
            lng: '$roundedLng',
            lat: '$roundedLat',
            ward: '$ward',
            category: '$category'
          },
          reportCount: { $sum: 1 },
          sampleAddresses: { $addToSet: '$addressLabel' },
          sampleTitles: { $addToSet: '$title' },
          statuses: { $push: '$status' }
        }
      },
      {
        $match: {
          reportCount: { $gte: parseInt(minReports, 10) }
        }
      },
      {
        $sort: { reportCount: -1 }
      },
      {
        $limit: 20
      }
    ]);

    const formattedHotspots = hotspots.map((h) => ({
      coordinates: [h._id.lng, h._id.lat],
      ward: h._id.ward,
      category: h._id.category,
      reportCount: h.reportCount,
      addressSummary: h.sampleAddresses.slice(0, 3).join(', '),
      sampleIncidents: h.sampleTitles.slice(0, 3)
    }));

    res.status(200).json({
      success: true,
      count: formattedHotspots.length,
      data: formattedHotspots
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSummary,
  getRecurringHotspots
};
