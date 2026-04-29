import React, { useState, useMemo } from 'react';
import { Search, History as HistoryIcon, Download, FileText, ArrowUpRight, ArrowDownLeft, X } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import styles from './History.module.css';

const History: React.FC = () => {
  const { transactions, currentUser } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'import' | 'export'>('all');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportTarget, setExportTarget] = useState<'all' | 'import' | 'export'>('all');

  const filteredTransactions = useMemo(() => {
    let result = transactions.filter(t => 
      t.itemName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      t.itemId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (filter !== 'all') {
      result = result.filter(t => t.type === filter);
    }

    return result;
  }, [transactions, searchTerm, filter]);

  const buildReportHTML = (data: typeof transactions, reportTitle: string) => {
    const dateStr = new Date().toLocaleString('vi-VN');
    const totalQty = data.reduce((sum, t) => sum + t.quantity, 0);

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${reportTitle}</title>
          <style>
            @media print {
              @page { margin: 15mm; size: A4; }
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif; color: #333; padding: 30px; }
            .report-header { text-align: center; margin-bottom: 25px; padding-bottom: 15px; border-bottom: 3px solid #1e40af; }
            .report-header h1 { color: #1e40af; font-size: 22px; margin-bottom: 4px; }
            .report-header p { color: #64748b; font-size: 13px; }
            .report-title { text-align: center; font-size: 18px; font-weight: bold; margin: 20px 0; text-transform: uppercase; color: #1e293b; }
            .meta-row { display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 13px; color: #475569; }
            .summary-box { background: #f8fafc; padding: 12px 16px; border-radius: 6px; margin-bottom: 20px; border: 1px solid #e2e8f0; font-size: 13px; }
            .summary-box ul { margin: 8px 0 0 18px; }
            .summary-box li { margin-bottom: 4px; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 12px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; }
            th { background-color: #1e40af; color: white; font-weight: 600; font-size: 11px; text-transform: uppercase; }
            tr:nth-child(even) { background-color: #f8fafc; }
            .type-in { color: #059669; font-weight: 600; }
            .type-out { color: #d97706; font-weight: 600; }
            .report-footer { margin-top: 40px; padding-top: 15px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 12px; color: #94a3b8; }
            .signer { text-align: center; margin-top: 60px; }
            .signer-row { display: flex; justify-content: space-around; }
            .signer-box { width: 180px; text-align: center; font-size: 13px; }
            .signer-box p { margin-bottom: 60px; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="report-header">
            <h1>SMART WAREHOUSE</h1>
            <p>Hệ Thống Quản Lý Kho Thông Minh</p>
          </div>
          
          <div class="report-title">${reportTitle}</div>
          
          <div class="meta-row">
            <span>Ngày lập báo cáo: <strong>${dateStr}</strong></span>
            <span>Người lập: <strong>${currentUser?.name || 'Admin'}</strong></span>
          </div>

          <div class="summary-box">
            <strong>Tóm tắt:</strong>
            <ul>
              <li>Tổng số giao dịch: <strong>${data.length}</strong></li>
              <li>Tổng số lượng hàng hoá: <strong>${totalQty}</strong></li>
            </ul>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width:5%">STT</th>
                <th style="width:22%">Thời Gian</th>
                <th style="width:13%">Loại</th>
                <th style="width:30%">Tên Hàng Hoá</th>
                <th style="width:12%">Số Lượng</th>
                <th style="width:18%">Người Thực Hiện</th>
              </tr>
            </thead>
            <tbody>
              ${data.map((t, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td>${new Date(t.timestamp).toLocaleString('vi-VN')}</td>
                  <td class="${t.type === 'import' ? 'type-in' : 'type-out'}">
                    ${t.type === 'import' ? 'Nhập Kho' : 'Xuất Kho'}
                  </td>
                  <td>${t.itemName}</td>
                  <td>${t.quantity}</td>
                  <td>${t.user}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="signer-row">
            <div class="signer-box">
              <p>Người lập báo cáo</p>
              <span>(Ký và ghi rõ họ tên)</span>
            </div>
            <div class="signer-box">
              <p>Quản lý kho</p>
              <span>(Ký và ghi rõ họ tên)</span>
            </div>
          </div>

          <div class="report-footer">
            <span>Báo cáo tự động - SmartWarehouse</span>
            <span>${dateStr}</span>
          </div>
        </body>
      </html>
    `;
  };

  const handleExportPDF = () => {
    const dataToExport = transactions.filter(t => 
      (exportTarget === 'all' || t.type === exportTarget) &&
      (t.itemName.toLowerCase().includes(searchTerm.toLowerCase()) || t.itemId.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const title = exportTarget === 'all' ? 'BÁO CÁO TỔNG HỢP NHẬP XUẤT KHO' : 
                  exportTarget === 'import' ? 'BÁO CÁO CHI TIẾT NHẬP KHO' : 'BÁO CÁO CHI TIẾT XUẤT KHO';

    const html = buildReportHTML(dataToExport, title);

    // Use a hidden iframe to print - avoids popup blocker issues
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(html);
      iframeDoc.close();

      iframe.onload = () => {
        setTimeout(() => {
          iframe.contentWindow?.print();
          setTimeout(() => {
            document.body.removeChild(iframe);
          }, 1000);
        }, 500);
      };
    }

    setIsExportModalOpen(false);
  };

  const handlePrintSlip = (t: any) => {
    // Basic print slip simulation
    const win = window.open('', '_blank');
    if (!win) return;
    
    const isImport = t.type === 'import';
    const slipTitle = isImport ? 'PHIẾU NHẬP KHO' : 'PHIẾU XUẤT KHO';
    
    win.document.write(`
      <html>
        <head>
          <title>${slipTitle}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #333; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
            .content { line-height: 2; }
            .row { display: flex; justify-content: space-between; margin-bottom: 10px; }
            .footer { margin-top: 50px; display: flex; justify-content: space-between; text-align: center; }
            .sign-box { width: 200px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${slipTitle}</h1>
            <p>Mã phiếu: ${t.id}</p>
          </div>
          <div class="content">
            <div class="row"><span>Tên mặt hàng:</span> <strong>${t.itemName}</strong></div>
            <div class="row"><span>Số lượng:</span> <strong>${t.quantity}</strong></div>
            <div class="row"><span>Thời gian:</span> <span>${new Date(t.timestamp).toLocaleString('vi-VN')}</span></div>
            <div class="row"><span>Người thực hiện:</span> <span>${t.user}</span></div>
          </div>
          <div class="footer">
            <div class="sign-box">
              <p>Người giao</p>
              <br><br><br>
              <p>(Ký tên)</p>
            </div>
            <div class="sign-box">
              <p>Người nhận</p>
              <br><br><br>
              <p>(Ký tên)</p>
            </div>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    win.document.close();
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <HistoryIcon size={28} className={styles.titleIcon} />
          <div>
            <h1>Lịch Sử Nhập / Xuất</h1>
            <p>Theo dõi luồng luân chuyển hàng hoá trong kho</p>
          </div>
        </div>

        <div className={styles.controls}>
          <div className={styles.searchBox}>
            <Search size={18} className={styles.searchIcon} />
            <input 
              type="text" 
              placeholder="Tìm theo tên hàng..." 
              className={styles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select value={filter} onChange={(e) => setFilter(e.target.value as any)}>
            <option value="all">Tất cả giao dịch</option>
            <option value="import">Chỉ hàng nhập</option>
            <option value="export">Chỉ hàng xuất</option>
          </select>
          <button className={styles.actionBtn} onClick={() => setIsExportModalOpen(true)}>
            <Download size={18} /> Xuất Báo Cáo
          </button>
        </div>
      </div>

      {isExportModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={`glass-panel ${styles.modal}`}>
            <button className={styles.modalClose} onClick={() => setIsExportModalOpen(false)}><X size={24} /></button>
            <h2 style={{marginBottom: '1.5rem'}}>Xuất Báo Cáo Kho</h2>
            <div className={styles.formGroup}>
              <label>Chọn loại báo cáo</label>
              <div className={styles.exportOptions}>
                <button 
                  className={`${styles.optionBtn} ${exportTarget === 'all' ? styles.active : ''}`}
                  onClick={() => setExportTarget('all')}
                >
                  Tất cả giao dịch
                </button>
                <button 
                  className={`${styles.optionBtn} ${exportTarget === 'import' ? styles.active : ''}`}
                  onClick={() => setExportTarget('import')}
                >
                  Chỉ hàng Nhập Kho
                </button>
                <button 
                  className={`${styles.optionBtn} ${exportTarget === 'export' ? styles.active : ''}`}
                  onClick={() => setExportTarget('export')}
                >
                  Chỉ hàng Xuất Kho
                </button>
              </div>
            </div>
            <div className={styles.modalActions}>
              <button type="button" className={`${styles.actionBtn} ${styles.secondary}`} onClick={() => setIsExportModalOpen(false)}>Huỷ</button>
              <button type="button" className={styles.actionBtn} onClick={handleExportPDF}>In Báo Cáo (PDF)</button>
            </div>
          </div>
        </div>
      )}

      <div className={`glass-panel ${styles.tableContainer}`}>
        <table>
          <thead>
            <tr>
              <th>Thời Gian</th>
              <th>Loại</th>
              <th>Tên Hàng Hoá</th>
              <th>Số Lượng</th>
              <th>Người Thực Hiện</th>
              <th>Phiếu</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.length > 0 ? filteredTransactions.map(t => (
              <tr key={t.id}>
                <td>{new Date(t.timestamp).toLocaleString('vi-VN')}</td>
                <td>
                  <span className={`${styles.typeTag} ${t.type === 'import' ? styles.import : styles.export}`}>
                    {t.type === 'import' ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                    {t.type === 'import' ? 'Nhập Kho' : 'Xuất Kho'}
                  </span>
                </td>
                <td><strong>{t.itemName}</strong></td>
                <td>{t.quantity}</td>
                <td>{t.user}</td>
                <td>
                  <button className={styles.iconBtn} title="In phiếu" onClick={() => handlePrintSlip(t)}>
                    <FileText size={18} />
                  </button>
                </td>
              </tr>
            )) : (
              <tr><td colSpan={6} style={{textAlign: 'center', padding: '2rem'}}>Chưa có lịch sử giao dịch nào.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default History;
