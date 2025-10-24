import type { PairingResponse } from '../types';
import { PrintableView } from '../components/PrintableView';
import React from 'react';
import ReactDOM from 'react-dom/client';
// @ts-ignore
import jsPDF from 'jspdf';
// @ts-ignore
import html2canvas from 'html2canvas';


const triggerDownload = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const sanitizeForFileName = (name: string) => {
    return name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}

export const downloadPDF = async (data: PairingResponse) => {
    const reportElement = document.createElement('div');
    reportElement.style.position = 'fixed';
    reportElement.style.left = '-9999px'; // Render off-screen
    reportElement.style.width = '800px'; // A reasonable width for rendering
    document.body.appendChild(reportElement);

    const root = ReactDOM.createRoot(reportElement);
    root.render(React.createElement(PrintableView, { data }));

    // Allow time for images to load
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const canvas = await html2canvas(reportElement, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        backgroundColor: '#ffffff'
    });
    
    document.body.removeChild(reportElement);

    const imgData = canvas.toDataURL('image/png');
    
    // A4 dimensions in points: 595.28 x 841.89
    const pdf = new jsPDF({
        orientation: 'p',
        unit: 'px',
        format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const canvasAspectRatio = canvasWidth / canvasHeight;
    const pdfAspectRatio = pdfWidth / pdfHeight;

    let finalWidth, finalHeight;
    // Fit by width
    finalWidth = pdfWidth;
    finalHeight = pdfWidth / canvasAspectRatio;

    // If the content is too long, it might need to be split across pages, but for a one-pager, we'll scale it to fit.
    if(finalHeight > pdfHeight) {
        finalHeight = pdfHeight;
        finalWidth = pdfHeight * canvasAspectRatio;
    }


    pdf.addImage(imgData, 'PNG', 0, 0, finalWidth, finalHeight);
    const fileName = `pairing_report_${sanitizeForFileName(data.coffee.name)}.pdf`;
    pdf.save(fileName);
};


export const downloadJSON = (data: PairingResponse) => {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const fileName = `pairing_report_${sanitizeForFileName(data.coffee.name)}.json`;
  triggerDownload(blob, fileName);
};

const escapeCsvCell = (cellData: any): string => {
    const stringData = String(cellData ?? '');
    if (stringData.includes(',') || stringData.includes('"') || stringData.includes('\n')) {
        return `"${stringData.replace(/"/g, '""')}"`;
    }
    return stringData;
};


export const downloadCSV = (data: PairingResponse) => {
  const headers = [
    'Rank', 'CoffeeName', 'PastryName', 'Score',
    'ScoreFlavor', 'ScoreTexture', 'ScorePopularity', 'ScoreSeason',
    'MarketingTagline', 'Badges', 'FlavorTags', 'AllergenInfo',
    'Fact1_Summary', 'Fact1_Source', 'Fact2_Summary', 'Fact2_Source',
    'ReasoningFlavor', 'ReasoningTexture', 'ReasoningPopularity', 'ReasoningSeason'
  ];

  let csvContent = headers.map(escapeCsvCell).join(',') + '\r\n';

  data.pairs.forEach((pair, index) => {
    const row = [
        index + 1,
        data.coffee.name,
        pair.pastry.name,
        pair.score,
        pair.score_breakdown.flavor,
        pair.score_breakdown.texture,
        pair.score_breakdown.popularity,
        pair.score_breakdown.season,
        pair.why_marketing,
        pair.badges.join('; '),
        pair.flavor_tags_standardized.join('; '),
        pair.allergen_info,
        pair.facts[0]?.summary,
        pair.facts[0]?.source_url,
        pair.facts[1]?.summary,
        pair.facts[1]?.source_url,
        pair.reasoning.flavor,
        pair.reasoning.texture,
        pair.reasoning.popularity,
        pair.reasoning.season
    ];
    csvContent += row.map(escapeCsvCell).join(',') + '\r\n';
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const fileName = `pairing_report_${sanitizeForFileName(data.coffee.name)}.csv`;
  triggerDownload(blob, fileName);
};

const generateHTMLContent = (data: PairingResponse): string => {
    const styles = `
        :root {
            --brand-primary: #4a2c2a;
            --brand-secondary: #eaddc7;
            --brand-accent: #a27b5c;
            --brand-text: #333;
            --brand-bg: #fdfaf6;
        }
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
        body { font-family: 'Inter', sans-serif; background-color: var(--brand-bg); color: var(--brand-text); margin: 0; padding: 2rem; }
        .container { max-width: 800px; margin: auto; background: white; border-radius: 12px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05); padding: 2.5rem; }
        header { border-bottom: 1px solid #e2e8f0; padding-bottom: 1.5rem; margin-bottom: 1.5rem; text-align: center; }
        h1 { font-size: 2.5rem; font-weight: 700; margin: 0; color: var(--brand-primary); }
        h2 { font-size: 1.75rem; font-weight: 700; color: var(--brand-primary); }
        .pairing-card { display: grid; grid-template-columns: 200px 1fr; gap: 2rem; margin-bottom: 2.5rem; align-items: start; padding-bottom: 2.5rem; border-bottom: 1px solid #e2e8f0;}
        .pairing-card:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
        img { width: 100%; border-radius: 8px; object-fit: cover; aspect-ratio: 1/1; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .tag { display: inline-block; background-color: var(--brand-secondary); color: var(--brand-primary); font-size: 0.75rem; font-weight: 600; padding: 0.35rem 0.85rem; border-radius: 9999px; margin-right: 0.5rem; margin-bottom: 0.5rem; }
        .allergen { background-color: #fbe9e7; color: #c62828; }
        ul { list-style-position: inside; padding-left: 0; margin-top: 1rem; }
        li { margin-bottom: 0.75rem; line-height: 1.6; }
        li::marker { color: var(--brand-accent); }
        a { color: var(--brand-accent); text-decoration: none; font-weight: 600; }
        a:hover { text-decoration: underline; }
        footer { margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #e2e8f0; text-align: center; font-size: 0.875rem; color: #9ca3af; }
    `;

    const pairingsHtml = data.pairs.map((pair, index) => `
        <div class="pairing-card">
            <div>
                <img src="${pair.pastry.image}" alt="${pair.pastry.name}" />
            </div>
            <div>
                <h2 style="margin-top:0;"><span style="color: #9ca3af;">#${index + 1}</span> ${pair.pastry.name}</h2>
                <p style="font-style: italic; color: #718096; margin-top: -0.5rem; margin-bottom: 1.5rem; font-size: 1.1rem; border-left: 3px solid var(--brand-accent); padding-left: 1rem;">"${pair.why_marketing}"</p>
                <div>
                    ${pair.flavor_tags_standardized.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    ${pair.allergen_info ? `<span class="tag allergen">${pair.allergen_info}</span>` : ''}
                </div>
                <div style="margin-top: 1.5rem; font-size: 0.95rem; line-height: 1.6;">
                    <p><strong>Flavor Synergy:</strong> ${pair.reasoning.flavor}</p>
                    <p><strong>Texture Balance:</strong> ${pair.reasoning.texture}</p>
                </div>
                ${pair.facts.length > 0 ? `
                <div style="margin-top: 1.5rem; border-top: 1px solid #f3f4f6; padding-top: 1.5rem;">
                    <h4 style="margin:0 0 0.5rem 0; font-weight: 600;">Supporting Facts:</h4>
                    <ul>
                        ${pair.facts.map(fact => `
                            <li>${fact.summary} <a href="${fact.source_url}" target="_blank">[source]</a></li>
                        `).join('')}
                    </ul>
                </div>` : ''}
            </div>
        </div>
    `).join('');

    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Pairing Report for ${data.coffee.name}</title>
            <style>${styles}</style>
        </head>
        <body>
            <div class="container">
                <header>
                    <h1>Pairing Report</h1>
                    <p style="font-size: 1.25rem; color: #718096;">Top Recommendations for <strong>${data.coffee.name}</strong></p>
                </header>
                <main>
                    ${pairingsHtml}
                </main>
                <footer>
                    <p>Generated by Café Owner AI Dashboard | Powered by Gemini</p>
                </footer>
            </div>
        </body>
        </html>
    `;
};


export const downloadHTML = (data: PairingResponse) => {
    const htmlContent = generateHTMLContent(data);
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const fileName = `pairing_report_${sanitizeForFileName(data.coffee.name)}.html`;
    triggerDownload(blob, fileName);
};