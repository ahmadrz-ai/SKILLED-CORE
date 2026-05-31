import { renderToStream } from '@react-pdf/renderer';
import { SkilledCoreResumeTemplate } from '@/components/resume/SkilledCoreResumeTemplate';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { resumeData } = await req.json();

    if (!resumeData) {
      return NextResponse.json({ error: 'Missing resumeData payload' }, { status: 400 });
    }

    // Render the React PDF element into a Node readable stream
    const stream = await renderToStream(
      SkilledCoreResumeTemplate({ data: resumeData })
    );

    const safeFilename = resumeData.name ? resumeData.name.replace(/\s+/g, '_') : 'SkilledCore_Resume';

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
