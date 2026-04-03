import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generatePOPDF = (po) => {
    const doc = new jsPDF();

    // --- Header ---
    doc.setFontSize(22);
    doc.setTextColor(184, 134, 11); // Gold/Bronze color (#B8860B)
    doc.text('KG INFRA - PURCHASE ORDER', 105, 20, { align: 'center' });

    // --- Status Badge ---
    const status = po.deliveryStatus || 'PENDING';
    doc.setFontSize(10);
    doc.setFillColor(
        status === 'DELIVERED' ? 220 : status === 'IN_TRANSIT' ? 220 : 255, 
        status === 'DELIVERED' ? 252 : status === 'IN_TRANSIT' ? 240 : 248, 
        status === 'DELIVERED' ? 231 : status === 'IN_TRANSIT' ? 255 : 232
    );
    doc.setDrawColor(status === 'DELIVERED' ? 16 : status === 'IN_TRANSIT' ? 37 : 194);
    // Rough estimation for badge background
    doc.rect(160, 25, 35, 8, 'F');
    doc.setTextColor(status === 'DELIVERED' ? 21 : status === 'IN_TRANSIT' ? 30 : 154, status === 'DELIVERED' ? 128 : status === 'IN_TRANSIT' ? 64 : 52, status === 'DELIVERED' ? 61 : status === 'IN_TRANSIT' ? 175 : 18);
    doc.text(status, 177.5, 30.5, { align: 'center' });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(`PO Number: ${po.poNumber}`, 14, 40);
    doc.setFont(undefined, 'normal');
    doc.text(`Date: ${new Date(po.date).toLocaleDateString()}`, 14, 47);

    // --- Party Details & Warehouse ---
    doc.setFont(undefined, 'bold');
    doc.text('Party Details:', 14, 60);
    doc.setFont(undefined, 'normal');
    doc.text(`Name: ${po.party.name}`, 14, 67);
    doc.text(`Phone: ${po.party.phone || 'N/A'}`, 14, 74);
    doc.text(`Address: ${po.party.address || 'N/A'}`, 14, 81);
    doc.text(`Email: ${po.party.email || 'N/A'}`, 14, 88);

    doc.setFont(undefined, 'bold');
    doc.text('Delivery Location:', 120, 60);
    doc.setFont(undefined, 'normal');
    doc.text(`Warehouse: ${po.warehouse?.name || 'N/A'}`, 120, 67);
    doc.text(`Location: ${po.warehouse?.location || 'N/A'}`, 120, 74);

    // --- Items Table ---
    const tableData = po.items.map((item, index) => [
        index + 1,
        item.productName || item.product?.name || 'N/A',
        item.quantity,
        item.receivedQuantity || 0,
        item.quantity - (item.receivedQuantity || 0),
        item.unitPrice ? `INR ${item.unitPrice}` : '—',
        item.amount ? `INR ${item.amount}` : '—'
    ]);

    autoTable(doc, {
        startY: 95,
        head: [['#', 'Item Name', 'Ordered', 'Recv', 'Pend', 'UP', 'Total']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [184, 134, 11], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 2 },
        columnStyles: {
            0: { cellWidth: 8 },
            2: { halign: 'center' },
            3: { halign: 'center', textColor: [0, 150, 0] },
            4: { halign: 'center', textColor: [150, 0, 0] },
            5: { halign: 'right', cellWidth: 25 },
            6: { halign: 'right', cellWidth: 25 }
        },
        margin: { top: 10 }
    });

    // --- Totals ---
    let finalY = (doc.lastAutoTable ? doc.lastAutoTable.finalY : 95) + 10;
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text(`Total Order Qty: ${po.totals.totalQuantity}`, 130, finalY);
    doc.text(`Total Received: ${po.items.reduce((acc, i) => acc + (i.receivedQuantity || 0), 0)}`, 130, finalY + 6);
    if (po.totals.totalAmount > 0) {
        doc.text(`Grand Total: INR ${po.totals.totalAmount.toLocaleString()}`, 130, finalY + 12);
    }

    // --- Delivery Timeline & History ---
    finalY += 25;
    if (finalY > 260) { doc.addPage(); finalY = 20; }
    
    doc.setFontSize(12);
    doc.setTextColor(184, 134, 11);
    doc.text('DELIVERY TRACKING & HISTORY', 14, finalY);
    doc.setDrawColor(184, 134, 11);
    doc.line(14, finalY + 2, 85, finalY + 2);

    doc.setFontSize(9);
    doc.setTextColor(0);
    doc.setFont(undefined, 'bold');
    doc.text('Status Timeline:', 14, finalY + 10);
    doc.setFont(undefined, 'normal');
    doc.text(`• Order Placed: ${new Date(po.createdAt).toLocaleString()}`, 18, finalY + 16);
    if (po.deliveryStatus !== 'PENDING') {
        doc.text(`• Marked In-Transit: ${new Date(po.updatedAt).toLocaleString()}`, 18, finalY + 22);
    }

    if (po.partialDeliveries?.length > 0) {
        doc.setFont(undefined, 'bold');
        doc.text('Partial Shipments Received:', 14, finalY + 32);
        
        const deliveryHistory = po.partialDeliveries.map((d, i) => [
            `Shipment #${i + 1}`,
            new Date(d.deliveredAt).toLocaleString(),
            d.performedBy?.name || 'Admin',
            `${d.items.reduce((acc, item) => acc + item.quantity, 0)} Units`
        ]);

        autoTable(doc, {
            startY: finalY + 36,
            head: [['ID', 'Date & Time', 'Received By', 'Qty Added']],
            body: deliveryHistory,
            theme: 'plain',
            headStyles: { fontStyle: 'bold', textColor: 100 },
            styles: { fontSize: 8, cellPadding: 2 },
            margin: { left: 18 }
        });
    }

    // --- Footer ---
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.setTextColor(150);
        doc.text('This is a computer generated document.', 105, 285, { align: 'center' });
        doc.setFont(undefined, 'bold');
        doc.setTextColor(184, 134, 11);
        doc.text('Generated by Tender Management System', 105, 292, { align: 'center' });
    }

    doc.save(`${po.poNumber}.pdf`);
};
