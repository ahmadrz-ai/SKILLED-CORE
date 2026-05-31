'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export interface ResumeData {
  name: string | null;
  email: string | null;
  bio: string | null;
  headline: string | null;
  location: string | null;
  image: string | null;
  customLinks: string | null;
  skills: string | null;
  experience: {
    id: string;
    position: string;
    company: string;
    startDate: string;
    endDate: string | null;
    description: string | null;
  }[];
  education: {
    id: string;
    school: string;
    degree: string;
    fieldOfStudy: string | null;
    startDate: string | null;
    endDate: string | null;
    description: string | null;
  }[];
  projects: {
    id: string;
    title: string;
    description: string | null;
    link: string | null;
    imageUrl: string | null;
  }[];
  interviews: {
    id: string;
    role: string;
    score: number;
    feedback: string | null;
  }[];
  assessments: {
    id: string;
    score: number;
    status: string;
    assessment: {
      title: string;
    };
  }[];
}

export async function getProfileForResume(): Promise<ResumeData> {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Not authenticated');

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      experience: { orderBy: { createdAt: 'desc' } },
      education: { orderBy: { createdAt: 'desc' } },
      projects: { orderBy: { createdAt: 'desc' } },
      interviews: { orderBy: { createdAt: 'desc' }, take: 1 },
      assessments: {
        where: { status: 'PASSED' },
        include: { assessment: true },
      },
    },
  });

  if (!user) throw new Error('User not found');

  return {
    name: user.name,
    email: user.email,
    bio: user.bio,
    headline: user.headline,
    location: user.location,
    image: user.image,
    customLinks: user.customLinks,
    skills: user.skills,
    experience: user.experience.map(exp => ({
      id: exp.id,
      position: exp.position,
      company: exp.company,
      startDate: exp.startDate,
      endDate: exp.endDate,
      description: exp.description
    })),
    education: user.education.map(edu => ({
      id: edu.id,
      school: edu.school,
      degree: edu.degree,
      fieldOfStudy: edu.fieldOfStudy,
      startDate: edu.startDate,
      endDate: edu.endDate,
      description: edu.description
    })),
    projects: user.projects.map(proj => ({
      id: proj.id,
      title: proj.title,
      description: proj.description,
      link: proj.link,
      imageUrl: proj.imageUrl
    })),
    interviews: user.interviews.map(intv => ({
      id: intv.id,
      role: intv.role,
      score: intv.score,
      feedback: intv.feedback
    })),
    assessments: user.assessments.map(asmt => ({
      id: asmt.id,
      score: asmt.score,
      status: asmt.status,
      assessment: {
        title: asmt.assessment.title
      }
    })),
  };
}
