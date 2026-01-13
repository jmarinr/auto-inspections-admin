import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Inspection } from '../data/mockData';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const generateInspectionPDF = (inspection: Inspection) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header
  doc.setFillColor(236, 72, 153);
  doc.rect(0, 0, pageWidth, 30, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('HK Inspect', 14, 18);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Reporte de Inspección Vehicular', 14, 25);
  
  doc.setFontSize(12);
  doc.text(inspection.id, pageWidth - 14, 18, { align: 'right' });
  
  // Reset color
  doc.setTextColor(0, 0, 0);
  
  // Status Badge
  let y = 40;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Estado: ${inspection.status}`, 14, y);
  doc.text(`Fecha: ${format(new Date(inspection.createdAt), "d MMM yyyy, HH:mm", { locale: es })}`, pageWidth - 14, y, { align: 'right' });
  
  // Client Info Section
  y = 55;
  doc.setFillColor(245, 245, 245);
  doc.rect(14, y - 5, pageWidth - 28, 40, 'F');
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Información del Cliente', 18, y + 3);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  y += 12;
  doc.text(`Nombre: ${inspection.clientName}`, 18, y);
  doc.text(`ID: ${inspection.clientId}`, 110, y);
  y += 8;
  doc.text(`Teléfono: ${inspection.clientPhone}`, 18, y);
  doc.text(`Email: ${inspection.clientEmail}`, 110, y);
  
  // Vehicle Info Section
  y = 105;
  doc.setFillColor(245, 245, 245);
  doc.rect(14, y - 5, pageWidth - 28, 48, 'F');
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Datos del Vehículo', 18, y + 3);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  y += 12;
  doc.text(`VIN: ${inspection.vehicle.vin}`, 18, y);
  doc.text(`Placa: ${inspection.vehicle.plate}`, 110, y);
  y += 8;
  doc.text(`Marca/Modelo: ${inspection.vehicle.brand} ${inspection.vehicle.model}`, 18, y);
  doc.text(`Año: ${inspection.vehicle.year}`, 110, y);
  y += 8;
  doc.text(`Color: ${inspection.vehicle.color}`, 18, y);
  doc.text(`Kilometraje: ${inspection.vehicle.mileage.toLocaleString()} km`, 110, y);
  y += 8;
  doc.text(`Uso: ${inspection.vehicle.usage}`, 18, y);
  
  // Scores Section
  y = 165;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Evaluación de Riesgo', 18, y);
  
  y += 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  // Risk Score Bar
  doc.text(`Risk Score: ${inspection.riskScore}/100`, 18, y);
  doc.setDrawColor(200, 200, 200);
  doc.setFillColor(200, 200, 200);
  doc.rect(80, y - 4, 60, 6, 'F');
  
  const riskColor = inspection.riskScore > 70 ? [239, 68, 68] : inspection.riskScore > 50 ? [245, 158, 11] : [16, 185, 129];
  doc.setFillColor(riskColor[0], riskColor[1], riskColor[2]);
  doc.rect(80, y - 4, (inspection.riskScore / 100) * 60, 6, 'F');
  
  y += 10;
  // Quality Score Bar
  doc.text(`Quality Score: ${inspection.qualityScore}/100`, 18, y);
  doc.setFillColor(200, 200, 200);
  doc.rect(80, y - 4, 60, 6, 'F');
  doc.setFillColor(16, 185, 129);
  doc.rect(80, y - 4, (inspection.qualityScore / 100) * 60, 6, 'F');
  
  // Damages Table
  if (inspection.damages.length > 0) {
    y += 20;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Daños Detectados por IA', 18, y);
    
    autoTable(doc, {
      startY: y + 5,
      head: [['#', 'Parte', 'Tipo', 'Severidad', 'Confianza IA']],
      body: inspection.damages.map((d, i) => [
        (i + 1).toString(),
        d.part,
        d.type,
        d.severity,
        `${d.confidence}%`,
      ]),
      theme: 'striped',
      headStyles: { fillColor: [236, 72, 153] },
      styles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 10 },
        3: { cellWidth: 25 },
        4: { cellWidth: 25 },
      },
    });
    
    y = (doc as any).lastAutoTable.finalY + 10;
  } else {
    y += 20;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.text('No se detectaron daños en el vehículo.', 18, y);
  }
  
  // Client Comments
  if (inspection.clientComments) {
    y += 10;
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Comentarios del Cliente', 18, y);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    y += 8;
    const lines = doc.splitTextToSize(inspection.clientComments, pageWidth - 36);
    doc.text(lines, 18, y);
  }
  
  // Review Notes
  if (inspection.reviewNotes) {
    y += 25;
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Notas de Revisión', 18, y);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    y += 8;
    const lines = doc.splitTextToSize(inspection.reviewNotes, pageWidth - 36);
    doc.text(lines, 18, y);
  }
  
  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Generado por HK Inspect | HenkanCX | Página ${i} de ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }
  
  return doc;
};

export const downloadPDF = (inspection: Inspection) => {
  const doc = generateInspectionPDF(inspection);
  doc.save(`${inspection.id}.pdf`);
};
