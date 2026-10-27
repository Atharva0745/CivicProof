import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/api';
import { useAuth } from '../context/AuthContext';
import MapPicker from '../components/MapPicker';
import {
  AlertTriangle,
  Trash2,
  Droplets,
  Lightbulb,
  HelpCircle,
  Upload,
  Camera,
  X,
  Check,
  ChevronRight,
  ArrowLeft,
  ShieldCheck,
  Info,
  ExternalLink,
  CheckCircle2,
  Sparkles,
  Loader2
} from 'lucide-react';
import { detectWardFromCoordinates, reverseGeocodeAndDetectWard } from '../utils/mumbaiWards';

const categories = [
  {
    id: 'pothole',
    name: 'Pothole / Road damage',
    desc: 'Deep crater, asphalt sinkhole, broken pavers',
    icon: AlertTriangle,
    templates: [
      'Deep pothole causing vehicular congestion and skidding hazard',
      'Sunken trench across roadway following pipeline excavation'
    ]
  },
  {
    id: 'garbage',
    name: 'Garbage dump / Waste',
    desc: 'Uncollected refuse, overflowing municipal bin',
    icon: Trash2,
    templates: [
      'Community bins overflowing onto sidewalk for multiple days',
      'Illegal debris dumping along roadside causing foul odor'
    ]
  },
  {
    id: 'drainage',
    name: 'Drainage / Waterlogging',
    desc: 'Clogged storm drain, open manhole, sewage leak',
    icon: Droplets,
    templates: [
      'Stormwater drain blocked causing road water stagnation',
      'Damaged or missing manhole cover posing pedestrian hazard'
    ]
  },
  {
    id: 'streetlight',
    name: 'Broken streetlight',
    desc: 'Dark street, flickering lamp, dangling wires',
    icon: Lightbulb,
    templates: [
      'Consecutive streetlamps non-operational, dark pedestrian stretch',
      'Streetlight pole damaged with exposed wiring'
    ]
  },
  {
    id: 'other',
    name: 'Other civic issue',
    desc: 'Fallen tree branches, broken pavement, footpath block',
    icon: HelpCircle,
    templates: [
      'Broken concrete pavement slabs obstructing senior citizens',
      'Unbarricaded construction trench on municipal road'
    ]
  }
];

const mumbaiWards = [
  'Ward A (Colaba, Fort, Nariman Point)',
  'Ward B (Dongri, Masjid, Mandvi)',
  'Ward C (Pydhonie, Chira Bazar, Marine Lines)',
  'Ward D (Malabar Hill, Grant Road, Tardeo)',
  'Ward E (Byculla, Mazgaon, Mumbai Central)',
  'Ward F/North (Matunga, Sion, Wadala)',
  'Ward F/South (Parel, Sewri, Naigaon)',
  'Ward G/North (Dadar, Dharavi, Mahim)',
  'Ward G/South (Worli, Prabhadevi, Lower Parel)',
  'Ward H/East (Bandra East, Santacruz East)',
  'Ward H/West (Bandra West, Khar West)',
  'Ward K/East (Andheri East, Jogeshwari East)',
  'Ward K/West (Andheri West, Juhu, Versova)',
  'Ward L (Kurla, Sakinaka, Chandivali)',
  'Ward M/East (Govandi, Mankhurd, Chembur East)',
  'Ward M/West (Chembur West, Tilak Nagar)',
  'Ward N (Ghatkopar, Vidyavihar)',
  'Ward P/North (Malad, Marve, Madh)',
  'Ward P/South (Goregaon)',
  'Ward R/Central (Borivali, Gorai)',
  'Ward R/North (Dahisar)',
  'Ward R/South (Kandivali, Charkop)',
  'Ward S (Bhandup, Powai, Vikhroli)',
  'Ward T (Mulund, Nahur)'
];

export default function ReportIssue() {
  const { user, openAuthModal } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [category, setCategory] = useState('pothole');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coordinates, setCoordinates] = useState([72.8425, 19.0175]); // Dadar center
  const [addressLabel, setAddressLabel] = useState('');
  const [ward, setWard] = useState('Ward G/North (Dadar, Dharavi, Mahim)');
  const [autoDetectedInfo, setAutoDetectedInfo] = useState({
    wardCode: 'Ward G/North',
    label: 'Ward G/North (Dadar, Dharavi, Mahim)',
    isAuto: true
  });
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [lastAutoAddress, setLastAutoAddress] = useState('');
  const geocodeTimerRef = useRef(null);

  const handleCoordinatesChange = (newCoords) => {
    setCoordinates(newCoords);
    const [lng, lat] = newCoords;

    // 1. Instant offline centroid / boundary determination
    const matchedWard = detectWardFromCoordinates(lng, lat);
    if (matchedWard) {
      setWard(matchedWard.label);
      setAutoDetectedInfo({
        wardCode: matchedWard.code,
        label: matchedWard.label,
        isAuto: true
      });
    }

    // 2. Debounced reverse geocoding via OpenStreetMap Nominatim
    if (geocodeTimerRef.current) {
      clearTimeout(geocodeTimerRef.current);
    }

    setIsGeocoding(true);
    geocodeTimerRef.current = setTimeout(async () => {
      try {
        const geoResult = await reverseGeocodeAndDetectWard(lng, lat);
        if (geoResult.addressLabel) {
          setAddressLabel((prev) => {
            if (!prev || prev === lastAutoAddress) {
              setLastAutoAddress(geoResult.addressLabel);
              return geoResult.addressLabel;
            }
            return prev;
          });
        }
        if (geoResult.ward) {
          setWard(geoResult.ward.label);
          setAutoDetectedInfo({
            wardCode: geoResult.ward.code,
            label: geoResult.ward.label,
            isAuto: true
          });
        }
      } catch (err) {
        console.warn('Geocoding error:', err);
      } finally {
        setIsGeocoding(false);
      }
    }, 500);
  };
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submissionResult, setSubmissionResult] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('Photo size exceeds 10MB limit.');
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreviewUrl('');
  };

  const applyTemplate = (text) => {
    setTitle(text);
    if (!description) {
      setDescription(`Observed ${text.toLowerCase()} causing ongoing public inconvenience and traffic hindrance.`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      openAuthModal('login');
      return;
    }

    if (!consent) {
      setError('Please acknowledge the verification and privacy notice before submitting.');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('category', category);
      formData.append('coordinates', JSON.stringify(coordinates));
      formData.append('addressLabel', addressLabel);
      // Clean ward string e.g. "Ward G/North"
      const cleanWard = ward.split('(')[0].trim();
      formData.append('ward', cleanWard);
      formData.append('visibility', visibility);

      if (selectedFile) {
        formData.append('photo', selectedFile);
        formData.append('caption', caption || 'Initial report evidence photograph');
      }

      const res = await api.createIncident(formData);
      if (res.success && res.data) {
        setSubmissionResult(res);
      }
    } catch (err) {
      setError(err.message || 'Failed to submit report. Please check required fields.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submissionResult) {
    const inc = submissionResult.data;
    const warnings = submissionResult.duplicateWarnings || [];

    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-surface rounded-3xl border border-line p-8 shadow-floating text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-success-bg text-success-ink mx-auto flex items-center justify-center border border-success-ink/20">
            <Check className="w-8 h-8 stroke-[2.5]" />
          </div>

          <div>
            <span className="text-xs uppercase font-bold tracking-wider text-muted">
              Report Saved in CivicProof
            </span>
            <h2 className="text-2xl font-bold text-ink mt-1">Incident Record Created</h2>
            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-canvas font-mono text-xs font-semibold text-primary border border-line">
              <span>Incident ID: {inc._id}</span>
            </div>
          </div>

          {/* Duplicate Notice if found nearby */}
          {warnings.length > 0 && (
            <div className="text-left p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1.5">
              <div className="font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-700" />
                <span>Possible Duplicate Reports Nearby</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                We detected {warnings.length} existing {inc.category} report(s) within 100 meters. A moderator will review whether to merge them while preserving your evidence.
              </p>
            </div>
          )}

          {/* Next Steps: Official Submission */}
          <div className="text-left p-5 rounded-2xl border border-line bg-canvas space-y-3">
            <h4 className="text-sm font-semibold text-ink flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span>Next Step: Official BMC Submission</span>
            </h4>
            <p className="text-xs text-muted leading-relaxed">
              CivicProof is an independent evidence repository. To ensure municipal repair, please file a complaint on the official portal and then save your official reference token in this app.
            </p>
            <div className="flex flex-wrap gap-3 pt-1 text-xs">
              <a
                href="https://portal.mcgm.gov.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-info hover:underline font-semibold"
              >
                <span>BMC Citizen Portal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <a
                href="https://marg.mcgm.gov.in/MARG/welcomePage.html"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-info hover:underline font-semibold"
              >
                <span>MARG Pothole Portal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <span className="text-ink">Helpline: <strong>1916</strong></span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => navigate(`/incidents/${inc._id}`)}
              className="w-full sm:w-auto h-11 px-6 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold transition"
            >
              View incident details & link token →
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full sm:w-auto h-11 px-6 rounded-xl border border-line bg-surface text-xs font-semibold text-ink hover:bg-canvas transition"
            >
              Return to explore map
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Wizard Progress Header */}
      <div className="mb-6">
        <span className="text-xs font-bold tracking-wider uppercase text-primary block mb-1">
          Civic Accountability · Step {step} of 3
        </span>
        <h1 className="text-2xl font-bold text-ink tracking-tight">Report a Local Civic Issue</h1>
        <p className="text-xs text-muted mt-1">
          Document municipal defects with clear photographic evidence and verified timestamps.
        </p>

        {/* 3 Step Pill Indicator */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <div
            className={`h-1.5 rounded-full transition ${
              step >= 1 ? 'bg-primary' : 'bg-line'
            }`}
          />
          <div
            className={`h-1.5 rounded-full transition ${
              step >= 2 ? 'bg-primary' : 'bg-line'
            }`}
          />
          <div
            className={`h-1.5 rounded-full transition ${
              step >= 3 ? 'bg-primary' : 'bg-line'
            }`}
          />
        </div>
      </div>

      <div className="bg-surface rounded-2xl border border-line p-6 md:p-8 shadow-xs">
        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-danger-bg text-danger-ink border border-danger-ink/20 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: What happened? */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-ink mb-2">
                1. Select Issue Category
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {categories.map((c) => {
                  const Icon = c.icon;
                  const isChosen = category === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCategory(c.id)}
                      className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition cursor-pointer ${
                        isChosen
                          ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                          : 'border-line hover:border-muted/50 bg-canvas/40'
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                          isChosen ? 'bg-primary text-white' : 'bg-surface text-muted border border-line'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="block text-xs font-semibold text-ink">{c.name}</span>
                        <span className="block text-[11px] text-muted leading-tight mt-0.5">
                          {c.desc}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Templates */}
            <div>
              <span className="text-[11px] font-semibold text-muted block mb-2">
                Quick description suggestions:
              </span>
              <div className="flex flex-wrap gap-2">
                {categories
                  .find((c) => c.id === category)
                  ?.templates.map((tpl, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => applyTemplate(tpl)}
                      className="px-2.5 py-1 rounded-lg bg-canvas border border-line text-[11px] text-ink hover:border-primary transition text-left"
                    >
                      + {tpl}
                    </button>
                  ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">
                Issue Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Deep crater on Linking Road near Waterfield junction"
                className="w-full h-11 px-3.5 text-sm rounded-xl border border-line bg-surface text-ink outline-none focus:border-primary focus:ring-3 focus:ring-primary/10 transition"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">
                Detailed Observation & Ground Impact *
              </label>
              <textarea
                rows="4"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe size, depth, duration, and safety or pedestrian hazard..."
                className="w-full p-3 text-sm rounded-xl border border-line bg-surface text-ink outline-none focus:border-primary focus:ring-3 focus:ring-primary/10 transition"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  if (!title.trim() || !description.trim()) {
                    setError('Please provide an issue title and detailed description.');
                    return;
                  }
                  setError('');
                  setStep(2);
                }}
                className="inline-flex items-center gap-1.5 h-11 px-6 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold transition"
              >
                <span>Continue to Location & Photo</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Where and Evidence */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-ink">
                  2. Pinpoint Precise Location on Map
                </label>
                <span className="text-[11px] text-muted">
                  Drag the pin or click on your area
                </span>
              </div>
              <MapPicker coordinates={coordinates} onChange={handleCoordinatesChange} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-ink">
                    Address / Landmark Label *
                  </label>
                  {isGeocoding && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-primary font-medium">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Detecting street...</span>
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  required
                  value={addressLabel}
                  onChange={(e) => setAddressLabel(e.target.value)}
                  placeholder="e.g. Near Dadar Station Western Exit, Senapati Bapat Marg"
                  className="w-full h-11 px-3.5 text-sm rounded-xl border border-line bg-surface text-ink outline-none focus:border-primary focus:ring-3 focus:ring-primary/10 transition"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-ink">
                    Mumbai Ward *
                  </label>
                  {autoDetectedInfo?.isAuto && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-success-ink bg-success-bg border border-[#BCE8D1] px-2 py-0.5 rounded-md">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Auto-detected: {autoDetectedInfo.wardCode}</span>
                    </span>
                  )}
                </div>
                <select
                  value={ward}
                  onChange={(e) => {
                    setWard(e.target.value);
                    setAutoDetectedInfo((prev) => ({ ...prev, isAuto: false }));
                  }}
                  className="w-full h-11 px-3 text-sm rounded-xl border border-line bg-surface text-ink outline-none focus:border-primary focus:ring-3 focus:ring-primary/10 transition"
                >
                  {mumbaiWards.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Photo Upload Area */}
            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">
                Attach Evidence Photograph (Recommended)
              </label>

              {!previewUrl ? (
                <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-line rounded-2xl bg-canvas hover:border-primary/50 cursor-pointer transition">
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-2">
                    <Camera className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-semibold text-ink">
                    Click to browse or take a photo
                  </span>
                  <span className="text-[11px] text-muted mt-0.5">
                    JPEG, PNG or WebP up to 10MB
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="relative rounded-2xl overflow-hidden border border-line bg-ink/5 aspect-video sm:aspect-16/9">
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-contain bg-black/80" />
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 text-white hover:bg-black transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {previewUrl && (
                <div className="mt-2">
                  <input
                    type="text"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Short caption describing photo evidence..."
                    className="w-full h-9 px-3 text-xs rounded-xl border border-line bg-surface text-ink outline-none"
                  />
                </div>
              )}

              {/* Privacy Tip from UI design */}
              <div className="mt-2.5 flex items-start gap-1.5 text-[11px] text-muted">
                <Info className="w-3.5 h-3.5 text-muted shrink-0 mt-0.5" />
                <span>
                  Photos help others understand the issue. Avoid including faces, vehicle number plates, or private property details.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-muted hover:text-ink transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!addressLabel.trim()) {
                    setError('Please specify the address label or nearest landmark.');
                    return;
                  }
                  setError('');
                  setStep(3);
                }}
                className="inline-flex items-center gap-1.5 h-11 px-6 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold transition"
              >
                <span>Review & Submit</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Review & Submit */}
        {step === 3 && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-ink mb-1">
                3. Final Review & Transparency Settings
              </h3>
              <p className="text-xs text-muted leading-relaxed">
                Review your report details before publishing to the CivicProof public ledger.
              </p>
            </div>

            {/* Summary Review Card */}
            <div className="rounded-xl border border-line bg-canvas p-4 text-xs space-y-2.5">
              <div className="flex items-center justify-between border-b border-line pb-2">
                <span className="text-muted font-medium">Category:</span>
                <span className="font-semibold text-ink capitalize">{category}</span>
              </div>
              <div className="flex items-center justify-between border-b border-line pb-2">
                <span className="text-muted font-medium">Ward:</span>
                <span className="font-semibold text-ink">{ward.split('(')[0].trim()}</span>
              </div>
              <div className="flex items-start justify-between border-b border-line pb-2">
                <span className="text-muted font-medium">Landmark:</span>
                <span className="font-semibold text-ink text-right max-w-xs">{addressLabel}</span>
              </div>
              <div className="flex items-center justify-between border-b border-line pb-2">
                <span className="text-muted font-medium">Coordinates:</span>
                <span className="font-mono text-[11px] text-ink">
                  [{coordinates[0].toFixed(4)}, {coordinates[1].toFixed(4)}]
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted font-medium">Photo Attached:</span>
                <span className="font-semibold text-ink">
                  {selectedFile ? `${selectedFile.name} (SHA-256 hashed on upload)` : 'No photo'}
                </span>
              </div>
            </div>

            {/* Visibility Settings */}
            <div>
              <label className="block text-xs font-semibold text-ink mb-2">
                Location Privacy Level
              </label>
              <div className="space-y-2">
                <label className="flex items-start gap-2.5 p-3 rounded-xl border border-line hover:border-primary/40 cursor-pointer">
                  <input
                    type="radio"
                    name="vis"
                    value="public"
                    checked={visibility === 'public'}
                    onChange={() => setVisibility('public')}
                    className="mt-0.5 text-primary"
                  />
                  <div>
                    <span className="block text-xs font-semibold text-ink">
                      Standard Public (Exact Coordinates)
                    </span>
                    <span className="block text-[11px] text-muted">
                      Best for roads, sidewalks, and public spots so inspectors can find it easily.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-3 rounded-xl border border-line hover:border-primary/40 cursor-pointer">
                  <input
                    type="radio"
                    name="vis"
                    value="redacted_public"
                    checked={visibility === 'redacted_public'}
                    onChange={() => setVisibility('redacted_public')}
                    className="mt-0.5 text-primary"
                  />
                  <div>
                    <span className="block text-xs font-semibold text-ink">
                      Redacted Public (Fuzzed / Approximate Coordinates)
                    </span>
                    <span className="block text-[11px] text-muted">
                      Rounds location on public maps to protect residential privacy.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Consent Checkbox */}
            <label className="flex items-start gap-2.5 p-3.5 rounded-xl bg-canvas border border-line cursor-pointer">
              <input
                type="checkbox"
                required
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 rounded text-primary focus:ring-primary"
              />
              <span className="text-[11px] text-ink leading-relaxed">
                I verify that this report documents a genuine municipal grievance observed in Mumbai. I acknowledge that CivicProof is an independent civic monitoring tool and that official complaints must be recorded with BMC.
              </span>
            </label>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-muted hover:text-ink transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-1.5 h-11 px-7 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold transition active:translate-y-px disabled:opacity-50 shadow-xs"
              >
                <Check className="w-4 h-4" />
                <span>{submitting ? 'Creating report...' : 'Submit CivicProof Report'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
