/**
 * Request validation helpers
 */
const validateCoordinates = (coordinates) => {
  if (!Array.isArray(coordinates) || coordinates.length !== 2) {
    return 'Coordinates must be an array of [longitude, latitude]';
  }
  const [lng, lat] = coordinates;
  if (typeof lng !== 'number' || lng < -180 || lng > 180) {
    return 'Longitude must be a number between -180 and 180';
  }
  if (typeof lat !== 'number' || lat < -90 || lat > 90) {
    return 'Latitude must be a number between -90 and 90';
  }
  return null;
};

const validateIncidentInput = (req, res, next) => {
  const { title, description, category, coordinates, addressLabel, ward } = req.body;

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return res.status(400).json({ success: false, message: 'Incident title is required' });
  }

  if (!description || typeof description !== 'string' || description.trim().length === 0) {
    return res.status(400).json({ success: false, message: 'Detailed description is required' });
  }

  const validCategories = ['pothole', 'garbage', 'drainage', 'streetlight', 'other'];
  if (!category || !validCategories.includes(category)) {
    return res.status(400).json({
      success: false,
      message: `Category must be one of: ${validCategories.join(', ')}`
    });
  }

  if (!coordinates) {
    return res.status(400).json({
      success: false,
      message: 'GeoJSON coordinates [longitude, latitude] are required'
    });
  }

  // Parse if string (from form-data)
  let parsedCoords = coordinates;
  if (typeof coordinates === 'string') {
    try {
      parsedCoords = JSON.parse(coordinates);
    } catch {
      return res.status(400).json({
        success: false,
        message: 'Coordinates must be a valid JSON array [longitude, latitude]'
      });
    }
  }

  const coordError = validateCoordinates(parsedCoords);
  if (coordError) {
    return res.status(400).json({ success: false, message: coordError });
  }

  req.body.parsedCoordinates = parsedCoords;

  if (!addressLabel || typeof addressLabel !== 'string' || addressLabel.trim().length === 0) {
    return res.status(400).json({ success: false, message: 'Address or landmark label is required' });
  }

  if (!ward || typeof ward !== 'string' || ward.trim().length === 0) {
    return res.status(400).json({ success: false, message: 'Mumbai ward is required (e.g. Ward A, Ward G/North)' });
  }

  next();
};

module.exports = {
  validateCoordinates,
  validateIncidentInput
};
