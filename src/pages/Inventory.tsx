import React, { useState, useMemo, useEffect } from 'react';
import { Search, Plus, ArrowUpRight, Edit, Trash2, X, Wifi, WifiOff, Loader, Package, AlertTriangle, CheckCircle, User as UserIcon } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import type { InventoryItem } from '../types';
import styles from './Inventory.module.css';

type ActiveFlow = 'import' | 'export' | 'edit' | 'delete' | 'search' | null;
type FilterType = 'all' | 'inStock' | 'outOfStock' | 'newest' | 'oldest' | 'alpha' | 'qty';

const Inventory: React.FC = () => {
  const {
    inventory, addInventory, updateInventory, deleteInventory, exportItem, confirmReturn, currentUser,
    rfidScanning, lastRfidUid,
    startRfidScan, stopRfidScan, clearLastRfid,
  } = useAppContext();

  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [qtySortDirection, setQtySortDirection] = useState<'asc' | 'desc'>('asc');

  // New Unified Modal State
  const [activeFlow, setActiveFlow] = useState<ActiveFlow>(null);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [rfidStep, setRfidStep] = useState<'scanning' | 'result' | 'form' | null>(null);
  const [scannedItem, setScannedItem] = useState<InventoryItem | null>(null);
  const [scannedUid, setScannedUid] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState({ name: '', code: '', location: '', qty: 1, owner: '' });
  const [exportQty, setExportQty] = useState(1);
  const [scheduledTime, setScheduledTime] = useState(''); // New state for export time
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [itemSearchInModal, setItemSearchInModal] = useState('');

  // Handle RFID Scan result
  useEffect(() => {
    if (lastRfidUid && rfidStep === 'scanning') {
      const uid = lastRfidUid;
      setScannedUid(uid);
      clearLastRfid();

      const item = inventory.find(i => i.rfidUid === uid);
      
      if (activeFlow === 'export' || activeFlow === 'search') {
        if (item) {
          setScannedItem(item);
          setRfidStep('result');
          setErrorMsg(null);
          // Default scheduled time to now + 1 hour
          const now = new Date();
          now.setHours(now.getHours() + 1);
          setScheduledTime(now.toISOString().slice(0, 16));
        } else {
          setErrorMsg('Hàng hoá này không tồn tại trong hệ thống!');
          setRfidStep('result');
          setScannedItem(null);
        }
      } else if (activeFlow === 'import') {
        if (item) {
          setErrorMsg(`Hàng hoá này đã tồn tại trong hệ thống (Mã: ${item.code}). Vui lòng kiểm tra lại!`);
          setRfidStep('result');
          setScannedItem(item);
        } else {
          setRfidStep('form');
          setErrorMsg(null);
        }
      }
    }
  }, [lastRfidUid, rfidStep, activeFlow, inventory, clearLastRfid]);

  const filteredInventory = useMemo(() => {
    let result = inventory.filter(i =>
      i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Filter by Stock Status
    if (filter === 'inStock') result = result.filter(i => !i.scheduledExportTime);
    if (filter === 'outOfStock') result = result.filter(i => !!i.scheduledExportTime);

    // Sorting
    if (filter === 'newest') {
      result = [...result].sort((a, b) => new Date(b.importTime).getTime() - new Date(a.importTime).getTime());
    } else if (filter === 'oldest') {
      result = [...result].sort((a, b) => new Date(a.importTime).getTime() - new Date(b.importTime).getTime());
    } else if (filter === 'alpha') {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name, 'vi'));
    } else if (filter === 'qty') {
      result = [...result].sort((a, b) => qtySortDirection === 'asc' ? a.quantity - b.quantity : b.quantity - a.quantity);
    }

    return result;
  }, [inventory, searchTerm, filter, qtySortDirection]);

  const filteredModalItems = useMemo(() => {
    return inventory.filter(i => 
      i.name.toLowerCase().includes(itemSearchInModal.toLowerCase()) ||
      i.code.toLowerCase().includes(itemSearchInModal.toLowerCase())
    );
  }, [inventory, itemSearchInModal]);

  const closeModals = async () => {
    setActiveFlow(null);
    setSelectedItem(null);
    setScannedItem(null);
    setScannedUid(null);
    setRfidStep(null);
    setErrorMsg(null);
    setItemSearchInModal('');
    resetForm();
    if (rfidScanning) await stopRfidScan();
  };

  const resetForm = () => {
    setFormData({ name: '', code: '', location: '', qty: 1, owner: '' });
    setExportQty(1);
    setScheduledTime('');
  };

  const handleFilterChange = (val: FilterType) => {
    if (val === 'qty') {
      // If already qty, toggle direction
      if (filter === 'qty') {
        setQtySortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
      } else {
        setQtySortDirection('asc');
      }
    }
    setFilter(val);
  };

  // --- ACTIONS ---
  const handleStartImport = async () => {
    setActiveFlow('import');
    setRfidStep('scanning');
    resetForm();
    await startRfidScan('import');
  };

  const handleStartExport = async () => {
    setActiveFlow('export');
    setRfidStep('scanning');
    setScannedItem(null);
    await startRfidScan('export');
  };

  const handleStartSearch = async () => {
    setActiveFlow('search');
    setRfidStep('scanning');
    setScannedItem(null);
    await startRfidScan('export'); // Use 'export' mode for general reading
  };

  const handleStartEdit = () => {
    setActiveFlow('edit');
    setSelectedItem(null);
  };

  const handleStartDelete = () => {
    setActiveFlow('delete');
    setSelectedItem(null);
  };

  const selectItemForEdit = (item: InventoryItem) => {
    setSelectedItem(item);
    setFormData({
      name: item.name,
      code: item.code,
      location: item.shelfLocation,
      qty: item.quantity,
      owner: item.owner || '',
    });
    setRfidStep('form');
  };

  // --- SUBMITS ---
  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await addInventory({
        name: formData.name,
        code: formData.code,
        shelfLocation: formData.location,
        quantity: formData.qty,
        importTime: new Date().toISOString(),
        owner: formData.owner,
        rfidUid: scannedUid || undefined,
      });
      closeModals();
    } catch { /* error handled by context toast */ }
    finally { setIsSubmitting(false); }
  };

  const handleExportConfirm = async () => {
    if (!scannedItem) return;
    setIsSubmitting(true);
    try {
      await exportItem(scannedItem.id, exportQty, scannedUid || undefined, scheduledTime);
      closeModals();
    } catch { /* error handled */ }
    finally { setIsSubmitting(false); }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    setIsSubmitting(true);
    try {
      await updateInventory(selectedItem.id, {
        name: formData.name,
        shelfLocation: formData.location,
        quantity: formData.qty,
        owner: formData.owner,
      });
      closeModals();
    } catch { /* error handled */ }
    finally { setIsSubmitting(false); }
  };

  const handleDeleteItem = async (item: InventoryItem) => {
    if (window.confirm(`Bạn có chắc muốn xoá hàng hoá "${item.name}"?`)) {
      await deleteInventory(item.id);
      closeModals();
    }
  };

  const handleDeleteAll = async () => {
    if (window.confirm('CẢNH BÁO: Bạn có chắc chắn muốn xoá TOÀN BỘ hàng hoá trong kho? Hành động này không thể hoàn tác.')) {
      setIsSubmitting(true);
      for (const item of inventory) {
        await deleteInventory(item.id);
      }
      setIsSubmitting(false);
      closeModals();
    }
  };

  const canEdit = currentUser?.role === 'admin' || currentUser?.role === 'operator';

  // --- RFID UI Component ---
  const RfidScanOverlay = () => (
    <div className={styles.rfidOverlay}>
      <div className={styles.rfidPulseIcon}>
        {rfidScanning ? <Wifi size={40} color="#fff" /> : <WifiOff size={40} color="#fff" />}
      </div>
      <h3>Đang chờ quét thẻ RFID...</h3>
      <p>Vui lòng đưa thẻ vào vùng nhận diện của đầu đọc</p>
      <div className={styles.rfidLoader}>
        <Loader size={18} className={styles.spin} />
        <span>Đang tìm kiếm...</span>
      </div>
      <button className={`${styles.actionBtn} ${styles.secondary}`} onClick={() => setRfidStep('form')}>
        Bỏ qua quét thẻ (Nhập tay)
      </button>
    </div>
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.searchBox}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Tìm theo tên, mã hàng..."
              className={styles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className={styles.filterSelect} 
            value={filter} 
            onChange={(e) => handleFilterChange(e.target.value as FilterType)}
          >
            <option value="all">Tất cả hàng hoá</option>
            <option value="inStock">Tồn kho</option>
            <option value="outOfStock">Xuất kho</option>
            <option value="newest">Mới nhất</option>
            <option value="oldest">Trễ nhất</option>
            <option value="alpha">Thứ tự bảng chữ cái</option>
            <option value="qty">Số lượng {filter === 'qty' ? (qtySortDirection === 'asc' ? '↑' : '↓') : ''}</option>
          </select>
        </div>

        <div className={styles.headerActions}>
          {canEdit && (
            <>
              <button className={`${styles.actionBtn} ${styles.searchRfidBtn}`} onClick={handleStartSearch}>
                <Search size={18} /> Tìm bằng Thẻ
              </button>
              <button className={`${styles.actionBtn} ${styles.exportBtn}`} onClick={handleStartExport}>
                <ArrowUpRight size={18} /> Xuất Kho
              </button>
              <button className={`${styles.actionBtn} ${styles.editBtn}`} onClick={handleStartEdit}>
                <Edit size={18} /> Chỉnh Sửa
              </button>
              <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={handleStartDelete}>
                <Trash2 size={18} /> Xoá Hàng
              </button>
              <button className={`${styles.actionBtn} ${styles.importBtn}`} onClick={handleStartImport}>
                <Plus size={18} /> Nhập Kho
              </button>
            </>
          )}
        </div>
      </div>

      <div className={`glass-panel ${styles.tableContainer}`}>
        <table>
          <thead>
            <tr>
              <th>Mã Hàng</th>
              <th>Tên Hàng Hoá</th>
              <th>Chủ Sở Hữu</th>
              <th>Vị Trí</th>
              <th>Số Lượng</th>
              <th>Trạng Thái</th>
              {canEdit && <th>Hành động</th>}
            </tr>
          </thead>
          <tbody>
            {filteredInventory.length > 0 ? filteredInventory.map(item => {
              const isExported = !!item.scheduledExportTime;
              return (
                <tr key={item.id} className={isExported ? styles.outOfStockRow : ''}>
                  <td><strong>{item.code}</strong></td>
                  <td>{item.name}</td>
                  <td>{item.owner || '—'}</td>
                  <td>{item.shelfLocation}</td>
                  <td>{item.quantity}</td>
                  <td>
                    <span className={`${styles.statusTag} ${isExported ? styles.danger : styles.success}`}>
                      {isExported ? 'Xuất kho' : 'Tồn kho'}
                    </span>
                    {isExported && (
                      <div className={styles.scheduledTimeHint}>
                        Dự kiến: {new Date(item.scheduledExportTime!).toLocaleString('vi-VN')}
                      </div>
                    )}
                  </td>
                  {canEdit && (
                    <td>
                      {isExported && (
                        <button 
                          className={styles.confirmReturnBtn}
                          onClick={() => {
                            if (window.confirm(`Xác nhận hàng hoá "${item.name}" đã được trả/xuất kho hoàn tất và gỡ khỏi kệ?`)) {
                              confirmReturn(item.id);
                            }
                          }}
                          title="Xác nhận hàng đã ra khỏi kho"
                        >
                          Trả hàng <CheckCircle size={14} />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              );
            }) : (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem' }}>Không tìm thấy hàng hoá nào.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* UNIFIED FLOW MODAL */}
      {activeFlow && (
        <div className={styles.modalOverlay} onClick={closeModals}>
          <div className={`glass-panel ${styles.modal}`} onClick={e => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={closeModals}><X size={24} /></button>
            
            <h2 className={styles.modalTitle}>
              {activeFlow === 'import' && '📦 Nhập Kho Mới'}
              {activeFlow === 'export' && '📤 Xuất Kho Hàng'}
              {activeFlow === 'edit' && '✏️ Chỉnh Sửa Hàng Hoá'}
              {activeFlow === 'delete' && '🗑️ Xoá Hàng Hoá'}
              {activeFlow === 'search' && '🔍 Tìm Kiếm Bằng Thẻ'}
            </h2>

            {rfidStep === 'scanning' && <RfidScanOverlay />}

            {rfidStep === 'result' && (
              <div className={styles.resultView}>
                {errorMsg ? (
                  <div className={styles.errorContainer}>
                    <AlertTriangle size={48} className={styles.errorIcon} />
                    <h3>{errorMsg}</h3>
                    <p>Mã thẻ: {scannedUid}</p>
                    <button className={styles.actionBtn} onClick={() => {
                      setRfidStep('scanning');
                      if (activeFlow === 'import' || activeFlow === 'export' || activeFlow === 'search') {
                        startRfidScan(activeFlow === 'import' ? 'import' : 'export');
                      }
                    }}>Thử lại</button>
                  </div>
                ) : scannedItem && (
                  <div className={styles.itemCard}>
                    <div className={styles.itemHeader}>
                      <Package size={32} color="var(--accent-primary)" />
                      <div>
                        <h3>{scannedItem.name}</h3>
                        <code>Mã: {scannedItem.code}</code>
                      </div>
                    </div>
                    <div className={styles.itemGrid}>
                      <div className={styles.infoRow}><span>Chủ sở hữu:</span> <strong>{scannedItem.owner || '—'}</strong></div>
                      <div className={styles.infoRow}><span>Vị trí:</span> <strong>{scannedItem.shelfLocation}</strong></div>
                      <div className={styles.infoRow}><span>Số lượng:</span> <strong>{scannedItem.quantity}</strong></div>
                      <div className={styles.infoRow}><span>RFID:</span> <code>{scannedItem.rfidUid}</code></div>
                      <div className={styles.infoRow}>
                        <span>Trạng thái:</span> 
                        <span className={`${styles.statusTag} ${scannedItem.scheduledExportTime ? styles.danger : styles.success}`}>
                          {scannedItem.scheduledExportTime ? 'Sắp xuất kho' : 'Tồn kho'}
                        </span>
                      </div>
                      {scannedItem.scheduledExportTime && (
                        <div className={styles.infoRow}>
                          <span>Thời gian xuất dự kiến:</span> 
                          <strong>{new Date(scannedItem.scheduledExportTime).toLocaleString('vi-VN')}</strong>
                        </div>
                      )}
                    </div>

                    {activeFlow === 'export' ? (
                      <div className={styles.exportConfirm}>
                        <p>Thông tin xuất kho</p>
                        <div className={styles.formGrid}>
                          <div className={styles.formGroup}>
                            <label>Số lượng xuất:</label>
                            <input 
                              type="number" 
                              min="1" 
                              max={scannedItem.quantity} 
                              value={exportQty} 
                              onChange={e => setExportQty(parseInt(e.target.value) || 1)} 
                            />
                          </div>
                          <div className={styles.formGroup}>
                            <label>Thời điểm xuất kho (Giờ, Ngày...):</label>
                            <input 
                              type="datetime-local" 
                              required
                              value={scheduledTime} 
                              onChange={e => setScheduledTime(e.target.value)} 
                            />
                          </div>
                        </div>
                        <div className={styles.modalActions}>
                          <button className={`${styles.actionBtn} ${styles.secondary}`} onClick={closeModals}>Bỏ qua</button>
                          <button className={styles.actionBtn} onClick={handleExportConfirm} disabled={isSubmitting || !scheduledTime}>
                            {isSubmitting ? 'Đang xử lý...' : 'Xác Nhận Xuất Kho'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className={styles.modalActions}>
                        <button className={styles.actionBtn} onClick={closeModals}>Đóng</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {(activeFlow === 'edit' || activeFlow === 'delete') && !selectedItem && (
              <div className={styles.selectionView}>
                <div className={styles.modalSearch}>
                  <Search size={16} />
                  <input 
                    type="text" 
                    placeholder="Tìm nhanh hàng hoá..." 
                    value={itemSearchInModal}
                    onChange={e => setItemSearchInModal(e.target.value)}
                  />
                </div>
                <div className={styles.itemList}>
                  {filteredModalItems.map(item => (
                    <div key={item.id} className={styles.itemRowSelectable}>
                      <div className={styles.itemMainInfo}>
                        <strong>{item.name}</strong>
                        <span>{item.code} | {item.shelfLocation}</span>
                      </div>
                      <div className={styles.itemRowActions}>
                        {activeFlow === 'edit' ? (
                          <button className={styles.selectBtn} onClick={() => selectItemForEdit(item)}>Chọn để sửa</button>
                        ) : (
                          <button className={`${styles.selectBtn} ${styles.danger}`} onClick={() => handleDeleteItem(item)}>Xoá</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {activeFlow === 'delete' && (
                  <div className={styles.deleteAllWrap}>
                    <button className={styles.deleteAllBtn} onClick={handleDeleteAll}>
                      <Trash2 size={16} /> Xoá Tất Cả Kho Hàng
                    </button>
                  </div>
                )}
              </div>
            )}

            {rfidStep === 'form' && (
              <form onSubmit={activeFlow === 'import' ? handleImportSubmit : handleEditSubmit}>
                {scannedUid && activeFlow === 'import' && (
                  <div className={styles.rfidTagFound}>
                    <CheckCircle size={16} /> Đã gán thẻ RFID: {scannedUid}
                  </div>
                )}
                <div className={styles.formGroup}>
                  <label>Tên Hàng Hoá</label>
                  <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div className={styles.formGroup}>
                  <label>Mã Hàng</label>
                  <input type="text" required value={formData.code} disabled={activeFlow === 'edit'} onChange={e => setFormData({ ...formData, code: e.target.value })} />
                </div>
                <div className={styles.formGroup}>
                  <label>Chủ Sở Hữu Hàng Hoá</label>
                  <div style={{ position: 'relative' }}>
                    <UserIcon size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input style={{ paddingLeft: '2.5rem' }} type="text" placeholder="Tên chủ sở hữu..." value={formData.owner} onChange={e => setFormData({ ...formData, owner: e.target.value })} />
                  </div>
                </div>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label>Vị Trí Kệ</label>
                    <select 
                      required 
                      value={formData.location} 
                      onChange={e => setFormData({ ...formData, location: e.target.value })}
                      className={styles.shelfSelect}
                    >
                      <option value="">-- Chọn vị trí kệ --</option>
                      {['A', 'B', 'C'].flatMap(shelf => 
                        [1, 2, 3, 4].map(num => `${shelf}-0${num}`)
                      ).map(slotId => {
                        const isOccupied = inventory.some(i => i.shelfLocation === slotId);
                        return (
                          <option key={slotId} value={slotId} disabled={isOccupied && activeFlow === 'import'}>
                            {slotId} {isOccupied ? '(Đang có hàng)' : '(Trống)'}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label>Số Lượng</label>
                    <input type="number" min="0" required value={formData.qty} onChange={e => setFormData({ ...formData, qty: parseInt(e.target.value) || 0 })} />
                  </div>
                </div>
                <div className={styles.modalActions}>
                  <button type="button" className={`${styles.actionBtn} ${styles.secondary}`} onClick={closeModals}>Huỷ</button>
                  <button type="submit" className={styles.actionBtn} disabled={isSubmitting}>
                    {isSubmitting ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
