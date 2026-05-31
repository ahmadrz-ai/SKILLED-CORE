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

const getBgrPath = () => {
  if (typeof window === 'undefined') {
    return path.join(process.cwd(), 'public', 'BGR Full.png');
  }
  return '/BGR Full.png';
};

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    paddingTop: 0,
    paddingBottom: 40,
    paddingHorizontal: 0,
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  watermark: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-150px, -150px)', // center 300x300 image
    width: 300,
    height: 300,
    opacity: 0.08,
    zIndex: 0,
  },
  headerBanner: {
    backgroundColor: '#5B35D5', // sc-purple-600
    paddingHorizontal: 32,
    paddingVertical: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0,
  },
  headerTagline: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 8,
    fontFamily: 'Helvetica',
  },
  logoImage: {
    height: 24,
    objectFit: 'contain',
  },
  contactArea: {
    paddingHorizontal: 32,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8ED', // border-card
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    objectFit: 'cover',
    flexShrink: 0,
    borderWidth: 1,
    borderColor: '#E8E8ED',
  },
  basicsContainer: {
    flex: 1,
  },
  candidateName: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: '#141417', // text-heading
    marginBottom: 2,
  },
  candidateHeadline: {
    fontSize: 10.5,
    color: '#5B35D5', // sc-purple-600
    marginBottom: 6,
    fontFamily: 'Helvetica-Bold',
  },
  contactRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  contactText: {
    fontSize: 8.5,
    color: '#6B6B78', // text-secondary
  },
  socialLink: {
    fontSize: 8.5,
    color: '#5B35D5',
    textDecoration: 'none',
  },
  section: {
    paddingHorizontal: 32,
    marginTop: 16,
  },
  sectionHeading: {
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
    color: '#5B35D5',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 6,
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: '#EAE6FD', // sc-purple-100
  },
  bodyText: {
    fontSize: 9,
    color: '#2D2D35', // text-body
    lineHeight: 1.45,
  },
  secondaryText: {
    fontSize: 8.5,
    color: '#6B6B78',
  },
  jobContainer: {
    marginBottom: 10,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 1,
  },
  jobCompany: {
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
    color: '#141417',
  },
  jobTitle: {
    fontSize: 9,
    color: '#5B35D5',
    marginBottom: 3,
  },
  bulletRow: {
    flexDirection: 'row',
    marginBottom: 2,
    paddingLeft: 6,
  },
  bulletPoint: {
    fontSize: 8.5,
    color: '#6B6B78',
    marginRight: 4,
  },
  bulletText: {
    fontSize: 8.8,
    color: '#2D2D35',
    flex: 1,
    lineHeight: 1.4,
  },
  skillsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  skillChip: {
    backgroundColor: '#F5F3FF', // sc-purple-50
    borderWidth: 1,
    borderColor: '#D4CCF8', // sc-purple-200
    borderRadius: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  skillText: {
    fontSize: 8,
    color: '#4A28C9',
  },
  interviewBadge: {
    backgroundColor: '#F5F3FF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D4CCF8',
    padding: 10,
  },
  interviewHeader: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: '#4A28C9',
    marginBottom: 3,
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  badgeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#D4CCF8',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#4A28C9',
  },
  footer: {
    position: 'absolute',
    bottom: 14,
    left: 32,
    right: 32,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#E8E8ED',
    paddingTop: 6,
  },
  footerText: {
    fontSize: 7.5,
    color: '#909099',
  },
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
  const bgrSrc = getBgrPath();

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Subtle Watermark on background */}
        <Image src={logoSrc} style={styles.watermark} />

        {/* Top Header Banner */}
        <View style={styles.headerBanner}>
          <Image src={bgrSrc} style={styles.logoImage} />
          <Text style={styles.headerTagline}>skilledcore.com</Text>
        </View>

        {/* Contact Info Header */}
        <View style={styles.contactArea}>
          {data.phone ? null : null} {/* placeholder logic */}
          <View style={styles.basicsContainer}>
            <Text style={styles.candidateName}>{data.name}</Text>
            <Text style={styles.candidateHeadline}>{data.headline}</Text>

            <View style={styles.contactRow}>
              {data.location && (
                <Text style={styles.contactText}>📍 {data.location}</Text>
              )}
              {data.email && (
                <Text style={styles.contactText}>✉ {data.email}</Text>
              )}
              {data.phone && (
                <Text style={styles.contactText}>📞 {data.phone}</Text>
              )}
              {data.socials?.map((social, index) => (
                <Link key={index} src={social.url} style={styles.socialLink}>
                  {social.label}
                </Link>
              ))}
            </View>
          </View>
        </View>

        {/* 1. Summary Section */}
        {data.summary && (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Professional Summary</Text>
            <Text style={styles.bodyText}>{data.summary}</Text>
          </View>
        )}

        {/* 2. Experience Section */}
        {data.experience && data.experience.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Experience</Text>
            {data.experience.map((job, index) => (
              <View key={index} style={styles.jobContainer}>
                <View style={styles.jobHeader}>
                  <Text style={styles.jobCompany}>{job.company}</Text>
                  <Text style={styles.secondaryText}>
                    {job.startDate} – {job.endDate}
                  </Text>
                </View>
                <Text style={styles.jobTitle}>
                  {job.title}
                  {job.location ? ` · ${job.location}` : ''}
                </Text>
                {job.bullets?.map((bullet, bulletIndex) => (
                  <View key={bulletIndex} style={styles.bulletRow}>
                    <Text style={styles.bulletPoint}>•</Text>
                    <Text style={styles.bulletText}>{bullet}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {/* 3. Skills Section */}
        {data.skills && data.skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Skills</Text>
            <View style={styles.skillsWrapper}>
              {data.skills.map((skill, index) => (
                <View key={index} style={styles.skillChip}>
                  <Text style={styles.skillText}>{skill}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 4. Projects Section */}
        {data.projects && data.projects.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Projects</Text>
            {data.projects.map((project, index) => (
              <View key={index} style={{ marginBottom: 8 }}>
                <View style={styles.jobHeader}>
                  <Text style={styles.jobCompany}>{project.name}</Text>
                  {project.url && (
                    <Link src={project.url} style={styles.socialLink}>
                      Link
                    </Link>
                  )}
                </View>
                <Text style={{ ...styles.bodyText, marginBottom: 3 }}>
                  {project.description}
                </Text>
                <View style={styles.skillsWrapper}>
                  {project.technologies?.map((tech, techIndex) => (
                    <View key={techIndex} style={styles.skillChip}>
                      <Text style={styles.skillText}>{tech}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* 5. Education Section */}
        {data.education && data.education.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Education</Text>
            {data.education.map((edu, index) => (
              <View key={index} style={{ marginBottom: 6 }}>
                <View style={styles.jobHeader}>
                  <Text style={styles.jobCompany}>{edu.institution}</Text>
                  <Text style={styles.secondaryText}>
                    {edu.startYear} – {edu.endYear}
                  </Text>
                </View>
                <Text style={styles.bodyText}>
                  {edu.degree}
                  {edu.honors ? ` · ${edu.honors}` : ''}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* 6. AI Interview Score */}
        {data.aiInterviewScore && (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>AI Interview Assessment</Text>
            <View style={styles.interviewBadge}>
              <Text style={styles.interviewHeader}>
                ✓ Verified by SkilledCore AI Interview
              </Text>
              <Text style={styles.bodyText}>{data.aiInterviewScore}</Text>
            </View>
          </View>
        )}

        {/* 7. Verified Badges */}
        {data.verifiedBadges && data.verifiedBadges.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Verified Credentials</Text>
            <View style={styles.badgeContainer}>
              {data.verifiedBadges.map((badge, index) => (
                <View key={index} style={styles.badgeChip}>
                  <Text style={styles.badgeText}>🛡 {badge}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Page Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Generated via SkilledCore · skilledcore.com
          </Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
