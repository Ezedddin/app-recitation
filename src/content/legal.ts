/**
 * Privacy policy and terms of use. One source for both the in-app screens
 * (src/app/legal/[document].tsx) and the hosted web pages the app stores
 * require (`npm run legal:build`), so the two can never drift apart.
 *
 * Fill in LEGAL_DETAILS before publishing, and update the texts whenever the
 * app starts collecting or sharing something new.
 */
export const LEGAL_DETAILS = {
  appName: 'app-recitatie',
  owner: '[YOUR NAME OR COMPANY]',
  contactEmail: '[CONTACT EMAIL]',
  country: 'the Netherlands',
  lastUpdated: '18 October 2026',
};

export type LegalDocumentId = 'privacy' | 'terms';

export interface LegalSection {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
}

export interface LegalDocument {
  id: LegalDocumentId;
  title: string;
  intro: string;
  sections: LegalSection[];
}

const { appName, owner, contactEmail, country } = LEGAL_DETAILS;

const PRIVACY: LegalDocument = {
  id: 'privacy',
  title: 'Privacy Policy',
  intro: `${appName} helps you practise Quran recitation by comparing your recording with a reciter you choose. This policy explains what data the app uses, why, and what your rights are. ${owner} is responsible for this processing (the "data controller").`,
  sections: [
    {
      heading: 'What we collect',
      bullets: [
        'Your voice recordings — only when you tap record and send a recitation for analysis.',
        'Which surah, ayah and reciter you practised, and your attempt number.',
        'Technical data that every internet request carries, such as your IP address, kept in our server logs.',
      ],
      paragraphs: [
        'We do not ask for your name, email address, contacts or location, and the app has no advertising or analytics trackers.',
      ],
    },
    {
      heading: 'How your recording is analysed',
      paragraphs: [
        'Your recording is uploaded to our analysis server over an encrypted connection. The server compares it with the reciter\'s recording of the same ayah and sends both recordings and the Arabic text to OpenAI, which writes your score and feedback.',
        'Our server deletes your recording as soon as the analysis is finished. We do not keep copies and do not use your recordings to train AI models. OpenAI processes the recording on our behalf; under its API terms it does not use API data to train its models and may keep it for up to 30 days to detect abuse, after which it is deleted.',
      ],
    },
    {
      heading: 'What stays on your phone',
      paragraphs: [
        'Your recordings, scores, feedback, chosen reciter and practice history are stored only on your device. Deleting the app deletes this data.',
      ],
    },
    {
      heading: 'Reciter audio',
      paragraphs: [
        'When you play a reciter, the audio is loaded from public Quran audio services (such as everyayah.com, mp3quran.net and UmmahAPI) or through our server. Like any website, those services can see your IP address.',
      ],
    },
    {
      heading: 'Purchases',
      paragraphs: [
        'Subscriptions and purchases are handled by Apple (App Store) or Google (Google Play). We never see your payment details. We only receive confirmation of whether you have an active subscription.',
      ],
    },
    {
      heading: 'Legal basis',
      paragraphs: [
        'We process your recording because you ask us to analyse it — this is necessary to provide the service you request (Article 6(1)(b) GDPR). Server logs are kept for our legitimate interest in keeping the service secure and working (Article 6(1)(f) GDPR).',
      ],
    },
    {
      heading: 'Who we share data with',
      bullets: [
        'OpenAI — to generate your score and feedback.',
        'Our hosting provider — which runs the analysis server.',
        'Apple or Google — for purchases.',
      ],
      paragraphs: [
        'Some of these providers are based in the United States. Transfers are covered by the EU–US Data Privacy Framework or the European Commission\'s standard contractual clauses. We never sell your data.',
      ],
    },
    {
      heading: 'How long we keep data',
      bullets: [
        'Recordings on our server: deleted right after the analysis.',
        'Server logs: at most 30 days.',
        'Data on your phone: until you delete the app.',
      ],
    },
    {
      heading: 'Your rights',
      paragraphs: [
        `You have the right to access, correct or delete your personal data, to object to or restrict its processing, and to data portability. Because we do not keep your recordings or create an account for you, we usually hold no data that can be linked to you. To exercise your rights, email ${contactEmail}. You can also complain to your data protection authority — in ${country} that is the Autoriteit Persoonsgegevens.`,
      ],
    },
    {
      heading: 'Children',
      paragraphs: [
        'If you are under 16, ask a parent or guardian for permission before using the app.',
      ],
    },
    {
      heading: 'Changes and contact',
      paragraphs: [
        `We will update this policy when the app changes, and show the date of the latest version above. Questions? Email ${contactEmail}.`,
      ],
    },
  ],
};

const TERMS: LegalDocument = {
  id: 'terms',
  title: 'Terms of Use',
  intro: `These terms apply to your use of ${appName}, offered by ${owner}. By using the app you agree to them.`,
  sections: [
    {
      heading: 'What the app does',
      paragraphs: [
        'The app gives you a score from 0 to 100 and written feedback on your recitation, based on a comparison with the reciter you choose.',
      ],
    },
    {
      heading: 'AI feedback is guidance, not a teacher',
      paragraphs: [
        'Scores and feedback are generated automatically and can be wrong — especially remarks about individual letters. They are not a religious ruling and do not replace a qualified Quran teacher. Always check feedback against the reciter and, where possible, with a teacher.',
      ],
    },
    {
      heading: 'Free use and subscription',
      bullets: [
        'Without a subscription you can analyse a limited number of recitations per day, as shown in the app.',
        'A subscription gives unlimited analyses for as long as it is active. The price and billing period are shown before you buy.',
        'Subscriptions renew automatically unless you cancel at least 24 hours before the end of the current period. You can cancel in your App Store or Google Play account settings.',
        'Payments, refunds and cancellations are handled by Apple or Google under their terms.',
      ],
    },
    {
      heading: 'Fair use',
      paragraphs: [
        'Do not misuse the service, for example by sending automated requests, trying to bypass the daily limit, uploading recordings of other people without their permission, or interfering with the server. We may limit or block access in case of misuse.',
      ],
    },
    {
      heading: 'Quran text and audio',
      paragraphs: [
        'The Quran text and reciter recordings come from public Quran sources and remain the property of their respective owners. The app only uses them to help you practise.',
      ],
    },
    {
      heading: 'Availability',
      paragraphs: [
        'We do our best to keep the app working, but cannot guarantee it is always available or free of errors. We may change or stop features, and will tell you in advance about changes that affect a paid subscription.',
      ],
    },
    {
      heading: 'Liability',
      paragraphs: [
        'The app is provided as is. To the extent permitted by law, we are not liable for indirect damage arising from its use. Nothing in these terms limits your rights as a consumer under mandatory law.',
      ],
    },
    {
      heading: 'Governing law and contact',
      paragraphs: [
        `These terms are governed by the laws of ${country}. Questions or complaints? Email ${contactEmail}.`,
      ],
    },
  ],
};

export const LEGAL_DOCUMENTS: Record<LegalDocumentId, LegalDocument> = {
  privacy: PRIVACY,
  terms: TERMS,
};
