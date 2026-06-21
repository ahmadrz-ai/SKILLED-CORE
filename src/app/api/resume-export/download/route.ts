import { renderToStream } from '@react-pdf/renderer';
import { SkilledCoreResumeTemplate } from '@/components/resume/SkilledCoreResumeTemplate';
import { NextResponse } from 'next/server';
import { guardAiRoute } from '@/lib/apiGuard';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    // V3: require auth + rate limit — PDF rendering is CPU-heavy; don't leave it open.
    const guard = await guardAiRoute('resume-download', 20, 60);
    if (guard instanceof Response) return guard;

    const { resumeData } = await req.json();

    if (!resumeData) {
      return NextResponse.json({ error: 'Missing resumeData payload' }, { status: 400 });
    }

    // Render the React PDF element into a Node readable stream
    const stream = await renderToStream(
      SkilledCoreResumeTemplate({ data: resumeData })
    );

    // V3: strip everything but safe chars to prevent Content-Disposition header injection.
    const safeFilename = (resumeData.name ? String(resumeData.name) : 'SkilledCore_Resume').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80) || 'SkilledCore_Resume';

    return new Response(stream as unknown as ReadableStream, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${safeFilename}_SkilledCore_Resume.pdf"`,
      },
    });
  } catch (error: any) {
    console.error('[Resume Download] PDF compilation failed:', error);
    return NextResponse.json({ error: 'PDF generation failed', details: error.message }, { status: 500 });
  }
}
