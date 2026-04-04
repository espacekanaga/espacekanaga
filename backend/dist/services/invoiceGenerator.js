"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceGenerator = void 0;
const pdfkit_1 = __importDefault(require("pdfkit"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
class InvoiceGenerator {
    static DEFAULTS = {
        companyName: 'ESPACE KANAGA',
        companyTagline: 'Pressing & Couture',
        companyEmail: 'espacekanaga@gmail.com',
        stampColor: '#2563eb', // Blue color instead of red
    };
    static generateInvoicePDF(data) {
        const doc = new pdfkit_1.default({ size: 'A4', margin: 50 });
        const filename = `facture-${data.numero}-${Date.now()}.pdf`;
        const filepath = path_1.default.join(process.cwd(), 'public', 'invoices', filename);
        const publicUrl = `/invoices/${filename}`;
        const dir = path_1.default.dirname(filepath);
        if (!fs_1.default.existsSync(dir)) {
            fs_1.default.mkdirSync(dir, { recursive: true });
        }
        const stream = fs_1.default.createWriteStream(filepath);
        doc.pipe(stream);
        const company = {
            name: data.config?.company?.name?.trim() || this.DEFAULTS.companyName,
            tagline: data.config?.company?.tagline?.trim() || this.DEFAULTS.companyTagline,
            address: data.config?.company?.address?.trim() || '',
            phone: data.config?.company?.phone?.trim() || '',
            email: data.config?.company?.email?.trim() || this.DEFAULTS.companyEmail,
            nif: data.config?.company?.nif?.trim() || '',
            rccm: data.config?.company?.rccm?.trim() || '',
        };
        const stampColor = data.config?.stamp?.color?.trim() || this.DEFAULTS.stampColor;
        const stampLines = data.config?.stamp?.lines?.filter((l) => l && l.trim().length).map((l) => l.trim()) ||
            [company.name, company.tagline.toUpperCase(), 'VALIDÉ'];
        const stampEnabled = data.config?.stamp?.enabled !== false;
        const footer = {
            line1: data.config?.footer?.line1?.trim() ||
                'Document généré numériquement - Cachet et signature électroniques certifiés',
            line2: data.config?.footer?.line2?.trim() || '',
        };
        const pageLeft = doc.page.margins.left;
        const pageRight = doc.page.width - doc.page.margins.right;
        const contentWidth = pageRight - pageLeft;
        const top = doc.page.margins.top;
        // Header
        const headerY = top;
        doc.font('Helvetica-Bold').fontSize(22).fillColor('#0b1220').text(company.name, pageLeft, headerY);
        doc.font('Helvetica').fontSize(11).fillColor('#111827').text(company.tagline, pageLeft, headerY + 28);
        doc.font('Helvetica').fontSize(9).fillColor('#334155');
        const companyLines = [];
        if (company.address)
            companyLines.push(company.address);
        if (company.phone)
            companyLines.push(`Tél: ${company.phone}`);
        if (company.email)
            companyLines.push(`Email: ${company.email}`);
        const legal = [company.nif ? `NIF: ${company.nif}` : '', company.rccm ? `RCCM: ${company.rccm}` : '']
            .filter(Boolean)
            .join(' • ');
        if (legal)
            companyLines.push(legal);
        companyLines.forEach((line, idx) => {
            doc.text(line, pageLeft, headerY + 46 + idx * 12);
        });
        // Invoice meta box (right)
        const metaW = 210;
        const metaX = pageRight - metaW;
        const metaY = headerY + 2;
        doc.roundedRect(metaX, metaY, metaW, 86, 8).fill('#f1f5f9');
        doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(14).text('FACTURE', metaX, metaY + 10, {
            width: metaW,
            align: 'center',
        });
        doc.font('Helvetica').fontSize(9).fillColor('#0f172a');
        const metaLines = [
            ['N°', data.numero],
            ['Date', data.date.toLocaleDateString('fr-FR')],
            ['Commande', `#${data.order.id.slice(-6)}`],
        ];
        let metaLineY = metaY + 34;
        metaLines.forEach(([k, v]) => {
            doc.fillColor('#475569').text(`${k}:`, metaX + 12, metaLineY, { width: 60 });
            doc.fillColor('#0f172a').font('Helvetica-Bold').text(v, metaX + 54, metaLineY, { width: metaW - 66 });
            doc.font('Helvetica');
            metaLineY += 14;
        });
        const afterHeaderY = Math.max(headerY + 46 + companyLines.length * 12, metaY + 86) + 14;
        doc.moveTo(pageLeft, afterHeaderY).lineTo(pageRight, afterHeaderY).strokeColor('#e2e8f0').lineWidth(1).stroke();
        // Client block
        const clientY = afterHeaderY + 16;
        doc.font('Helvetica-Bold').fontSize(11).fillColor('#0f172a').text('FACTURER À', pageLeft, clientY);
        doc.font('Helvetica').fontSize(10).fillColor('#0f172a').text(`${data.client.prenom} ${data.client.nom}`, pageLeft, clientY + 18);
        const clientLines = [`Tél: ${data.client.telephone}`];
        if (data.client.email)
            clientLines.push(`Email: ${data.client.email}`);
        if (data.client.adresse)
            clientLines.push(`Adresse: ${data.client.adresse}`);
        doc.font('Helvetica').fontSize(9).fillColor('#334155');
        clientLines.forEach((line, idx) => doc.text(line, pageLeft, clientY + 36 + idx * 12));
        const tableTop = clientY + 36 + clientLines.length * 12 + 22;
        const colDescW = Math.floor(contentWidth * 0.55);
        const colQtyW = 50;
        const colUnitW = 90;
        const colTotalW = contentWidth - colDescW - colQtyW - colUnitW;
        const xDesc = pageLeft;
        const xQty = xDesc + colDescW;
        const xUnit = xQty + colQtyW;
        const xTotal = xUnit + colUnitW;
        const drawTableHeader = (y) => {
            doc.roundedRect(pageLeft, y, contentWidth, 24, 6).fill('#eaf2ff');
            doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(9);
            doc.text('Description', xDesc + 10, y + 7, { width: colDescW - 10 });
            doc.text('Qté', xQty, y + 7, { width: colQtyW, align: 'center' });
            doc.text('Prix U.', xUnit, y + 7, { width: colUnitW - 6, align: 'right' });
            doc.text('Montant', xTotal, y + 7, { width: colTotalW - 10, align: 'right' });
            doc.font('Helvetica').fillColor('#0f172a');
        };
        drawTableHeader(tableTop);
        let rowY = tableTop + 28;
        doc.font('Helvetica').fontSize(9).fillColor('#0f172a');
        const bottomReserved = 170; // totals + cachet/signature + footer
        data.lignes.forEach((ligne, idx) => {
            const descHeight = doc.heightOfString(ligne.description, { width: colDescW - 16 });
            const rowH = Math.max(18, Math.ceil(descHeight)) + 8;
            if (rowY + rowH > doc.page.height - doc.page.margins.bottom - bottomReserved) {
                doc.addPage();
                rowY = top;
                drawTableHeader(rowY);
                rowY += 28;
            }
            if (idx % 2 === 0) {
                doc.rect(pageLeft, rowY - 2, contentWidth, rowH).fill('#f8fafc');
                doc.fillColor('#0f172a');
            }
            doc.text(ligne.description, xDesc + 10, rowY + 4, { width: colDescW - 16 });
            doc.text(String(ligne.quantite), xQty, rowY + 4, { width: colQtyW, align: 'center' });
            doc.text(this.formatMoney(ligne.prixUnitaire), xUnit, rowY + 4, { width: colUnitW - 6, align: 'right' });
            doc.text(this.formatMoney(ligne.montant), xTotal, rowY + 4, { width: colTotalW - 10, align: 'right' });
            rowY += rowH;
        });
        // Totals box
        const totalsY = rowY + 14;
        const totalsW = 230;
        const totalsX = pageRight - totalsW;
        const totalsH = 78;
        if (totalsY + totalsH > doc.page.height - doc.page.margins.bottom - bottomReserved + 70) {
            doc.addPage();
            rowY = top;
        }
        doc.roundedRect(totalsX, totalsY, totalsW, totalsH, 8).fill('#f1f5f9');
        doc.font('Helvetica').fontSize(9).fillColor('#334155');
        doc.text('Montant HT', totalsX + 12, totalsY + 12);
        doc.text(this.formatMoney(data.montantHT), totalsX, totalsY + 12, { width: totalsW - 12, align: 'right' });
        doc.text(`TVA (${data.tauxTVA}%)`, totalsX + 12, totalsY + 30);
        doc.text(this.formatMoney(data.montantTVA), totalsX, totalsY + 30, { width: totalsW - 12, align: 'right' });
        doc.font('Helvetica-Bold').fontSize(11).fillColor('#0f172a');
        doc.text('TOTAL TTC', totalsX + 12, totalsY + 52);
        doc.text(this.formatMoney(data.montantTTC), totalsX, totalsY + 52, { width: totalsW - 12, align: 'right' });
        // Notes
        const notes = data.notes?.trim();
        if (notes) {
            const notesX = pageLeft;
            const notesY = totalsY;
            const notesW = totalsX - pageLeft - 12;
            const notesTitleH = 14;
            const notesBodyH = Math.min(70, Math.ceil(doc.heightOfString(notes, { width: notesW - 20 })));
            const notesH = notesTitleH + notesBodyH + 14;
            doc.roundedRect(notesX, notesY, notesW, notesH, 8).fill('#ffffff');
            doc.roundedRect(notesX, notesY, notesW, notesH, 8).strokeColor('#e2e8f0').lineWidth(1).stroke();
            doc.font('Helvetica-Bold').fontSize(9).fillColor('#0f172a').text('Notes', notesX + 12, notesY + 10);
            doc.font('Helvetica').fontSize(9).fillColor('#334155').text(notes, notesX + 12, notesY + 24, { width: notesW - 24 });
        }
        // Cachet + signature
        const minSealY = totalsY + totalsH + 24;
        const sealY = doc.page.height - doc.page.margins.bottom - 125;
        if (sealY < minSealY) {
            doc.addPage();
        }
        const finalSealY = doc.page.height - doc.page.margins.bottom - 125;
        if (stampEnabled) {
            this.drawDigitalStamp(doc, pageLeft, finalSealY, {
                color: stampColor,
                lines: stampLines,
                date: data.date,
            });
        }
        this.drawDigitalSignature(doc, pageRight - 190, finalSealY + 6, data.createdBy, data.numero);
        // Footer
        const footerY = doc.page.height - doc.page.margins.bottom - 38;
        doc.font('Helvetica').fontSize(8).fillColor('#64748b');
        doc.text(footer.line1, pageLeft, footerY, { width: contentWidth, align: 'center' });
        if (footer.line2) {
            doc.text(footer.line2, pageLeft, footerY + 12, { width: contentWidth, align: 'center' });
        }
        doc.end();
        return new Promise((resolve, reject) => {
            stream.on('finish', () => resolve(publicUrl));
            stream.on('error', reject);
        });
    }
    static drawDigitalStamp(doc, x, y, options) {
        const color = options.color || this.DEFAULTS.stampColor;
        const width = 140;
        const height = 60;
        const cornerRadius = 2;
        doc.save();
        // Draw outer rectangle with border - more rectangular (less rounded)
        doc.roundedRect(x, y, width, height, cornerRadius).strokeColor(color).lineWidth(2).stroke();
        // Draw inner rectangle with less rounding
        doc.roundedRect(x + 3, y + 3, width - 6, height - 6, cornerRadius).strokeColor(color).lineWidth(1).stroke();
        // Draw text lines
        const lines = options.lines.slice(0, 4);
        const fontSize = lines.length >= 4 ? 7 : 8;
        doc.font('Helvetica-Bold').fontSize(fontSize).fillColor(color);
        const lineGap = fontSize + 2;
        let textY = y + 10;
        lines.forEach((line) => {
            doc.text(line, x, textY, { width: width, align: 'center' });
            textY += lineGap;
        });
        // Draw date at the bottom
        doc.font('Helvetica').fontSize(7).fillColor(color);
        doc.text(options.date.toLocaleDateString('fr-FR'), x, y + height - 14, { width: width, align: 'center' });
        doc.restore();
    }
    static drawDigitalSignature(doc, x, y, createdBy, numero) {
        const width = 180;
        doc.save();
        doc.strokeColor('#0f172a').lineWidth(1);
        doc.moveTo(x, y + 32).lineTo(x + width, y + 32).stroke();
        const signerName = createdBy ? `${createdBy.prenom} ${createdBy.nom}` : 'Signature';
        doc.font('Helvetica-Bold').fontSize(10).fillColor('#0f172a');
        doc.text(signerName, x, y + 36, { width, align: 'center' });
        doc.font('Helvetica').fontSize(8).fillColor('#334155');
        doc.text('Signature électronique', x, y + 52, { width, align: 'center' });
        const hash = this.generateCertificationHash(`${numero}:${signerName}`);
        doc.fontSize(6).fillColor('#64748b');
        doc.text(`Cert: ${hash}`, x, y + 66, { width, align: 'center' });
        doc.restore();
    }
    static generateCertificationHash(input) {
        return crypto_1.default.createHash('sha256').update(input).digest('hex').slice(0, 16).toUpperCase();
    }
    static formatMoney(amount) {
        return `${amount.toLocaleString('fr-FR')} FCFA`;
    }
}
exports.InvoiceGenerator = InvoiceGenerator;
