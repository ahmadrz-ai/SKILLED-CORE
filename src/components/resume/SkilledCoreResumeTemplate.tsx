import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Link,
} from '@react-pdf/renderer';
import path from 'path';

// Define assets using process.cwd() on the server and fallback in the browser
const getLogoPath = () => {
  if (typeof window === 'undefined') {
    return path.join(process.cwd(), 'public', 'logo.png');
  }
  return '/logo.png';
};

/**
 * ATS-friendly, single-column resume.
 *
 * Design rules for parser-safety:
 * - SINGLE column flow (multi-column layouts get garbled by ATS readers).
 * - Real selectable text everywhere (no text baked into images/graphics).
 * - Standard section headings (Summary, Skills, Experience, Projects, Education).
 * - Contact details and skills rendered as plain text lines (most reliably parsed).
 * - No essential info in headers/footers (ATS often skips them).
 * Brand identity is kept subtle: small logo by the name, a thin purple rule, purple
 * headings/links — none of which interfere with text extraction.
 */
const PURPLE = '#5B35D5';
const INK = '#141417';
const BODY = '#2D2D35';
const MUTED = '#6B6B78';
const LINE = '#E8E8ED';

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9.5,
    paddingTop: 40,
    paddingBottom: 48,
    paddingHorizontal: 48,
    backgroundColor: '#FFFFFF',
    color: BODY,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1.5,
    borderBottomColor: PURPLE,
    paddingBottom: 12,
    marginBottom: 10,
  },
  logo: { width: 30, height: 30, objectFit: 'contain' },
  name: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: INK, letterSpacing: -0.4 },
  headline: { fontSize: 10, color: PURPLE, fontFamily: 'Helvetica-Bold', marginTop: 2 },
  // Contact as a single wrapped text line near the top (ATS reads this reliably)
  contactRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 18 },
  contactText: { fontSize: 9, color: MUTED },
  contactLink: { fontSize: 9, color: PURPLE, textDecoration: 'none' },
  contactSep: { fontSize: 9, color: '#B8B8C0' },
  section: { marginBottom: 14 },
  heading: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: INK,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: LINE,
  },
  body: { fontSize: 9.5, color: BODY, lineHeight: 1.45 },
  itemHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 1 },
  itemTitle: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: INK },
  itemDate: { fontSize: 9, color: MUTED },
  itemSub: { fontSize: 9.5, fontFamily: 'Helvetica-Oblique', color: PURPLE, marginBottom: 4 },
  bulletRow: { flexDirection: 'row', marginBottom: 3, paddingLeft: 2 },
  bulletDot: { fontSize: 9, color: PURPLE, marginRight: 5, marginTop: 0.5 },
  bulletText: { fontSize: 9.3, color: BODY, flex: 1, lineHeight: 1.4 },
  itemBlock: { marginBottom: 10 },
  techText: { fontSize: 9, color: MUTED, marginTop: 3 },
  verifyBox: {
    borderWidth: 1,
    borderColor: '#D4CCF8',
    backgroundColor: '#F5F3FF',
    borderRadius: 4,
    padding: 8,
  },
  verifyTitle: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#4A28C9', marginBottom: 3 },
  verifyText: { fontSize: 9, color: BODY, lineHeight: 1.4 },
  footer: {
    position: 'absolute',
    bottom: 18,
    left: 48,
    right: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: LINE,
    paddingTop: 6,
  },
  footerText: { fontSize: 7.5, color: '#909099' },
});

interface SkilledCoreResumeTemplateProps {
  data: {
    name: string;
    headline: string;
    location: string;
    email: string;
    phone?: string;
    summary: string;
    socials: { label: string; url: string }[];
    experience: {
      title: string;
      company: string;
      location?: string;
      startDate: string;
      endDate: string;
      bullets: string[];
    }[];
    education: {
      degree: string;
      institution: string;
      location?: string;
      startYear: string;
      endYear: string;
      honors?: string;
    }[];
    skills: string[];
    projects: {
      name: string;
      description: string;
      technologies: string[];
      url?: string;
    }[];
    aiInterviewScore?: string | null;
    verifiedBadges?: string[];
  };
}

export function SkilledCoreResumeTemplate({ data }: SkilledCoreResumeTemplateProps) {
  const logoSrc = getLogoPath();

  // Build a flat, parser-friendly contact list.
  const contactParts: { text: string; url?: string }[] = [];
  if (data.location) contactParts.push({ text: data.location });
  if (data.email) contactParts.push({ text: data.email, url: `mailto:${data.email}` });
  if (data.phone) contactParts.push({ text: data.phone });
  (data.socials || []).forEach((s) => contactParts.push({ text: s.label, url: s.url }));

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header — small logo + name + headline (real text, single column) */}
        <View style={styles.header}>
          <Image src={logoSrc} style={styles.logo} />
          <View>
            <Text style={styles.name}>{data.name}</Text>
            {data.headline ? <Text style={styles.headline}>{data.headline}</Text> : null}
          </View>
        </View>

        {/* Contact line */}
        {contactParts.length > 0 && (
          <View style={styles.contactRow}>
            {contactParts.map((c, i) => (
              <React.Fragment key={i}>
                {i > 0 && <Text style={styles.contactSep}>·</Text>}
                {c.url ? (
                  <Link src={c.url} style={styles.contactLink}>{c.text}</Link>
                ) : (
                  <Text style={styles.contactText}>{c.text}</Text>
                )}
              </React.Fragment>
            ))}
          </View>
        )}

        {/* Summary */}
        {data.summary ? (
          <View style={styles.section}>
            <Text style={styles.heading}>Summary</Text>
            <Text style={styles.body}>{data.summary}</Text>
          </View>
        ) : null}

        {/* Skills — comma-separated for reliable keyword parsing */}
        {data.skills && data.skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.heading}>Skills</Text>
            <Text style={styles.body}>{data.skills.join(', ')}</Text>
          </View>
        )}

        {/* Experience */}
        {data.experience && data.experience.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.heading}>Experience</Text>
            {data.experience.map((job, i) => (
              <View key={i} style={styles.itemBlock} wrap={false}>
                <View style={styles.itemHeaderRow}>
                  <Text style={styles.itemTitle}>{job.title}</Text>
                  <Text style={styles.itemDate}>{job.startDate} – {job.endDate}</Text>
                </View>
                <Text style={styles.itemSub}>
                  {job.company}{job.location ? ` · ${job.location}` : ''}
                </Text>
                {job.bullets?.map((b, bi) => (
                  <View key={bi} style={styles.bulletRow}>
                    <Text style={styles.bulletDot}>•</Text>
                    <Text style={styles.bulletText}>{b}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {/* Projects */}
        {data.projects && data.projects.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.heading}>Projects</Text>
            {data.projects.map((p, i) => (
              <View key={i} style={styles.itemBlock} wrap={false}>
                <View style={styles.itemHeaderRow}>
                  <Text style={styles.itemTitle}>{p.name}</Text>
                  {p.url ? <Link src={p.url} style={styles.contactLink}>{p.url}</Link> : null}
                </View>
                <Text style={styles.body}>{p.description}</Text>
                {p.technologies && p.technologies.length > 0 && (
                  <Text style={styles.techText}>Technologies: {p.technologies.join(', ')}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Education */}
        {data.education && data.education.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.heading}>Education</Text>
            {data.education.map((edu, i) => (
              <View key={i} style={styles.itemBlock} wrap={false}>
                <View style={styles.itemHeaderRow}>
                  <Text style={styles.itemTitle}>{edu.institution}</Text>
                  <Text style={styles.itemDate}>{edu.startYear} – {edu.endYear}</Text>
                </View>
                <Text style={styles.body}>
                  {edu.degree}{edu.honors ? ` · ${edu.honors}` : ''}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* SkilledCore verification — kept last, as plain text */}
        {(data.aiInterviewScore || (data.verifiedBadges && data.verifiedBadges.length > 0)) && (
          <View style={styles.section}>
            <Text style={styles.heading}>SkilledCore Verification</Text>
            <View style={styles.verifyBox}>
              <Text style={styles.verifyTitle}>SkilledCore Verified</Text>
              {data.aiInterviewScore ? (
                <Text style={styles.verifyText}>AI Interview Score: {data.aiInterviewScore}</Text>
              ) : null}
              {data.verifiedBadges && data.verifiedBadges.length > 0 && (
                <Text style={styles.verifyText}>Verified skills: {data.verifiedBadges.join(', ')}</Text>
              )}
            </View>
          </View>
        )}

        {/* Footer — non-essential info only (ATS may ignore) */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Generated via SkilledCore · skilledcore.com</Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}
