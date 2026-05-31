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

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    paddingTop: 36,
    paddingBottom: 40,
    paddingHorizontal: 36,
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  watermark: {
    position: 'absolute',
    top: '40%',
    left: '50%',
    marginLeft: -150,
    marginTop: -150,
    width: 300,
    height: 300,
    opacity: 0.03, // Extremely subtle watermark so it doesn't degrade text readability
    zIndex: 0,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1.5,
    borderBottomColor: '#5B35D5', // --sc-purple-600 (bold accent brand border)
    paddingBottom: 16,
    marginBottom: 20,
    zIndex: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerLogo: {
    width: 36,
    height: 36,
    objectFit: 'contain',
  },
  headerTitleArea: {
    flexDirection: 'column',
  },
  candidateName: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    color: '#141417', // --sc-gray-900 (crisp high contrast name)
    letterSpacing: -0.5,
  },
  candidateHeadline: {
    fontSize: 10,
    color: '#5B35D5', // --sc-purple-600 (bold brand purple)
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  headerTagline: {
    color: '#6B6B78', // --sc-gray-500
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 0.5,
  },
  mainLayout: {
    flexDirection: 'row',
    gap: 24,
    flex: 1,
    zIndex: 10,
  },
  leftColumn: {
    width: '62%',
    flexDirection: 'column',
  },
  rightColumn: {
    width: '38%',
    flexDirection: 'column',
    borderLeftWidth: 1,
    borderLeftColor: '#E8E8ED', // --sc-gray-150 (clean subtle separator)
    paddingLeft: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeading: {
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
    color: '#141417', // --sc-gray-900 (crisp modern text)
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 8,
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: '#EAE6FD', // --sc-purple-100 (subtle section underline)
  },
  bodyText: {
    fontSize: 8.5,
    color: '#2D2D35', // --sc-gray-700
    lineHeight: 1.45,
  },
  contactItem: {
    marginBottom: 8,
  },
  contactLabel: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: '#6B6B78', // --sc-gray-500
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 8.5,
    color: '#2D2D35', // --sc-gray-700
  },
  contactLink: {
    fontSize: 8.5,
    color: '#5B35D5', // --sc-purple-600
    textDecoration: 'none',
  },
  jobContainer: {
    marginBottom: 12,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 2,
  },
  jobCompany: {
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
    color: '#141417',
  },
  jobDate: {
    fontSize: 8,
    color: '#6B6B78',
  },
  jobTitle: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Oblique',
    color: '#5B35D5',
    marginBottom: 4,
  },
  bulletRow: {
    flexDirection: 'row',
    marginBottom: 3,
    paddingLeft: 4,
  },
  bulletPoint: {
    fontSize: 8,
    color: '#5B35D5',
    marginRight: 4,
    marginTop: 1,
  },
  bulletText: {
    fontSize: 8.2,
    color: '#2D2D35',
    flex: 1,
    lineHeight: 1.35,
  },
  skillsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 2,
  },
  skillChip: {
    backgroundColor: '#F5F3FF', // --sc-purple-50
    borderWidth: 1,
    borderColor: '#EAE6FD', // --sc-purple-100
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  skillText: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: '#4A28C9', // --sc-purple-700
  },
  projectContainer: {
    marginBottom: 10,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 2,
  },
  projectName: {
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
    color: '#141417',
  },
  projectDescription: {
    fontSize: 8.2,
    color: '#2D2D35',
    lineHeight: 1.4,
    marginBottom: 4,
  },
  eduContainer: {
    marginBottom: 10,
  },
  eduInstitution: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: '#141417',
  },
  eduDegree: {
    fontSize: 8,
    color: '#2D2D35',
  },
  eduDate: {
    fontSize: 7.5,
    color: '#6B6B78',
    marginTop: 2,
  },
  interviewCard: {
    backgroundColor: '#F5F3FF', // --sc-purple-50
    borderWidth: 1,
    borderColor: '#D4CCF8', // --sc-purple-200
    borderRadius: 6,
    padding: 8,
    marginTop: 2,
  },
  interviewTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#4A28C9', // --sc-purple-700
    marginBottom: 3,
  },
  interviewScore: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#141417',
    marginBottom: 2,
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 2,
  },
  badgeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4', // bg-badge-success tint
    borderWidth: 1,
    borderColor: '#DCFCE7', // bg-badge-success border
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: '#15803D', // text-badge-success dark green
  },
  footer: {
    position: 'absolute',
    bottom: 14,
    left: 36,
    right: 36,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#E8E8ED',
    paddingTop: 6,
    zIndex: 10,
  },
  footerText: {
    fontSize: 7,
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

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Subtle Watermark on background */}
        <Image src={logoSrc} style={styles.watermark} />

        {/* Modern High-Contrast Header (Logo Next to Name) */}
        <View style={styles.headerContainer}>
          <View style={styles.headerLeft}>
            <Image src={logoSrc} style={styles.headerLogo} />
            <View style={styles.headerTitleArea}>
              <Text style={styles.candidateName}>{data.name}</Text>
              <Text style={styles.candidateHeadline}>{data.headline}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.headerTagline}>skilledcore.com</Text>
          </View>
        </View>

        {/* Asymmetrical Two-Column Main Layout */}
        <View style={styles.mainLayout}>
          
          {/* Left Column (62% width): Experience, Summary, Projects */}
          <View style={styles.leftColumn}>
            
            {/* 1. Summary */}
            {data.summary && (
              <View style={styles.section}>
                <Text style={styles.sectionHeading}>Professional Summary</Text>
                <Text style={styles.bodyText}>{data.summary}</Text>
              </View>
            )}

            {/* 2. Experience */}
            {data.experience && data.experience.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionHeading}>Experience</Text>
                {data.experience.map((job, index) => (
                  <View key={index} style={styles.jobContainer}>
                    <View style={styles.jobHeader}>
                      <Text style={styles.jobCompany}>{job.company}</Text>
                      <Text style={styles.jobDate}>
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

            {/* 3. Projects */}
            {data.projects && data.projects.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionHeading}>Projects</Text>
                {data.projects.map((project, index) => (
                  <View key={index} style={styles.projectContainer}>
                    <View style={styles.projectHeader}>
                      <Text style={styles.jobCompany}>{project.name}</Text>
                      {project.url && (
                        <Link src={project.url} style={styles.contactLink}>
                          Link
                        </Link>
                      )}
                    </View>
                    <Text style={styles.projectDescription}>
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

          </View>

          {/* Right Column (38% width): Contact, Skills, Education, AI Credentials */}
          <View style={styles.rightColumn}>
            
            {/* 1. Contact Information */}
            <View style={styles.section}>
              <Text style={styles.sectionHeading}>Contact Details</Text>
              
              {data.location && (
                <View style={styles.contactItem}>
                  <Text style={styles.contactLabel}>Location</Text>
                  <Text style={styles.contactValue}>{data.location}</Text>
                </View>
              )}
              
              {data.email && (
                <View style={styles.contactItem}>
                  <Text style={styles.contactLabel}>Email</Text>
                  <Text style={styles.contactValue}>{data.email}</Text>
                </View>
              )}
              
              {data.phone && (
                <View style={styles.contactItem}>
                  <Text style={styles.contactLabel}>Phone</Text>
                  <Text style={styles.contactValue}>{data.phone}</Text>
                </View>
              )}

              {data.socials && data.socials.length > 0 && (
                <View style={styles.contactItem}>
                  <Text style={styles.contactLabel}>Social Networks</Text>
                  {data.socials.map((social, index) => (
                    <View key={index} style={{ marginBottom: 3 }}>
                      <Link src={social.url} style={styles.contactLink}>
                        {social.label}
                      </Link>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* 2. Skills */}
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

            {/* 3. Education */}
            {data.education && data.education.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionHeading}>Education</Text>
                {data.education.map((edu, index) => (
                  <View key={index} style={styles.eduContainer}>
                    <Text style={styles.eduInstitution}>{edu.institution}</Text>
                    <Text style={styles.eduDegree}>
                      {edu.degree}
                      {edu.honors ? ` · ${edu.honors}` : ''}
                    </Text>
                    <Text style={styles.eduDate}>
                      {edu.startYear} – {edu.endYear}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* 4. AI Assessment (Vetted Score Card) */}
            {data.aiInterviewScore && (
              <View style={styles.section}>
                <Text style={styles.sectionHeading}>AI Assessment</Text>
                <View style={styles.interviewCard}>
                  <Text style={styles.interviewTitle}>
                    ✓ SKILLEDCORE VERIFIED
                  </Text>
                  <Text style={styles.interviewScore}>
                    Score: {data.aiInterviewScore}
                  </Text>
                  <Text style={{ ...styles.bodyText, fontSize: 7.5, color: '#6B6B78' }}>
                    Verified by technical challenge and live system assessment.
                  </Text>
                </View>
              </View>
            )}

            {/* 5. Verified Credentials (Security Badges) */}
            {data.verifiedBadges && data.verifiedBadges.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionHeading}>Credentials</Text>
                <View style={styles.badgeContainer}>
                  {data.verifiedBadges.map((badge, index) => (
                    <View key={index} style={styles.badgeChip}>
                      <Text style={styles.badgeText}>🛡 {badge}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

          </View>

        </View>

        {/* Modern Sticky Page Footer */}
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
