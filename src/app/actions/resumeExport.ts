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
    experience: user.experience,
    education: user.education,
    projects: user.projects,
    interviews: user.interviews,
    assessments: user.assessments,
  };
}
