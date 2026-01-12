// js/report.js
// Handles generating a PDF of the current dashboard using html2pdf.js

(function(){
  function formatFilename() {
    const d = new Date();
    const ts = d.toISOString().slice(0,19).replace(/[:T]/g, '_');
    return `Lumina_Report_${ts}.pdf`;
  }

  async function generateReport() {
    const btn = document.getElementById('generate-report');
    const overlay = document.getElementById('loading-overlay');
    if (!btn) return;
    btn.disabled = true;
    if (overlay) overlay.style.display = 'flex';

    try {
      // Element to export: main content (remove sidebar to keep PDF focused)
      const element = document.querySelector('.main-content');
      if (!element) throw new Error('Contenu principal introuvable');

      const opt = {
        margin:       10, // mm
        filename:     formatFilename(),
        image:        { type: 'jpeg', quality: 0.95 },
        html2canvas:  { scale: 2, useCORS: true, allowTaint: true, logging: false },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' }
      };

      // Wait for html2pdf to finish saving
      await html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error('Erreur génération PDF:', err);
      alert('Erreur lors de la génération du PDF: ' + (err.message || err));
    } finally {
      if (overlay) overlay.style.display = 'none';
      if (btn) btn.disabled = false;
    }
  }

  document.addEventListener('DOMContentLoaded', function(){
    const btn = document.getElementById('generate-report');
    if (btn) btn.addEventListener('click', generateReport);
  });
})();
