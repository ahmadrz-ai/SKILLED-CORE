'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export interface ResumeData {
  name: string;
  email: string;
  phone: string;
  bio: string;
  headline: string;
  location: string;
  image: string;
  customLinks: string;
  skills: string;
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
    title: string;
  }[];
}

export async function getProfileForResume(): Promise<{ success: boolean; data?: ResumeData; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Not authenticated' };
    }

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

    if (!user) {
      return { success: false, error: 'User profile not found' };
    }

    return {
      success: true,
      data: {
        name: user.name ?? '',
        email: user.email ?? '',
        phone: '', // schema does not contain phone
        bio: user.bio ?? '',
        headline: user.headline ?? '',
        location: user.location ?? '',
        image: user.image ?? '',
        customLinks: user.customLinks ?? '',
        skills: user.skills ?? '',
        experience: (user.experience ?? []).map(exp => ({
          id: exp.id,
          position: exp.position ?? '',
          company: exp.company ?? '',
          startDate: exp.startDate ?? '',
          endDate: exp.endDate ?? null,
          description: exp.description ?? null
        })),
        education: (user.education ?? []).map(edu => ({
          id: edu.id,
          school: edu.school ?? '',
          degree: edu.degree ?? '',
          fieldOfStudy: edu.fieldOfStudy ?? null,
          startDate: edu.startDate ?? null,
          endDate: edu.endDate ?? null,
          description: edu.description ?? null
        })),
        projects: (user.projects ?? []).map(proj => ({
          id: proj.id,
          title: proj.title ?? '',
          description: proj.description ?? null,
          link: proj.link ?? null,
          imageUrl: proj.imageUrl ?? null
        })),
        interviews: (user.interviews ?? []).map(intv => ({
          id: intv.id,
          role: intv.role ?? '',
          score: intv.score ?? 0,
          feedback: intv.feedback ?? null
        })),
        assessments: (user.assessments ?? []).map(asmt => ({
          id: asmt.id,
          score: asmt.score ?? 0,
          status: asmt.status ?? 'PENDING',
          title: asmt.assessment?.title ?? 'Assessment'
        })),
      }
    };
  } catch (err: any) {
    console.error('[resumeExport] getProfileForResume failed:', err);
    return { success: false, error: 'Failed to generate professional resume content. Please try again.' };
  }
}
