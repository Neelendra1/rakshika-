import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  ImageRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  ShadingType
} from 'docx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const screenshotsDir = path.join(__dirname, '..', 'assets', 'screenshots');
const outputPath = path.join(__dirname, '..', 'Rakshika_Product_Specification_Handbook.docx');

function createHeading1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 140 },
    children: [
      new TextRun({
        text,
        bold: true,
        size: 32,
        color: '003366',
        font: 'Segoe UI'
      })
    ]
  });
}

function createHeading2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 260, after: 100 },
    children: [
      new TextRun({
        text,
        bold: true,
        size: 24,
        color: '006699',
        font: 'Segoe UI'
      })
    ]
  });
}

function createHeading3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 80 },
    children: [
      new TextRun({
        text,
        bold: true,
        size: 21,
        color: '990000',
        font: 'Segoe UI'
      })
    ]
  });
}

function createParagraph(text, options = {}) {
  return new Paragraph({
    spacing: { before: 60, after: 60 },
    children: [
      new TextRun({
        text,
        size: 22,
        font: 'Segoe UI',
        bold: options.bold || false,
        italic: options.italic || false,
        color: options.color || '333333'
      })
    ]
  });
}

function createBullet(text, boldPrefix = '') {
  const children = [];
  if (boldPrefix) {
    children.push(new TextRun({ text: boldPrefix + ' ', bold: true, size: 22, font: 'Segoe UI', color: '111111' }));
  }
  children.push(new TextRun({ text, size: 22, font: 'Segoe UI', color: '333333' }));

  return new Paragraph({
    bullet: { level: 0 },
    spacing: { before: 40, after: 40 },
    children
  });
}

function createImageParagraph(imagePath, captionText) {
  if (!fs.existsSync(imagePath)) {
    return [createParagraph(`[Image missing: ${path.basename(imagePath)}]`, { italic: true, color: 'CC0000' })];
  }

  const imageBuffer = fs.readFileSync(imagePath);
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 180, after: 60 },
      children: [
        new ImageRun({
          data: imageBuffer,
          transformation: {
            width: 580,
            height: 362
          }
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 180 },
      children: [
        new TextRun({
          text: `Figure: ${captionText}`,
          italic: true,
          size: 18,
          color: '666666',
          font: 'Segoe UI'
        })
      ]
    })
  ];
}

async function buildDocx() {
  console.log('Generating Market-Launch Ready Rakshika Product Specification Word Document...');

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: 'Segoe UI',
            size: 22,
            color: '333333'
          }
        }
      }
    },
    sections: [
      {
        properties: {},
        children: [
          // Document Header Title
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 100 },
            children: [
              new TextRun({
                text: 'RAKSHIKA (रक्षिका)',
                bold: true,
                size: 46,
                color: '990000',
                font: 'Segoe UI'
              })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 150 },
            children: [
              new TextRun({
                text: 'COMPLETE PRODUCT SPECIFICATION & MARKET-LAUNCH HANDBOOK',
                bold: true,
                size: 26,
                color: '003366',
                font: 'Segoe UI'
              })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 350 },
            children: [
              new TextRun({
                text: 'Comprehensive Feature Breakdown, Live UI Screenshots, Architecture, Future Roadmap, Regulatory Compliance & Team Execution Matrix',
                italic: true,
                size: 20,
                color: '555555',
                font: 'Segoe UI'
              })
            ]
          }),

          // SECTION 1
          createHeading1('1. Executive Vision, Crisis Analysis & Commercial Strategy'),
          createParagraph(
            'In India, safety concerns severely restrict women’s freedom of movement, education, and career advancement. Crimes ranging from street harassment and stalking to physical and sexual assault remain major barriers to female independence. Traditional safety apps rely on passive "SOS SMS alerts" sent after an incident begins, offering zero physical intervention or real-time tactical defense.'
          ),
          createParagraph(
            'Rakshika (meaning The Shield) is India’s first integrated, on-demand physical security escort and real-time telemetry network. Rakshika connects female students, working professionals, and guardians with Police-Verified, Background-Vetted Female Security Officers ("Lady Bouncers / Escorts") for active physical deterrence, cryptographic handoff locks, real-time WebSocket route streaming, and multi-tier Police Control Room (PCR) emergency dispatch.'
          ),

          createHeading2('Problem Metric vs. Rakshika Solution Blueprint'),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    shading: { fill: '003366', type: ShadingType.CLEAR },
                    children: [new Paragraph({ children: [new TextRun({ text: 'Metric / Capability', bold: true, color: 'FFFFFF' })] })]
                  }),
                  new TableCell({
                    shading: { fill: '003366', type: ShadingType.CLEAR },
                    children: [new Paragraph({ children: [new TextRun({ text: 'Traditional Safety Apps / Cabs', bold: true, color: 'FFFFFF' })] })]
                  }),
                  new TableCell({
                    shading: { fill: '003366', type: ShadingType.CLEAR },
                    children: [new Paragraph({ children: [new TextRun({ text: 'Rakshika Escort Network', bold: true, color: 'FFFFFF' })] })]
                  })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [createParagraph('Physical Protection', { bold: true })] }),
                  new TableCell({ children: [createParagraph('None. Driver un-vetted for tactical defense.')] }),
                  new TableCell({ children: [createParagraph('Police-verified female protection officers accompany clients.')] })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [createParagraph('Identity Verification', { bold: true })] }),
                  new TableCell({ children: [createParagraph('Basic phone registration (high fraud risk).')] }),
                  new TableCell({ children: [createParagraph('Aadhaar KYC linking with AES-256-CBC field encryption.')] })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [createParagraph('Handoff Security', { bold: true })] }),
                  new TableCell({ children: [createParagraph('Oral name confirmation (impersonation risk).')] }),
                  new TableCell({ children: [createParagraph('Cryptographic 4-digit PIN lock & escrow deposit holding.')] })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [createParagraph('Underground Coverage', { bold: true })] }),
                  new TableCell({ children: [createParagraph('Fails when cellular signal drops in metro basements.')] }),
                  new TableCell({ children: [createParagraph('Offline BLE Mesh Fallback via Bluetooth RSSI sensing.')] })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [createParagraph('Emergency Dispatch', { bold: true })] }),
                  new TableCell({ children: [createParagraph('Generic SMS to contacts after delay.')] }),
                  new TableCell({ children: [createParagraph('Multi-tier: PCR Police Relay + Silent Audio + Guardian SMS.')] })
                ]
              })
            ]
          }),

          // SECTION 2
          createHeading1('2. Phase 1 Core Production Features & UI Screenshots'),

          // Module 1
          createHeading2('Module 1: Police-Verified Lady Guard Registry & Dynamic Discovery Radar'),
          createParagraph(
            'Displays available verified female security personnel with background check badges, police registration numbers, tactical skills, body-cam status, and dynamic proximity radar.'
          ),
          createBullet('Verified badge registration numbers (e.g. POL-DEL-8941, POL-NOI-3412).', 'Police Verification Badge:'),
          createBullet('Martial arts qualifications (Blackbelt Judo, Krav Maga, Tactical Baton).', 'Tactical & Self-Defense Specs:'),
          createBullet('Live body-camera streaming capability indicator.', 'Equipment Transparency:'),
          createBullet('Dynamic map radar showing nearby guards within a dynamic radius.', 'Location Radar:'),
          ...createImageParagraph(
            path.join(screenshotsDir, '1_guard_registry.png'),
            'Module 1 - Police-Verified Lady Escort Registry & Discovery UI'
          ),

          // Module 2
          createHeading2('Module 2: Booking Wizard & Cryptographic Escrow Engine'),
          createParagraph(
            'A 4-step wizard supporting scheduling for Inter-City Exam Commutes, Late-Night Corporate Transit, and VIP Crowd Protection with cryptographic handoff verification.'
          ),
          createBullet('Hourly Transit, Inter-City Exam Escort, VIP Crowd Escort.', 'Service Modes:'),
          createBullet('Generates a unique 4-digit PIN required for physical guard handoff.', 'Cryptographic 4-Digit PIN:'),
          createBullet('Holds booking fees in digital escrow until journey completion is verified.', 'Escrow Deposit Lock:'),
          ...createImageParagraph(
            path.join(screenshotsDir, '2_booking_wizard.png'),
            'Module 2 - 4-Step Booking Wizard & 2FA Handoff Security Lock UI'
          ),

          // Module 3
          createHeading2('Module 3: Live Telemetry & Escort Tracking Dashboard'),
          createParagraph(
            'Provides real-time route monitoring, vehicle speed telemetry, guard device battery monitoring, 500m geofence alerts, and quick guardian sharing.'
          ),
          createBullet('Sub-second location streaming over WebSockets (Socket.IO).', 'Live Route Monitoring:'),
          createBullet('Monitors speed, ETA, device battery %, and connection health.', 'Device Health Metrics:'),
          createBullet('One-swipe panic beacon accessible from all active journey views.', 'Instant SOS Trigger:'),
          ...createImageParagraph(
            path.join(screenshotsDir, '3_live_tracking.png'),
            'Module 3 - Real-Time Telemetry & Escort Tracking Dashboard UI'
          ),

          // Module 4
          createHeading2('Module 4: PCR Command Center & Telemetry Control Center'),
          createParagraph(
            'Control room interface for police and Rakshika command operators to monitor active distress signals, receive ambient mic audio, and execute device telemetry simulations.'
          ),
          createBullet('Real-time incident log showing live GPS coordinates and emergency status.', 'PCR Emergency Incident Feed:'),
          createBullet('Automatic audio stream reception upon client SOS panic trigger.', 'Ambient Mic Receiver:'),
          createBullet('Simulates route deviation, rapid battery drain, and signal blackouts.', 'Telemetry Simulator:'),
          createBullet('Bluetooth RSSI peer-to-peer sensing during cellular loss in subterranean metro corridors.', 'Underground BLE Mesh Fallback:'),
          ...createImageParagraph(
            path.join(screenshotsDir, '4_pcr_command_center.png'),
            'Module 4 - Police Control Room (PCR) & Telemetry Simulator UI'
          ),

          // Module 5
          createHeading2('Module 5: Identity KYC & User Security Profile Hub'),
          createParagraph(
            'Manages client identity verification, emergency contact networks, address shortcuts, and security credentials.'
          ),
          createBullet('Validates 12-digit Aadhaar number and encrypts it using AES-256-CBC at rest.', 'Aadhaar KYC Verification:'),
          createBullet('Registers family emergency contacts for instant SMS dispatch.', 'Emergency Contact List:'),
          createBullet('Pronto/Urban Company style address shortcuts (Home, College, Work).', 'Saved Location Shortcuts:'),
          ...createImageParagraph(
            path.join(screenshotsDir, '5_user_profile.png'),
            'Module 5 - Identity KYC & User Profile Hub UI'
          ),

          // SECTION 3
          createHeading1('3. Phase 2 & Phase 3 Market-Launch Roadmap & Future Features'),
          createParagraph(
            'To achieve pan-India market dominance and transform women’s physical security, Rakshika will deploy the following advanced Phase 2 & Phase 3 roadmap features:'
          ),

          createHeading2('Future Feature 1: AI Predictive Anomaly & Threat Detection (Gemini & Edge AI)'),
          createBullet('Uses Gemini AI models to compare real-time route trajectory against historical safety heatmaps, flagging unscheduled stops or vehicle deviations within 15 seconds.', 'Route Anomaly AI:'),
          createBullet('Real-time natural language processing on device audio to detect distress keywords ("Help", "Bachao", screams) and trigger silent PCR dispatch without manual user interaction.', 'Ambient Audio Keyword Detection:'),
          createBullet('Analyzes smartphone accelerometer data to detect sudden falls, vehicle impacts, or forced running.', 'Biometric & Motion Sensor AI:'),

          createHeading2('Future Feature 2: Wearable Smart Hardware Integration (Rakshika SOS Band & Ring)'),
          createBullet('Pairing with discrete Bluetooth Low Energy (BLE 5.3) wearable rings, smart bracelets, and keychains.', 'Smart Wearable Hardware:'),
          createBullet('Allows users to trigger silent emergency panic alerts by pressing a hidden button on their ring or band, without retrieving their phone.', 'One-Press Silent Trigger:'),
          createBullet('Monitors PPG optical heart-rate sensors for sudden physiological panic spikes (e.g. heart rate jumping from 70 to 150 BPM rapidly).', 'Biometric Panic Detection:'),

          createHeading2('Future Feature 3: Autonomous Drone Escort & Aerial Surveillance Fleet (Rakshika SkyShield)'),
          createBullet('Deployment of autonomous tethered and untethered aerial drones for high-risk, unlit transit corridors or campus perimeter escort.', 'Aerial Drone Escort:'),
          createBullet('Streams thermal IR night vision video directly to the assigned lady guard’s terminal and the local Police Control Room.', 'Thermal Night Vision Feed:'),

          createHeading2('Future Feature 4: Pan-India B2B Corporate Enterprise Safety Portal'),
          createBullet('Dedicated enterprise dashboard for IT, BPO, healthcare, and corporate firms (e.g. Infosys, TCS, Wipro, Accenture) to automatically schedule and track late-night female employee drops.', 'Corporate Night Shift Portal:'),
          createBullet('Generates automated POSH (Prevention of Sexual Harassment) and corporate safety compliance reports for annual audits.', 'POSH Compliance & Audit Engine:'),

          createHeading2('Future Feature 5: Decentralized Escrow Smart Contracts & Micro-Insurance Protocol'),
          createBullet('Provides automated micro-insurance coverage per transit booking (covering medical emergency & emergency transit expenses).', 'Instant Trip Insurance:'),
          createBullet('Automated escrow settlement via UPI 2.0 / smart contract ledgers upon verified geofence drop-off.', 'UPI 2.0 Auto-Escrow Payout:'),

          createHeading2('Future Feature 6: Campus & University Safety Network (Rakshika Campus Guard)'),
          createBullet('Dedicated student safety networks in major education hubs (Kota, Delhi University, Pune, Manipal, Bengaluru).', 'University Safety Hubs:'),
          createBullet('Allows multiple female students returning late from libraries or laboratories to pool a shared lady escort at subsidized student rates.', 'Group Escort Pooling:'),

          // SECTION 4
          createHeading1('4. Regulatory Compliance, Legal & Police Integration Blueprint'),
          createHeading2('Data Protection & Regulatory Alignment in India'),
          createBullet('Full compliance with India’s Digital Personal Data Protection (DPDP) Act 2023. User data is minimized, consent-gated, and stored in AES-256 encrypted form.', 'DPDP Act 2023 Compliance:'),
          createBullet('Verification aligns with UIDAI Aadhaar offline XML / QR verification without storing plain 12-digit numbers.', 'Aadhaar Act Compliance:'),
          createBullet('Lady Protection Officers are certified under PSARA guidelines with mandatory police clearance certificates (PCC).', 'PSARA Licensing Standards:'),

          createHeading2('Police Control Room (PCR) Dial 112 API Integration'),
          createBullet('Direct Webhook & REST API connectivity to state police emergency command centers (Delhi Police Dial 112, UP Police 112, Karnataka Namma 112).', 'State Police Dial 112 Integration:'),
          createBullet('When an SOS is activated, Rakshika transmits JSON payloads containing live GPS coordinates, vehicle details, guard phone number, and client emergency profile.', 'Standard Emergency JSON Payload:'),

          // SECTION 5
          createHeading1('5. Database Schema & Expanded Data Model Reference'),
          createParagraph('Complete Prisma ORM schema incorporating Phase 1 entities and Phase 2/3 future models:'),
          new Paragraph({
            spacing: { before: 100, after: 100 },
            children: [
              new TextRun({
                text: `model User {
  id                String             @id @default(uuid())
  email             String             @unique
  passwordHash      String
  fullName          String
  phone             String
  kycVerified       Boolean            @default(false)
  aadhaarEncrypted  String?
  aadhaarIv         String?
  emergencyContacts EmergencyContact[]
  addresses         AddressShortcut[]
  bookings          Booking[]
  smartDevices      SmartDevice[]
}

model Bouncer {
  id              String    @id @default(uuid())
  name            String
  policeBadgeId   String
  verified        Boolean   @default(true)
  experienceYears Int
  rating          Float     @default(4.9)
  hourlyRate      Int
  specialization  String
  languages       String
  location        String
  lat             Float
  lng             Float
  avatarUrl       String
  bodyCamStatus   String    @default("ACTIVE")
  bookings        Booking[]
}

model Booking {
  id                  String   @id @default(uuid())
  userId              String
  bouncerId           String
  clientName          String
  type                String   // hourly_transit, intercity_exam, event_protection
  status              String   @default("CONFIRMED")
  date                String
  timeSlot            String
  hours               Int
  pickupLocation      String
  destinationLocation String
  amountPaid          Int
  escrowStatus        String   @default("HELD")
  securityPin         String   // 4-digit handoff PIN
  createdAt           DateTime @default(now())
}

model SmartDevice {
  id           String @id @default(uuid())
  userId       String
  deviceType   String // sos_ring, smart_band, panic_button
  macAddress   String
  batteryLevel Int
  status       String @default("PAIRED")
}

model CorporateShift {
  id             String   @id @default(uuid())
  companyName    String
  employeeEmail  String
  shiftDate      String
  dropLocation   String
  escrowStatus   String   @default("CORPORATE_LOCKED")
}`,
                font: 'Consolas',
                size: 18,
                color: '003366'
              })
            ]
          }),

          // SECTION 6
          createHeading1('6. Comprehensive Team Development Handoff Matrix'),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    shading: { fill: '003366', type: ShadingType.CLEAR },
                    children: [new Paragraph({ children: [new TextRun({ text: 'Team Role', bold: true, color: 'FFFFFF' })] })]
                  }),
                  new TableCell({
                    shading: { fill: '003366', type: ShadingType.CLEAR },
                    children: [new Paragraph({ children: [new TextRun({ text: 'Phase 1 Deliverables', bold: true, color: 'FFFFFF' })] })]
                  }),
                  new TableCell({
                    shading: { fill: '003366', type: ShadingType.CLEAR },
                    children: [new Paragraph({ children: [new TextRun({ text: 'Phase 2 & 3 Launch Deliverables', bold: true, color: 'FFFFFF' })] })]
                  })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [createParagraph('Product Manager', { bold: true })] }),
                  new TableCell({ children: [createParagraph('Finalize Phase 1 UI/UX & guard onboarding criteria.')] }),
                  new TableCell({ children: [createParagraph('B2B Corporate portal specs & university safety pass offerings.')] })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [createParagraph('Mobile Engineers', { bold: true })] }),
                  new TableCell({ children: [createParagraph('React Native / Web app, WebSocket location streaming.')] }),
                  new TableCell({ children: [createParagraph('BLE 5.3 SDK for Smart Ring pairing & background geolocation.')] })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [createParagraph('Backend Engineers', { bold: true })] }),
                  new TableCell({ children: [createParagraph('Express REST APIs, Socket.IO server, AES-256 Aadhaar encryption.')] }),
                  new TableCell({ children: [createParagraph('Police Dial 112 Webhooks, B2B corporate scheduling, Kafka queue.')] })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [createParagraph('AI / ML Team', { bold: true })] }),
                  new TableCell({ children: [createParagraph('Geofence anomaly logic & telemetry simulator.')] }),
                  new TableCell({ children: [createParagraph('Gemini audio scream detection & route deviation prediction.')] })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [createParagraph('Compliance & Legal', { bold: true })] }),
                  new TableCell({ children: [createParagraph('Aadhaar KYC privacy policy & user consent terms.')] }),
                  new TableCell({ children: [createParagraph('DPDP Act 2023 compliance audit & PSARA guard licensing.')] })
                ]
              })
            ]
          }),

          // SECTION 7
          createHeading1('7. System Launch & Verification Commands'),
          createParagraph('Commands to initialize, verify, and launch the complete platform:'),
          createBullet('Install npm packages: npm install', '1. Setup:'),
          createBullet('Sync Prisma SQLite DB: cmd /c npx prisma db push', '2. DB Push:'),
          createBullet('Run Backend + Frontend dev servers: cmd /c npm run dev:all', '3. Launch App:'),
          createBullet('Run 9-Step E2E Verification Suite: cmd /c npx tsx e2e_verification_demo.ts', '4. Verify Suite:'),
          createBullet('Re-generate Word Specification Document: cmd /c npx tsx scripts/create_word_document.js', '5. Build Docx:')
        ]
      }
    ]
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outputPath, buffer);
  console.log(`Updated Word document generated successfully at: ${outputPath}`);
}

buildDocx().catch(err => {
  console.error('Failed to generate expanded Word document:', err);
  process.exit(1);
});
