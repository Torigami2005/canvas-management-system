        let items = [];
        let editingIndex = -1;
        let currentItemImages = [];
        let viewerImages = [];
        let currentViewerIndex = 0;
        let importedData = [];
        let columnMapping = {};
        let fileColumns = [];

        // Field definitions with variations
        const fieldDefinitions = {
            dateAdded: {
                label: 'Date Added',
                variations: ['date', 'date added', 'added date', 'created', 'created date', 'purchase date', 'bought date'],
                default: () => new Date().toISOString().split('T')[0]
            },
            itemName: {
                label: 'Item Name',
                variations: ['item', 'item name', 'name', 'product', 'product name', 'title', 'description'],
                required: true
            },
            itemType: {
                label: 'Type/Category',
                variations: ['type', 'category', 'item type', 'item category', 'class', 'group'],
                default: ''
            },
            quantity: {
                label: 'Quantity',
                variations: ['qty', 'quantity', 'amount', 'count', 'number', 'units'],
                default: 1,
                parser: (val) => parseInt(val) || 1
            },
            price: {
                label: 'Price',
                variations: ['price', 'cost', 'unit price', 'price per unit', 'rate', 'amount'],
                default: 0,
                parser: (val) => parseFloat(val) || 0
            },
            paid: {
                label: 'Paid',
                variations: ['paid', 'is paid', 'payment', 'payment status'],
                default: false,
                parser: (val) => {
                    if (typeof val === 'boolean') return val;
                    const str = String(val).toLowerCase();
                    return str === 'true' || str === 'yes' || str === '1' || str === 'paid';
                }
            },
            received: {
                label: 'Received',
                variations: ['received', 'is received', 'got it', 'delivered', 'arrived'],
                default: false,
                parser: (val) => {
                    if (typeof val === 'boolean') return val;
                    const str = String(val).toLowerCase();
                    return str === 'true' || str === 'yes' || str === '1' || str === 'received' || str === 'delivered';
                }
            },
            storeName: {
                label: 'Store Name',
                variations: ['store', 'store name', 'shop', 'vendor', 'supplier', 'seller'],
                default: ''
            },
            status: {
                label: 'Status',
                variations: ['status', 'state', 'stage'],
                default: 'Pending',
                parser: (val) => {
                    const validStatuses = ['Pending', 'Active', 'Completed', 'Cancelled'];
                    const normalized = String(val).trim();
                    return validStatuses.includes(normalized) ? normalized : 'Pending';
                }
            },
            location: {
                label: 'Location',
                variations: ['location', 'place', 'storage', 'warehouse', 'address'],
                default: ''
            },
            contactInfo: {
                label: 'Contact Info',
                variations: ['contact', 'contact info', 'email', 'phone', 'telephone'],
                default: ''
            },
            notes: {
                label: 'Notes',
                variations: ['notes', 'note', 'comments', 'remarks', 'memo'],
                default: ''
            },
            extra: {
                label: 'Extra',
                variations: ['extra', 'additional', 'misc', 'other', 'additional info'],
                default: ''
            }
        };

        // Initialize with today's date
        function initializeDateField() {
            const today = new Date();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            const year = today.getFullYear();
            document.getElementById('dateAdded').value = `${month}/${day}/${year}`;
        }

        // Load items from localStorage
        function loadItems() {
            const stored = localStorage.getItem('workspaceItems');
            if (stored) {
                items = JSON.parse(stored);
                renderTable();
            }
        }

        // Save items to localStorage
        function saveItems() {
            localStorage.setItem('workspaceItems', JSON.stringify(items));
        }

        // Handle image file selection
        document.getElementById('imageInput').addEventListener('change', function(e) {
            const files = e.target.files;
            
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const reader = new FileReader();
                
                reader.onload = function(event) {
                    currentItemImages.push(event.target.result);
                    renderImagePreviews();
                };
                
                reader.readAsDataURL(file);
            }
            
            // Reset input
            e.target.value = '';
        });

        // Render image previews in the form
        function renderImagePreviews() {
            const container = document.getElementById('imagePreviewContainer');
            
            if (currentItemImages.length === 0) {
                container.innerHTML = '<p style="color: #6c757d; font-size: 13px; margin-top: 10px;">No images added yet</p>';
                return;
            }
            
            container.innerHTML = currentItemImages.map((img, index) => `
                <div class="image-preview-item">
                    <img src="${img}" alt="Preview ${index + 1}">
                    <button type="button" class="image-remove-btn" onclick="removeImage(${index})">×</button>
                </div>
            `).join('');
        }

        // Remove image from preview
        function removeImage(index) {
            currentItemImages.splice(index, 1);
            renderImagePreviews();
        }

        // Open add modal
        function openAddModal() {
            editingIndex = -1;
            currentItemImages = [];
            document.getElementById('modalTitle').textContent = 'Add New Item';
            document.getElementById('itemForm').reset();
            initializeDateField();
            renderImagePreviews();
            document.getElementById('itemModal').classList.add('active');
        }

        // Open edit modal
        function openEditModal(index) {
            editingIndex = index;
            const item = items[index];
            document.getElementById('modalTitle').textContent = 'Edit Item';
            
            document.getElementById('dateAdded').value = item.dateAdded;
            document.getElementById('itemName').value = item.itemName;
            document.getElementById('itemType').value = item.itemType;
            document.getElementById('quantity').value = item.quantity || 1;
            document.getElementById('price').value = item.price;
            document.getElementById('paid').checked = item.paid || false;
            document.getElementById('received').checked = item.received || false;
            document.getElementById('storeName').value = item.storeName;
            document.getElementById('status').value = item.status;
            document.getElementById('location').value = item.location;
            document.getElementById('contactInfo').value = item.contactInfo;
            document.getElementById('notes').value = item.notes;
            document.getElementById('extra').value = item.extra;
            
            // Load existing images
            currentItemImages = item.images || [];
            renderImagePreviews();
            
            document.getElementById('itemModal').classList.add('active');
        }

        // Close modal
        function closeModal() {
            document.getElementById('itemModal').classList.remove('active');
            editingIndex = -1;
            currentItemImages = [];
        }

        // Handle form submission
        document.getElementById('itemForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const quantity = parseInt(document.getElementById('quantity').value) || 1;
            const price = parseFloat(document.getElementById('price').value) || 0;
            const paid = document.getElementById('paid').checked;
            const received = document.getElementById('received').checked;
            
            const item = {
                dateAdded: document.getElementById('dateAdded').value,
                itemName: document.getElementById('itemName').value,
                itemType: document.getElementById('itemType').value,
                quantity: quantity,
                price: price,
                total: quantity * price,
                paid: paid,
                received: received,
                storeName: document.getElementById('storeName').value,
                status: document.getElementById('status').value,
                location: document.getElementById('location').value,
                contactInfo: document.getElementById('contactInfo').value,
                notes: document.getElementById('notes').value,
                extra: document.getElementById('extra').value,
                images: currentItemImages
            };
            
            if (editingIndex >= 0) {
                items[editingIndex] = item;
            } else {
                items.push(item);
            }
            
            saveItems();
            renderTable();
            closeModal();
        });

        // Delete item
        function deleteItem(index) {
            if (confirm('Are you sure you want to delete this item?')) {
                items.splice(index, 1);
                saveItems();
                renderTable();
            }
        }

        // Toggle paid status
        function togglePaid(index) {
            items[index].paid = !items[index].paid;
            saveItems();
            calculateTotals();
        }

        // Toggle received status
        function toggleReceived(index) {
            items[index].received = !items[index].received;
            saveItems();
            renderTable();
        }

        // Get status badge class
        function getStatusClass(status) {
            const statusMap = {
                'Pending': 'status-pending',
                'Active': 'status-active',
                'Completed': 'status-completed',
                'Cancelled': 'status-cancelled'
            };
            return statusMap[status] || 'status-pending';
        }

        // Calculate totals
        function calculateTotals() {
            const totalValue = items.reduce((sum, item) => sum + ((item.quantity || 1) * (item.price || 0)), 0);
            const totalQty = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
            const paidTotal = items.reduce((sum, item) => {
                if (item.paid) {
                    return sum + ((item.quantity || 1) * (item.price || 0));
                }
                return sum;
            }, 0);
            const unpaidTotal = totalValue - paidTotal;
            
            document.getElementById('totalItems').textContent = items.length;
            document.getElementById('totalValue').textContent = '₱' + totalValue.toFixed(2);
            document.getElementById('totalQuantity').textContent = totalQty;
            document.getElementById('totalPaid').textContent = '₱' + paidTotal.toFixed(2);
            document.getElementById('totalUnpaid').textContent = '₱' + unpaidTotal.toFixed(2);
        }

        // Open image viewer
        function openImageViewer(itemIndex, imageIndex = 0) {
            const item = items[itemIndex];
            if (!item.images || item.images.length === 0) return;
            
            viewerImages = item.images;
            currentViewerIndex = imageIndex;
            updateImageViewer();
            document.getElementById('imageViewerModal').classList.add('active');
        }

        // Close image viewer
        function closeImageViewer() {
            document.getElementById('imageViewerModal').classList.remove('active');
        }

        // Navigate to previous image
        function previousImage() {
            currentViewerIndex = (currentViewerIndex - 1 + viewerImages.length) % viewerImages.length;
            updateImageViewer();
        }

        // Navigate to next image
        function nextImage() {
            currentViewerIndex = (currentViewerIndex + 1) % viewerImages.length;
            updateImageViewer();
        }

        // Update image viewer display
        function updateImageViewer() {
            document.getElementById('viewerImage').src = viewerImages[currentViewerIndex];
            document.getElementById('currentImageIndex').textContent = currentViewerIndex + 1;
            document.getElementById('totalImages').textContent = viewerImages.length;
        }

        // Close viewer on escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                closeImageViewer();
            } else if (e.key === 'ArrowLeft') {
                previousImage();
            } else if (e.key === 'ArrowRight') {
                nextImage();
            }
        });

        // ============ IMPORT FUNCTIONALITY ============

        // Open import modal
        function openImportModal() {
            document.getElementById('importModal').classList.add('active');
            resetImportModal();
        }

        // Close import modal
        function closeImportModal() {
            document.getElementById('importModal').classList.remove('active');
            resetImportModal();
        }

        // Reset import modal
        function resetImportModal() {
            document.getElementById('importFileInput').value = '';
            document.getElementById('columnMappingSection').style.display = 'none';
            document.getElementById('importDataBtn').style.display = 'none';
            importedData = [];
            columnMapping = {};
            fileColumns = [];
        }

        // Setup file drop zone
        const dropZone = document.getElementById('fileDropZone');
        const fileInput = document.getElementById('importFileInput');

        dropZone.addEventListener('click', () => fileInput.click());
        
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('drag-over');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleFileSelect(files[0]);
            }
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleFileSelect(e.target.files[0]);
            }
        });

        // Handle file selection
        function handleFileSelect(file) {
            const fileName = file.name.toLowerCase();
            
            if (fileName.endsWith('.csv')) {
                parseCSV(file);
            } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
                parseExcel(file);
            } else {
                alert('Please upload a CSV or Excel file (.csv, .xlsx, .xls)');
            }
        }

        // Parse CSV file
        function parseCSV(file) {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: function(results) {
                    if (results.data.length === 0) {
                        alert('The CSV file is empty!');
                        return;
                    }
                    importedData = results.data;
                    fileColumns = Object.keys(results.data[0]);
                    setupColumnMapping();
                },
                error: function(error) {
                    alert('Error parsing CSV: ' + error.message);
                }
            });
        }

        // Parse Excel file
        function parseExcel(file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                    const jsonData = XLSX.utils.sheet_to_json(firstSheet);
                    
                    if (jsonData.length === 0) {
                        alert('The Excel file is empty!');
                        return;
                    }
                    
                    importedData = jsonData;
                    fileColumns = Object.keys(jsonData[0]);
                    setupColumnMapping();
                } catch (error) {
                    alert('Error parsing Excel file: ' + error.message);
                }
            };
            reader.readAsArrayBuffer(file);
        }

        // Auto-match columns
        function autoMatchColumns() {
            const mapping = {};
            
            for (const [fieldKey, fieldDef] of Object.entries(fieldDefinitions)) {
                // Try to find a match
                const match = fileColumns.find(col => {
                    const colLower = col.toLowerCase().trim();
                    return fieldDef.variations.some(variation => 
                        colLower === variation.toLowerCase() || 
                        colLower.includes(variation.toLowerCase())
                    );
                });
                
                mapping[fieldKey] = match || '';
            }
            
            return mapping;
        }

        // Setup column mapping interface
        function setupColumnMapping() {
            columnMapping = autoMatchColumns();
            
            const container = document.getElementById('columnMappingContainer');
            container.innerHTML = Object.entries(fieldDefinitions).map(([key, def]) => `
                <div class="mapping-row">
                    <div>
                        <strong>${def.label}</strong>
                        ${def.required ? '<span style="color: red;">*</span>' : ''}
                    </div>
                    <div class="mapping-arrow">→</div>
                    <select id="mapping_${key}" onchange="updateMapping('${key}', this.value)">
                        <option value="">-- Skip this field --</option>
                        ${fileColumns.map(col => `
                            <option value="${col}" ${columnMapping[key] === col ? 'selected' : ''}>
                                ${col}
                            </option>
                        `).join('')}
                    </select>
                </div>
            `).join('');
            
            document.getElementById('columnMappingSection').style.display = 'block';
            showPreview();
            updateImportButton();
        }

        // Update mapping
        function updateMapping(field, column) {
            columnMapping[field] = column;
            updateImportButton();
        }

        // Update import button state
        function updateImportButton() {
            const hasRequiredFields = Object.entries(fieldDefinitions)
                .filter(([_, def]) => def.required)
                .every(([key, _]) => columnMapping[key]);
            
            const btn = document.getElementById('importDataBtn');
            if (hasRequiredFields) {
                btn.style.display = 'inline-flex';
            } else {
                btn.style.display = 'none';
            }
        }

        // Show preview
        function showPreview() {
            const previewData = importedData.slice(0, 5);
            const previewSection = document.getElementById('previewSection');
            const container = document.getElementById('previewTableContainer');
            
            const html = `
                <table>
                    <thead>
                        <tr>
                            ${fileColumns.map(col => `<th>${col}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${previewData.map(row => `
                            <tr>
                                ${fileColumns.map(col => `<td>${row[col] || ''}</td>`).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
            
            container.innerHTML = html;
            previewSection.style.display = 'block';
        }

        // Import data
        function importData() {
            const newItems = [];
            const errors = [];
            
            importedData.forEach((row, index) => {
                try {
                    const item = {
                        images: []
                    };
                    
                    // Map each field
                    for (const [fieldKey, fieldDef] of Object.entries(fieldDefinitions)) {
                        const sourceColumn = columnMapping[fieldKey];
                        let value;
                        
                        if (sourceColumn && row[sourceColumn] !== undefined && row[sourceColumn] !== '') {
                            value = row[sourceColumn];
                            if (fieldDef.parser) {
                                value = fieldDef.parser(value);
                            }
                        } else {
                            value = typeof fieldDef.default === 'function' ? fieldDef.default() : fieldDef.default;
                        }
                        
                        item[fieldKey] = value;
                    }
                    
                    // Calculate total
                    item.total = (item.quantity || 1) * (item.price || 0);
                    
                    newItems.push(item);
                } catch (error) {
                    errors.push(`Row ${index + 1}: ${error.message}`);
                }
            });
            
            if (errors.length > 0) {
                alert('Some rows had errors:\n' + errors.join('\n'));
            }
            
            // Add items to existing list
            items.push(...newItems);
            saveItems();
            renderTable();
            
            // Show summary
            const summary = document.getElementById('importSummary');
            summary.innerHTML = `
                <strong>✅ Import Successful!</strong>
                <p>Imported ${newItems.length} items from your file.</p>
                ${errors.length > 0 ? `<p style="color: #856404;">⚠️ ${errors.length} rows had errors and were skipped.</p>` : ''}
            `;
            summary.style.display = 'block';
            
            // Hide import button
            document.getElementById('importDataBtn').style.display = 'none';
            
            // Auto-close after 3 seconds
            setTimeout(() => {
                closeImportModal();
            }, 3000);
        }

        // Render table
        function renderTable() {
            const tbody = document.getElementById('tableBody');
            const emptyState = document.getElementById('emptyState');
            
            // Get filter values
            const searchTerm = document.getElementById('searchInput').value.toLowerCase();
            const paidFilter = document.getElementById('filterPaid').value;
            const receivedFilter = document.getElementById('filterReceived').value;
            
            // Filter items
            const filteredItems = items.filter(item => {
                // Search filter
                const matchesSearch = !searchTerm || 
                    item.itemName.toLowerCase().includes(searchTerm) ||
                    item.itemType.toLowerCase().includes(searchTerm) ||
                    item.storeName.toLowerCase().includes(searchTerm) ||
                    item.location.toLowerCase().includes(searchTerm) ||
                    item.notes.toLowerCase().includes(searchTerm);
                
                // Paid filter
                const matchesPaid = paidFilter === 'all' || 
                    (paidFilter === 'paid' && item.paid) ||
                    (paidFilter === 'unpaid' && !item.paid);
                
                // Received filter
                const matchesReceived = receivedFilter === 'all' ||
                    (receivedFilter === 'received' && item.received) ||
                    (receivedFilter === 'not-received' && !item.received);
                
                return matchesSearch && matchesPaid && matchesReceived;
            });
            
            if (filteredItems.length === 0) {
                tbody.innerHTML = '';
                emptyState.style.display = 'block';
                if (searchTerm || paidFilter !== 'all' || receivedFilter !== 'all') {
                    emptyState.innerHTML = `
                        <svg fill="currentColor" viewBox="0 0 20 20">
                            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                        </svg>
                        <h3>No items found</h3>
                        <p>Try adjusting your search or filters</p>
                    `;
                } else {
                    emptyState.innerHTML = `
                        <svg fill="currentColor" viewBox="0 0 20 20">
                            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                        </svg>
                        <h3>No items yet</h3>
                        <p>Click "Add New Item" or "Import CSV/Excel" to get started</p>
                    `;
                }
            } else {
                emptyState.style.display = 'none';
                tbody.innerHTML = filteredItems.map((item, filterIndex) => {
                    const originalIndex = items.indexOf(item);
                    const quantity = item.quantity || 1;
                    const price = item.price || 0;
                    const total = quantity * price;
                    const paid = item.paid || false;
                    const received = item.received || false;
                    const images = item.images || [];
                    
                    // Generate image gallery HTML
                    let imageGalleryHTML = '';
                    if (images.length > 0) {
                        const displayImages = images.slice(0, 3);
                        imageGalleryHTML = `
                            <div class="table-image-gallery">
                                ${displayImages.map((img, imgIndex) => `
                                    <img src="${img}" 
                                         class="table-image-thumbnail" 
                                         onclick="openImageViewer(${originalIndex}, ${imgIndex})"
                                         alt="Image ${imgIndex + 1}">
                                `).join('')}
                                ${images.length > 3 ? `<span class="image-count-badge">+${images.length - 3}</span>` : ''}
                            </div>
                        `;
                    } else {
                        imageGalleryHTML = '<span style="color: #6c757d; font-size: 12px;">No images</span>';
                    }
                    
                    return `
                    <tr>
                        <td>${imageGalleryHTML}</td>
                        <td>${item.dateAdded}</td>
                        <td><strong>${item.itemName}</strong></td>
                        <td>${item.itemType}</td>
                        <td>${quantity}</td>
                        <td class="price-display">₱${price.toFixed(2)}</td>
                        <td class="price-display"><strong>₱${total.toFixed(2)}</strong></td>
                        <td style="text-align: center;">
                            <input type="checkbox" ${paid ? 'checked' : ''} 
                                   onchange="togglePaid(${originalIndex})" 
                                   style="cursor: pointer; width: 18px; height: 18px;">
                        </td>
                        <td style="text-align: center;">
                            <input type="checkbox" ${received ? 'checked' : ''} 
                                   onchange="toggleReceived(${originalIndex})" 
                                   style="cursor: pointer; width: 18px; height: 18px;">
                        </td>
                        <td>${item.storeName}</td>
                        <td><span class="status-badge ${getStatusClass(item.status)}">${item.status}</span></td>
                        <td>${item.location}</td>
                        <td>${item.contactInfo}</td>
                        <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${item.notes}">${item.notes}</td>
                        <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${item.extra}">${item.extra}</td>
                        <td>
                            <div class="action-buttons">
                                <button class="btn btn-primary btn-small" onclick="openEditModal(${originalIndex})">Edit</button>
                                <button class="btn btn-danger btn-small" onclick="deleteItem(${originalIndex})">Delete</button>
                            </div>
                        </td>
                    </tr>
                `}).join('');
            }
            
            calculateTotals();
        }

        // Close modal when clicking outside
        document.getElementById('itemModal').addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal();
            }
        });

        document.getElementById('importModal').addEventListener('click', function(e) {
            if (e.target === this) {
                closeImportModal();
            }
        });

        // Close image viewer when clicking outside
        document.getElementById('imageViewerModal').addEventListener('click', function(e) {
            if (e.target === this) {
                closeImageViewer();
            }
        });

        // Add search and filter listeners
        document.getElementById('searchInput').addEventListener('input', renderTable);
        document.getElementById('filterPaid').addEventListener('change', renderTable);
        document.getElementById('filterReceived').addEventListener('change', renderTable);

        // Initialize
        initializeDateField();
        loadItems();