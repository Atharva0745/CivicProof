/**
 * Mumbai Municipal Corporation (BMC) 24 Administrative Wards
 * Includes coordinates centroids, boundaries, and locality keywords.
 */

export const MUMBAI_WARDS_DATA = [
  {
    code: 'Ward A',
    label: 'Ward A (Colaba, Fort, Nariman Point)',
    center: [72.8315, 18.9242], // [lng, lat]
    bounds: { minLat: 18.89, maxLat: 18.94, minLng: 72.80, maxLng: 72.85 },
    keywords: ['colaba', 'fort', 'nariman point', 'cuffe parade', 'churchgate', 'ballard estate', 'marine drive south']
  },
  {
    code: 'Ward B',
    label: 'Ward B (Dongri, Masjid, Mandvi)',
    center: [72.8395, 18.9515],
    bounds: { minLat: 18.94, maxLat: 18.965, minLng: 72.83, maxLng: 72.855 },
    keywords: ['dongri', 'masjid', 'masjid bunder', 'mandvi', 'umerkhadi', 'bhendi bazaar', 'chinchbunder']
  },
  {
    code: 'Ward C',
    label: 'Ward C (Pydhonie, Chira Bazar, Marine Lines)',
    center: [72.8255, 18.9495],
    bounds: { minLat: 18.94, maxLat: 18.965, minLng: 72.815, maxLng: 72.835 },
    keywords: ['pydhonie', 'chira bazar', 'marine lines', 'kalbadevi', 'bhuleshwar', 'dhobi talao']
  },
  {
    code: 'Ward D',
    label: 'Ward D (Malabar Hill, Grant Road, Tardeo)',
    center: [72.8115, 18.9655],
    bounds: { minLat: 18.945, maxLat: 18.985, minLng: 72.79, maxLng: 72.825 },
    keywords: ['malabar hill', 'walkeshwar', 'tardeo', 'grant road', 'breach candy', 'cumballa hill', 'kemps corner', 'nana chowk', 'haji ali']
  },
  {
    code: 'Ward E',
    label: 'Ward E (Byculla, Mazgaon, Mumbai Central)',
    center: [72.8355, 18.9755],
    bounds: { minLat: 18.965, maxLat: 18.995, minLng: 72.82, maxLng: 72.86 },
    keywords: ['byculla', 'mazgaon', 'mumbai central', 'agripada', 'nagpada', 'chinchpokli', 'dockyard road', 'kamathipura']
  },
  {
    code: 'Ward F/South',
    label: 'Ward F/South (Parel, Sewri, Naigaon)',
    center: [72.8445, 18.9985],
    bounds: { minLat: 18.985, maxLat: 19.015, minLng: 72.825, maxLng: 72.865 },
    keywords: ['parel', 'sewri', 'naigaon', 'lalbaug', 'wadala south', 'cotton green', 'currey road']
  },
  {
    code: 'Ward F/North',
    label: 'Ward F/North (Matunga, Sion, Wadala)',
    center: [72.8585, 19.0345],
    bounds: { minLat: 19.015, maxLat: 19.055, minLng: 72.84, maxLng: 72.88 },
    keywords: ['matunga', 'sion', 'wadala', 'antop hill', 'hindu colony', 'gtb nagar', 'rawali camp']
  },
  {
    code: 'Ward G/South',
    label: 'Ward G/South (Worli, Prabhadevi, Lower Parel)',
    center: [72.8195, 19.0065],
    bounds: { minLat: 18.985, maxLat: 19.025, minLng: 72.81, maxLng: 72.835 },
    keywords: ['worli', 'prabhadevi', 'lower parel', 'mahalaxmi', 'currey road west', 'delisle road']
  },
  {
    code: 'Ward G/North',
    label: 'Ward G/North (Dadar, Dharavi, Mahim)',
    center: [72.8425, 19.0275],
    bounds: { minLat: 19.015, maxLat: 19.055, minLng: 72.825, maxLng: 72.86 },
    keywords: ['dadar', 'dharavi', 'mahim', 'senapati bapat', 'shivaji park', 'shahu nagar']
  },
  {
    code: 'Ward H/West',
    label: 'Ward H/West (Bandra West, Khar West)',
    center: [72.8335, 19.0625],
    bounds: { minLat: 19.045, maxLat: 19.095, minLng: 72.815, maxLng: 72.845 },
    keywords: ['bandra west', 'khar west', 'santacruz west', 'linking road', 'hill road', 'bandstand', 'carter road', 'pali hill']
  },
  {
    code: 'Ward H/East',
    label: 'Ward H/East (Bandra East, Santacruz East)',
    center: [72.8555, 19.0695],
    bounds: { minLat: 19.045, maxLat: 19.095, minLng: 72.845, maxLng: 72.875 },
    keywords: ['bandra east', 'santacruz east', 'khar east', 'bkc', 'kalina', 'vakola', 'kherwadi']
  },
  {
    code: 'Ward K/West',
    label: 'Ward K/West (Andheri West, Juhu, Versova)',
    center: [72.8295, 19.1245],
    bounds: { minLat: 19.095, maxLat: 19.155, minLng: 72.81, maxLng: 72.848 },
    keywords: ['andheri west', 'juhu', 'versova', 'lokhandwala', 'oshiwara', 'dn nagar', 'four bungalows', 'seven bungalows']
  },
  {
    code: 'Ward K/East',
    label: 'Ward K/East (Andheri East, Jogeshwari East)',
    center: [72.8645, 19.1235],
    bounds: { minLat: 19.095, maxLat: 19.155, minLng: 72.848, maxLng: 72.89 },
    keywords: ['andheri east', 'jogeshwari east', 'marol', 'chakala', 'sahar', 'seepz', 'midc andheri', 'mahakali']
  },
  {
    code: 'Ward L',
    label: 'Ward L (Kurla, Sakinaka, Chandivali)',
    center: [72.8845, 19.0785],
    bounds: { minLat: 19.055, maxLat: 19.115, minLng: 72.865, maxLng: 72.905 },
    keywords: ['kurla', 'sakinaka', 'chandivali', 'chunabhatti', 'asalpha', 'jarimari', 'nehru nagar']
  },
  {
    code: 'Ward M/West',
    label: 'Ward M/West (Chembur West, Tilak Nagar)',
    center: [72.8945, 19.0625],
    bounds: { minLat: 19.045, maxLat: 19.085, minLng: 72.875, maxLng: 72.915 },
    keywords: ['chembur', 'chembur west', 'tilak nagar', 'pestom sagar', 'sindhi society', 'subhash nagar']
  },
  {
    code: 'Ward M/East',
    label: 'Ward M/East (Govandi, Mankhurd, Chembur East)',
    center: [72.9255, 19.0555],
    bounds: { minLat: 19.025, maxLat: 19.085, minLng: 72.91, maxLng: 72.96 },
    keywords: ['govandi', 'mankhurd', 'chembur east', 'shivaji nagar', 'bainganwadi', 'trombay', 'deonar', 'cheetah camp']
  },
  {
    code: 'Ward N',
    label: 'Ward N (Ghatkopar, Vidyavihar)',
    center: [72.9095, 19.0895],
    bounds: { minLat: 19.075, maxLat: 19.115, minLng: 72.895, maxLng: 72.93 },
    keywords: ['ghatkopar', 'ghatkopar east', 'ghatkopar west', 'vidyavihar', 'pant nagar', 'garodia nagar']
  },
  {
    code: 'Ward S',
    label: 'Ward S (Bhandup, Powai, Vikhroli)',
    center: [72.9245, 19.1355],
    bounds: { minLat: 19.105, maxLat: 19.165, minLng: 72.885, maxLng: 72.945 },
    keywords: ['powai', 'bhandup', 'vikhroli', 'kanjurmarg', 'iit bombay', 'tagore nagar', 'hiranandani powai']
  },
  {
    code: 'Ward T',
    label: 'Ward T (Mulund, Nahur)',
    center: [72.9515, 19.1765],
    bounds: { minLat: 19.155, maxLat: 19.205, minLng: 72.925, maxLng: 72.97 },
    keywords: ['mulund', 'mulund east', 'mulund west', 'nahur', 'mithagar', 'sarvodaya nagar']
  },
  {
    code: 'Ward P/South',
    label: 'Ward P/South (Goregaon)',
    center: [72.8465, 19.1645],
    bounds: { minLat: 19.145, maxLat: 19.185, minLng: 72.815, maxLng: 72.875 },
    keywords: ['goregaon', 'goregaon east', 'goregaon west', 'bangur nagar', 'motilal nagar', 'aarey', 'film city', 'jawahar nagar']
  },
  {
    code: 'Ward P/North',
    label: 'Ward P/North (Malad, Marve, Madh)',
    center: [72.8395, 19.1925],
    bounds: { minLat: 19.175, maxLat: 19.22, minLng: 72.795, maxLng: 72.875 },
    keywords: ['malad', 'malad east', 'malad west', 'marve', 'madh', 'dindoshi', 'chincholi bunder', 'evershine nagar']
  },
  {
    code: 'Ward R/South',
    label: 'Ward R/South (Kandivali, Charkop)',
    center: [72.8415, 19.2145],
    bounds: { minLat: 19.20, maxLat: 19.235, minLng: 72.81, maxLng: 72.875 },
    keywords: ['kandivali', 'kandivali east', 'kandivali west', 'charkop', 'mahavir nagar', 'lokhandwala kandivali', 'samata nagar']
  },
  {
    code: 'Ward R/Central',
    label: 'Ward R/Central (Borivali, Gorai)',
    center: [72.8455, 19.2385],
    bounds: { minLat: 19.225, maxLat: 19.26, minLng: 72.795, maxLng: 72.875 },
    keywords: ['borivali', 'borivali east', 'borivali west', 'gorai', 'ic colony', 'eksar', 'shimpoli', 'magathane']
  },
  {
    code: 'Ward R/North',
    label: 'Ward R/North (Dahisar)',
    center: [72.8585, 19.2615],
    bounds: { minLat: 19.25, maxLat: 19.30, minLng: 72.825, maxLng: 72.89 },
    keywords: ['dahisar', 'dahisar east', 'dahisar west', 'rawalpada', 'ketkipada', 'anand nagar dahisar']
  }
];

/**
 * Identify closest BMC Ward based on GeoJSON coordinates [longitude, latitude]
 */
export function detectWardFromCoordinates(lng, lat) {
  if (!lng || !lat) return null;

  // 1. First test bounding boxes
  for (const ward of MUMBAI_WARDS_DATA) {
    const { minLat, maxLat, minLng, maxLng } = ward.bounds;
    if (lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng) {
      return ward;
    }
  }

  // 2. If just outside (e.g. boundary or reclamation), calculate Euclidean/Haversine distance to nearest ward centroid
  let closestWard = MUMBAI_WARDS_DATA[0];
  let minDistance = Infinity;

  for (const ward of MUMBAI_WARDS_DATA) {
    const [wLng, wLat] = ward.center;
    const dist = Math.hypot(lng - wLng, lat - wLat);
    if (dist < minDistance) {
      minDistance = dist;
      closestWard = ward;
    }
  }

  return closestWard;
}

/**
 * Free Reverse Geocode via OpenStreetMap Nominatim
 * Returns { addressLabel, ward }
 */
export async function reverseGeocodeAndDetectWard(lng, lat) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
      {
        headers: {
          'Accept-Language': 'en'
        }
      }
    );

    if (!response.ok) {
      throw new Error('Geocoding response not ok');
    }

    const data = await response.json();
    const addr = data.address || {};

    // Build human-friendly Mumbai address label
    const parts = [
      addr.road || addr.pedestrian || addr.suburb,
      addr.neighbourhood || addr.residential || addr.quarter,
      addr.suburb || addr.city_district || addr.city || 'Mumbai',
      addr.postcode
    ].filter(Boolean);

    const addressLabel = parts.length > 0 ? parts.join(', ') : data.display_name?.split(',').slice(0, 3).join(',');

    // Match keywords from Nominatim address fields
    const searchText = `${data.display_name} ${addr.suburb || ''} ${addr.neighbourhood || ''} ${addr.city_district || ''}`.toLowerCase();

    for (const ward of MUMBAI_WARDS_DATA) {
      for (const kw of ward.keywords) {
        if (searchText.includes(kw)) {
          return {
            addressLabel: addressLabel || 'Mumbai',
            ward: ward,
            detectedVia: 'locality_match'
          };
        }
      }
    }

    // Fall back to coordinate bounding polygon
    const coordWard = detectWardFromCoordinates(lng, lat);
    return {
      addressLabel: addressLabel || 'Mumbai',
      ward: coordWard,
      detectedVia: 'coordinates'
    };
  } catch (error) {
    console.warn('[Geocoding] Reverse geocoding failed or rate limited, using coordinate centroids:', error.message);
    const coordWard = detectWardFromCoordinates(lng, lat);
    return {
      addressLabel: '',
      ward: coordWard,
      detectedVia: 'coordinates_fallback'
    };
  }
}
