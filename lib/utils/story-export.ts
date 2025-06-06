import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';
import { Story } from '@/types';
import { GuestStory } from '@/app/story/guest/hooks/useGuestStory';

export type ExportableStory = Story | GuestStory;

// Format story content for export
export function formatStoryContent(story: ExportableStory): string {
  return story.segments.map((segment) => segment.content).join('\n\n');
}

// Export as plain text
export function exportAsText(story: ExportableStory): void {
  const content = `${story.title}\n${'='.repeat(
    story.title.length
  )}\n\nCreated: ${new Date(
    story.createdAt
  ).toLocaleDateString()}\nWord Count: ${
    story.totalWordCount
  } words\n\n${formatStoryContent(story)}`;

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  saveAs(blob, `${story.title}.txt`);
}

// Export as PDF
export function exportAsPDF(story: ExportableStory): void {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 20;
  const maxLineWidth = pageWidth - 2 * margin;

  let yPosition = 30;

  // Title
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  const titleLines = pdf.splitTextToSize(story.title, maxLineWidth);
  pdf.text(titleLines, margin, yPosition);
  yPosition += titleLines.length * 10 + 10;

  // Metadata
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(
    `Created: ${new Date(story.createdAt).toLocaleDateString()}`,
    margin,
    yPosition
  );
  yPosition += 15;
  pdf.text(`Word Count: ${story.totalWordCount} words`, margin, yPosition);
  yPosition += 20;

  // Story content
  pdf.setFontSize(12);
  const storyContent = formatStoryContent(story);
  const contentLines = pdf.splitTextToSize(storyContent, maxLineWidth);

  for (let i = 0; i < contentLines.length; i++) {
    if (yPosition > pdf.internal.pageSize.getHeight() - 30) {
      pdf.addPage();
      yPosition = 30;
    }
    pdf.text(contentLines[i], margin, yPosition);
    yPosition += 7;
  }

  pdf.save(`${story.title}.pdf`);
}

// Export as Word document
export async function exportAsWord(story: ExportableStory): Promise<void> {
  const storyContent = formatStoryContent(story);

  // Split content into paragraphs
  const paragraphs = storyContent.split('\n\n').filter((p) => p.trim());

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Title
          new Paragraph({
            text: story.title,
            heading: HeadingLevel.TITLE,
            spacing: {
              after: 400,
            },
          }),

          // Metadata
          new Paragraph({
            children: [
              new TextRun({
                text: `Created: ${new Date(
                  story.createdAt
                ).toLocaleDateString()}`,
                italics: true,
              }),
            ],
            spacing: {
              after: 200,
            },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `Word Count: ${story.totalWordCount} words`,
                italics: true,
              }),
            ],
            spacing: {
              after: 400,
            },
          }),

          // Story content paragraphs
          ...paragraphs.map(
            (paragraph) =>
              new Paragraph({
                children: [
                  new TextRun({
                    text: paragraph,
                  }),
                ],
                spacing: {
                  after: 200,
                },
              })
          ),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${story.title}.docx`);
}

// Export with segments separated (for detailed view)
export function exportAsTextWithSegments(story: ExportableStory): void {
  let content = `${story.title}\n${'='.repeat(story.title.length)}\n\n`;
  content += `Created: ${new Date(story.createdAt).toLocaleDateString()}\n`;
  content += `Word Count: ${story.totalWordCount} words\n`;
  content += `Segments: ${story.segments.length}\n\n`;

  story.segments.forEach((segment, index) => {
    content += `--- Segment ${index + 1} ---\n`;
    if (segment.userPrompt) {
      content += `Prompt: ${segment.userPrompt}\n`;
    }
    content += `Words: ${segment.wordCount}\n`;
    content += `Created: ${new Date(
      segment.createdAt
    ).toLocaleDateString()}\n\n`;
    content += `${segment.content}\n\n`;
  });

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  saveAs(blob, `${story.title}_detailed.txt`);
}
