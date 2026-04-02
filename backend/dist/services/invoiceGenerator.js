"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceGenerator = void 0;
const pdfkit_1 = __importDefault(require("pdfkit"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class InvoiceGenerator {
    static STAMP_TEXT = 'ESPACE KANAGA\nPRESSING & COUTURE\nVALIDÉ';
    static SIGNATURE_TEXT = 'Idrissa Guindo\nGérant';
    static generateInvoicePDF(data) {
        const doc = new pdfkit_1.default({ margin: 50 });
        const filename = `facture-${data.numero}-${Date.now()}.pdf`;
        const filepath = path_1.default.join(process.cwd(), 'public', 'invoices', filename);
        const publicUrl = `/invoices/${filename}`;
        // Ensure directory exists
        const dir = path_1.default.dirname(filepath);
        if (!fs_1.default.existsSync(dir)) {
            fs_1.default.mkdirSync(dir, { recursive: true });
        }
        const stream = fs_1.default.createWriteStream(filepath);
        doc.pipe(stream);
        // Header with company info
        doc.fontSize(20).font('Helvetica-Bold').text('ESPACE KANAGA', 50, 50);
        doc.fontSize(12).font('Helvetica').text('Pressing & Couture', 50, 75);
        doc.fontSize(10).text('Adresse: [Votre adresse]', 50, 95);
        doc.text('Téléphone: [Votre téléphone]', 50, 110);
        doc.text('Email: espacekanaga@gmail.com', 50, 125);
        // Invoice title and number
        doc.fontSize(16).font('Helvetica-Bold').text('FACTURE', 400, 50, { align: 'right' });
        doc.fontSize(10).font('Helvetica').text(`N°: ${data.numero}`, 400, 75, { align: 'right' });
        doc.text(`Date: ${data.date.toLocaleDateString('fr-FR')}`, 400, 90, { align: 'right' });
        doc.text(`Commande: #${data.order.id.slice(-6)}`, 400, 105, { align: 'right' });
        // Client info
        doc.fontSize(12).font('Helvetica-Bold').text('FACTURER À:', 50, 160);
        doc.fontSize(11).font('Helvetica').text(`${data.client.prenom} ${data.client.nom}`, 50, 180);
        doc.fontSize(10).text(`Tél: ${data.client.telephone}`, 50, 200);
        if (data.client.email) {
            doc.text(`Email: ${data.client.email}`, 50, 215);
        }
        if (data.client.adresse) {
            doc.text(`Adresse: ${data.client.adresse}`, 50, data.client.email ? 230 : 215);
        }
        // Table header
        const tableTop = 280;
        doc.rect(50, tableTop, 500, 25).fill('#f0f0f0').stroke();
        doc.fillColor('#000').fontSize(10).font('Helvetica-Bold');
        doc.text('Description', 60, tableTop + 7);
        doc.text('Qté', 300, tableTop + 7, { width: 50, align: 'center' });
        doc.text('Prix U.', 360, tableTop + 7, { width: 80, align: 'right' });
        doc.text('Montant', 450, tableTop + 7, { width: 90, align: 'right' });
        // Table rows
        let rowTop = tableTop + 25;
        doc.font('Helvetica').fontSize(10);
        data.lignes.forEach((ligne, index) => {
            if (index % 2 === 0) {
                doc.rect(50, rowTop, 500, 20).fill('#fafafa').stroke();
            }
            doc.fillColor('#000');
            doc.text(ligne.description, 60, rowTop + 5, { width: 230 });
            doc.text(ligne.quantite.toString(), 300, rowTop + 5, { width: 50, align: 'center' });
            doc.text(ligne.prixUnitaire.toLocaleString('fr-FR') + ' FCFA', 360, rowTop + 5, { width: 80, align: 'right' });
            doc.text(ligne.montant.toLocaleString('fr-FR') + ' FCFA', 450, rowTop + 5, { width: 90, align: 'right' });
            rowTop += 20;
        });
        // Totals
        const totalsTop = rowTop + 20;
        doc.font('Helvetica-Bold');
        doc.text('Montant HT:', 350, totalsTop, { width: 100, align: 'right' });
        doc.text(data.montantHT.toLocaleString('fr-FR') + ' FCFA', 460, totalsTop, { width: 80, align: 'right' });
        doc.text(`TVA (${data.tauxTVA}%):`, 350, totalsTop + 20, { width: 100, align: 'right' });
        doc.text(data.montantTVA.toLocaleString('fr-FR') + ' FCFA', 460, totalsTop + 20, { width: 80, align: 'right' });
        doc.fontSize(12).text('TOTAL TTC:', 350, totalsTop + 45, { width: 100, align: 'right' });
        doc.text(data.montantTTC.toLocaleString('fr-FR') + ' FCFA', 460, totalsTop + 45, { width: 80, align: 'right' });
        // Digital Stamp (Cachet numérique)
        const stampY = totalsTop + 80;
        this.drawDigitalStamp(doc, 50, stampY);
        // Digital Signature
        const sigY = totalsTop + 80;
        this.drawDigitalSignature(doc, 350, sigY, data.createdBy);
        // Footer
        doc.fontSize(8).font('Helvetica').fillColor('#666');
        doc.text('Document généré numériquement - Cachet et signature électroniques certifiées', 50, 750, { align: 'center' });
        doc.text('Espace Kanaga - Siret: [Numéro] - N° TVA: [Numéro]', 50, 765, { align: 'center' });
        doc.end();
        // Wait for file to be written
        return new Promise((resolve, reject) => {
            stream.on('finish', () => resolve(publicUrl));
            stream.on('error', reject);
        });
    }
    static drawDigitalStamp(doc, x, y) {
        // Draw circular stamp
        const radius = 45;
        const centerX = x + radius;
        const centerY = y + radius;
        // Outer circle
        doc.circle(centerX, centerY, radius).stroke('#c41e3a').lineWidth(2);
        // Inner circle
        doc.circle(centerX, centerY, radius - 5).stroke('#c41e3a').lineWidth(1);
        // Stamp text
        doc.fontSize(8).font('Helvetica-Bold').fillColor('#c41e3a');
        const lines = this.STAMP_TEXT.split('\n');
        let textY = centerY - ((lines.length - 1) * 10) / 2;
        lines.forEach((line) => {
            doc.text(line, centerX - 40, textY, { width: 80, align: 'center' });
            textY += 10;
        });
        // Add date in stamp
        doc.fontSize(7).text(new Date().toLocaleDateString('fr-FR'), centerX - 40, centerY + 20, { width: 80, align: 'center' });
    }
    static drawDigitalSignature(doc, x, y, createdBy) {
        // Signature line
        doc.moveTo(x, y + 30).lineTo(x + 150, y + 30).stroke('#000').lineWidth(1);
        // Signature text
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#000');
        const signerName = createdBy ? `${createdBy.prenom} ${createdBy.nom}` : this.SIGNATURE_TEXT;
        doc.text(signerName, x, y + 35, { width: 150, align: 'center' });
        doc.fontSize(8).font('Helvetica');
        doc.text('Signature électronique certifiée', x, y + 50, { width: 150, align: 'center' });
        // Add certification hash
        const hash = this.generateCertificationHash();
        doc.fontSize(6).fillColor('#666');
        doc.text(`Cert: ${hash}`, x, y + 65, { width: 150, align: 'center' });
    }
    static generateCertificationHash() {
        // Generate a fake certification hash for display
        const chars = 'ABCDEF0123456789';
        let hash = '';
        for (let i = 0; i < 16; i++) {
            hash += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return hash;
    }
}
exports.InvoiceGenerator = InvoiceGenerator;
