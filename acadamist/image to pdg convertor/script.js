// Filename Modal Manager
class FilenameModal {
    constructor() {
        this.modal = document.getElementById('filenameModal');
        this.input = document.getElementById('filenameInput');
        this.extension = document.getElementById('fileExtension');
        this.cancelBtn = document.getElementById('cancelFilename');
        this.confirmBtn = document.getElementById('confirmFilename');
        this.downloadCallback = null;

        this.attachEventListeners();
    }

    attachEventListeners() {
        this.cancelBtn.addEventListener('click', () => this.hide());
        this.confirmBtn.addEventListener('click', () => this.confirm());
        this.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.confirm();
        });

        // Click outside to close
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.hide();
        });
    }

    show(defaultFilename, fileExtension, callback) {
        this.input.value = defaultFilename;
        this.extension.textContent = fileExtension;
        this.downloadCallback = callback;
        this.modal.style.display = 'flex';
        setTimeout(() => this.input.select(), 100);
    }

    hide() {
        this.modal.style.display = 'none';
        this.downloadCallback = null;
    }

    confirm() {
        if (this.downloadCallback && this.input.value.trim()) {
            const filename = this.input.value.trim() + this.extension.textContent;
            this.downloadCallback(filename);
            this.hide();
        }
    }
}

// Mode Controller - Updated for 4 modes
class ModeController {
    constructor() {
        this.currentMode = 'image-to-pdf';
        this.initializeElements();
        this.attachEventListeners();
        this.showMode(this.currentMode);
    }

    initializeElements() {
        this.modeTabs = document.querySelectorAll('.mode-tab');
        this.imageUploadSection = document.querySelector('.upload-section:not(.pdf-upload-section):not(.word-upload-section):not(.pptx-upload-section)');
        this.pdfUploadSection = document.querySelector('.pdf-upload-section');
        this.wordUploadSection = document.querySelector('.word-upload-section');
        this.pptxUploadSection = document.querySelector('.pptx-upload-section');
        this.previewSection = document.getElementById('previewSection');
        this.pdfPreviewSection = document.getElementById('pdfPreviewSection');
        this.wordPreviewSection = document.getElementById('wordPreviewSection');
        this.pptxPreviewSection = document.getElementById('pptxPreviewSection');
        this.actionsSection = document.getElementById('actionsSection');
    }

    attachEventListeners() {
        this.modeTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const mode = tab.dataset.mode;
                this.switchMode(mode);
            });
        });
    }

    switchMode(mode) {
        this.currentMode = mode;

        // Update active tab
        this.modeTabs.forEach(tab => {
            if (tab.dataset.mode === mode) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });

        this.showMode(mode);
    }

    showMode(mode) {
        // Hide all sections first
        this.imageUploadSection.style.display = 'none';
        this.pdfUploadSection.style.display = 'none';
        this.wordUploadSection.style.display = 'none';
        this.pptxUploadSection.style.display = 'none';
        this.previewSection.style.display = 'none';
        this.pdfPreviewSection.style.display = 'none';
        this.wordPreviewSection.style.display = 'none';
        this.pptxPreviewSection.style.display = 'none';

        // Show appropriate section based on mode
        if (mode === 'image-to-pdf') {
            this.imageUploadSection.style.display = 'block';
            if (this.previewSection.classList.contains('active')) {
                this.previewSection.style.display = 'block';
            }
        } else if (mode === 'pdf-to-word') {
            this.pdfUploadSection.style.display = 'block';
        } else if (mode === 'word-to-pdf') {
            this.wordUploadSection.style.display = 'block';
        } else if (mode === 'pptx-to-pdf') {
            this.pptxUploadSection.style.display = 'block';
        }
    }
}

// Image to PDF Converter (existing, updated for filename modal)
class ImageToPDFConverter {
    constructor(modeController, filenameModal) {
        this.modeController = modeController;
        this.filenameModal = filenameModal;
        this.images = [];
        this.initializeElements();
        this.attachEventListeners();
    }

    initializeElements() {
        this.uploadArea = document.getElementById('uploadArea');
        this.fileInput = document.getElementById('fileInput');
        this.previewSection = document.getElementById('previewSection');
        this.previewGrid = document.getElementById('previewGrid');
        this.imageCount = document.getElementById('imageCount');
        this.actionsSection = document.getElementById('actionsSection');
        this.convertBtn = document.getElementById('convertBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.toast = document.getElementById('toast');
        this.toastMessage = document.getElementById('toastMessage');
        this.loadingOverlay = document.getElementById('loadingOverlay');
    }

    attachEventListeners() {
        this.uploadArea.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));

        this.uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.uploadArea.addEventListener('drop', (e) => this.handleDrop(e));

        this.convertBtn.addEventListener('click', () => {
            if (this.modeController.currentMode === 'image-to-pdf') {
                this.convertToPDF();
            }
        });
        this.clearBtn.addEventListener('click', () => this.clearAll());
    }

    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        this.uploadArea.classList.add('drag-over');
    }

    handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        this.uploadArea.classList.remove('drag-over');
    }

    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        this.uploadArea.classList.remove('drag-over');

        const files = Array.from(e.dataTransfer.files);
        this.processFiles(files);
    }

    handleFileSelect(e) {
        const files = Array.from(e.target.files);
        this.processFiles(files);
        e.target.value = '';
    }

    processFiles(files) {
        const imageFiles = files.filter(file => file.type.startsWith('image/'));

        if (imageFiles.length === 0) {
            this.showToast('Please select valid image files');
            return;
        }

        if (imageFiles.length !== files.length) {
            this.showToast('Some files were skipped (not images)');
        }

        imageFiles.forEach(file => this.addImage(file));
    }

    addImage(file) {
        const reader = new FileReader();

        reader.onload = (e) => {
            const imageData = {
                id: Date.now() + Math.random(),
                name: file.name,
                data: e.target.result,
                file: file
            };

            this.images.push(imageData);
            this.renderPreview(imageData);
            this.updateUI();
            this.showToast(`Added ${file.name}`);
        };

        reader.onerror = () => {
            this.showToast('Error reading file: ' + file.name);
        };

        reader.readAsDataURL(file);
    }

    renderPreview(imageData) {
        const previewItem = document.createElement('div');
        previewItem.className = 'preview-item';
        previewItem.dataset.id = imageData.id;

        previewItem.innerHTML = `
            <img src="${imageData.data}" alt="${imageData.name}" class="preview-image">
            <div class="preview-overlay">
                <span class="preview-name">${imageData.name}</span>
            </div>
            <button class="remove-btn" data-id="${imageData.id}">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
            </button>
        `;

        const removeBtn = previewItem.querySelector('.remove-btn');
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.removeImage(imageData.id);
        });

        this.previewGrid.appendChild(previewItem);
    }

    removeImage(id) {
        const index = this.images.findIndex(img => img.id === id);
        if (index !== -1) {
            const removedImage = this.images[index];
            this.images.splice(index, 1);

            const previewItem = this.previewGrid.querySelector(`[data-id="${id}"]`);
            if (previewItem) {
                previewItem.style.animation = 'fadeOut 0.3s ease';
                setTimeout(() => previewItem.remove(), 300);
            }

            this.updateUI();
            this.showToast(`Removed ${removedImage.name}`);
        }
    }

    updateUI() {
        const count = this.images.length;
        this.imageCount.textContent = `${count} image${count !== 1 ? 's' : ''}`;

        if (count > 0) {
            this.previewSection.classList.add('active');
            this.actionsSection.classList.add('active');
            this.modeController.showMode(this.modeController.currentMode);
        } else {
            this.previewSection.classList.remove('active');
            this.actionsSection.classList.remove('active');
        }
    }

    clearAll() {
        if (this.images.length === 0) return;

        const confirmed = confirm(`Are you sure you want to remove all ${this.images.length} image(s)?`);
        if (!confirmed) return;

        this.images = [];
        this.previewGrid.innerHTML = '';
        this.updateUI();
        this.showToast('All images cleared');
    }

    async convertToPDF() {
        if (this.images.length === 0) {
            this.showToast('Please add at least one image');
            return;
        }

        this.showLoading(true, 'Converting to PDF...');

        try {
            const { jsPDF } = window.jspdf;

            await new Promise(resolve => setTimeout(resolve, 500));

            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const margin = 10;
            const maxWidth = pageWidth - (2 * margin);
            const maxHeight = pageHeight - (2 * margin);

            for (let i = 0; i < this.images.length; i++) {
                if (i > 0) {
                    pdf.addPage();
                }

                const img = this.images[i];

                const imgElement = new Image();
                imgElement.src = img.data;

                await new Promise((resolve) => {
                    imgElement.onload = () => {
                        const imgWidth = imgElement.width;
                        const imgHeight = imgElement.height;
                        const ratio = Math.min(maxWidth / imgWidth, maxHeight / imgHeight);

                        const scaledWidth = imgWidth * ratio;
                        const scaledHeight = imgHeight * ratio;

                        const x = (pageWidth - scaledWidth) / 2;
                        const y = (pageHeight - scaledHeight) / 2;

                        pdf.addImage(img.data, 'JPEG', x, y, scaledWidth, scaledHeight);
                        resolve();
                    };
                });
            }

            this.showLoading(false);

            // Show filename modal
            const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
            const defaultFilename = `images-to-pdf-${timestamp}`;

            this.filenameModal.show(defaultFilename, '.pdf', (filename) => {
                pdf.save(filename);
                this.showToast(`PDF downloaded: ${filename}`);
            });

        } catch (error) {
            console.error('PDF conversion error:', error);
            this.showLoading(false);
            this.showToast('Error converting to PDF. Please try again.');
        }
    }

    showLoading(show, message = 'Processing...') {
        const loadingText = this.loadingOverlay.querySelector('p');
        if (loadingText) loadingText.textContent = message;

        if (show) {
            this.loadingOverlay.classList.add('active');
        } else {
            this.loadingOverlay.classList.remove('active');
        }
    }

    showToast(message) {
        this.toastMessage.textContent = message;
        this.toast.classList.add('show');

        setTimeout(() => {
            this.toast.classList.remove('show');
        }, 3000);
    }
}

// PDF to Word Converter (existing, updated for filename modal)
class PDFToWordConverter {
    constructor(imageConverter, filenameModal) {
        this.imageConverter = imageConverter;
        this.filenameModal = filenameModal;
        this.pdfFile = null;
        this.pdfData = null;
        this.initializeElements();
        this.attachEventListeners();
        this.initPDFJS();
    }

    initPDFJS() {
        if (window.pdfjsLib) {
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }
    }

    initializeElements() {
        this.pdfUploadArea = document.getElementById('pdfUploadArea');
        this.pdfFileInput = document.getElementById('pdfFileInput');
        this.pdfPreviewSection = document.getElementById('pdfPreviewSection');
        this.pdfFileName = document.getElementById('pdfFileName');
        this.pdfPageCount = document.getElementById('pdfPageCount');
        this.removePdfBtn = document.getElementById('removePdfBtn');
        this.convertBtn = document.getElementById('convertBtn');
    }

    attachEventListeners() {
        this.pdfUploadArea.addEventListener('click', () => this.pdfFileInput.click());
        this.pdfFileInput.addEventListener('change', (e) => this.handlePDFSelect(e));

        this.pdfUploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.pdfUploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.pdfUploadArea.addEventListener('drop', (e) => this.handleDrop(e));

        this.removePdfBtn.addEventListener('click', () => this.removePDF());

        this.convertBtn.addEventListener('click', () => {
            if (this.imageConverter.modeController.currentMode === 'pdf-to-word') {
                this.convertToWord();
            }
        });
    }

    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        this.pdfUploadArea.classList.add('drag-over');
    }

    handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        this.pdfUploadArea.classList.remove('drag-over');
    }

    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        this.pdfUploadArea.classList.remove('drag-over');

        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0 && files[0].type === 'application/pdf') {
            this.processPDF(files[0]);
        } else {
            this.imageConverter.showToast('Please upload a PDF file');
        }
    }

    handlePDFSelect(e) {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            this.processPDF(files[0]);
        }
        e.target.value = '';
    }

    async processPDF(file) {
        if (file.type !== 'application/pdf') {
            this.imageConverter.showToast('Please select a valid PDF file');
            return;
        }

        this.imageConverter.showLoading(true, 'Loading PDF...');

        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

            this.pdfFile = file;
            this.pdfData = pdf;

            this.pdfFileName.textContent = file.name;
            this.pdfPageCount.textContent = `${pdf.numPages} page${pdf.numPages !== 1 ? 's' : ''}`;

            this.pdfPreviewSection.style.display = 'block';
            this.imageConverter.actionsSection.classList.add('active');

            this.imageConverter.showLoading(false);
            this.imageConverter.showToast('PDF loaded successfully');

        } catch (error) {
            console.error('Error loading PDF:', error);
            this.imageConverter.showLoading(false);
            this.imageConverter.showToast('Error loading PDF. Please try again.');
        }
    }

    removePDF() {
        this.pdfFile = null;
        this.pdfData = null;
        this.pdfPreviewSection.style.display = 'none';
        this.imageConverter.actionsSection.classList.remove('active');
        this.imageConverter.showToast('PDF removed');
    }

    async convertToWord() {
        if (!this.pdfData) {
            this.imageConverter.showToast('Please upload a PDF file first');
            return;
        }

        this.imageConverter.showLoading(true, 'Converting PDF to Word...');

        try {
            const { Document, Paragraph, TextRun, PageBreak } = docx;

            const textContent = [];

            // Extract text from each page
            for (let i = 1; i <= this.pdfData.numPages; i++) {
                const page = await this.pdfData.getPage(i);
                const content = await page.getTextContent();

                const pageText = content.items.map(item => item.str).join(' ');
                textContent.push(pageText);
            }

            // Create Word document
            const paragraphs = [];

            textContent.forEach((pageText, index) => {
                if (pageText.trim()) {
                    paragraphs.push(
                        new Paragraph({
                            children: [new TextRun(pageText)],
                            spacing: { after: 200 }
                        })
                    );
                }

                // Add page break except for last page
                if (index < textContent.length - 1) {
                    paragraphs.push(new Paragraph({ children: [new PageBreak()] }));
                }
            });

            const doc = new Document({
                sections: [{
                    properties: {},
                    children: paragraphs
                }]
            });

            // Generate and download with filename modal
            const blob = await docx.Packer.toBlob(doc);
            this.imageConverter.showLoading(false);

            const defaultFilename = this.pdfFile.name.replace('.pdf', '-converted');

            this.filenameModal.show(defaultFilename, '.docx', (filename) => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);

                this.imageConverter.showToast(`Word document downloaded: ${filename}`);
            });

        } catch (error) {
            console.error('PDF to Word conversion error:', error);
            this.imageConverter.showLoading(false);
            this.imageConverter.showToast('Error converting to Word. This PDF may contain complex elements.');
        }
    }
}

// Word to PDF Converter (NEW)
class WordToPDFConverter {
    constructor(imageConverter, filenameModal) {
        this.imageConverter = imageConverter;
        this.filenameModal = filenameModal;
        this.wordFile = null;
        this.initializeElements();
        this.attachEventListeners();
    }

    initializeElements() {
        this.wordUploadArea = document.getElementById('wordUploadArea');
        this.wordFileInput = document.getElementById('wordFileInput');
        this.wordPreviewSection = document.getElementById('wordPreviewSection');
        this.wordFileName = document.getElementById('wordFileName');
        this.wordFileSize = document.getElementById('wordFileSize');
        this.removeWordBtn = document.getElementById('removeWordBtn');
        this.convertBtn = document.getElementById('convertBtn');
    }

    attachEventListeners() {
        this.wordUploadArea.addEventListener('click', () => this.wordFileInput.click());
        this.wordFileInput.addEventListener('change', (e) => this.handleWordSelect(e));

        this.wordUploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.wordUploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.wordUploadArea.addEventListener('drop', (e) => this.handleDrop(e));

        this.removeWordBtn.addEventListener('click', () => this.removeWord());

        this.convertBtn.addEventListener('click', () => {
            if (this.imageConverter.modeController.currentMode === 'word-to-pdf') {
                this.convertToPDF();
            }
        });
    }

    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        this.wordUploadArea.classList.add('drag-over');
    }

    handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        this.wordUploadArea.classList.remove('drag-over');
    }

    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        this.wordUploadArea.classList.remove('drag-over');

        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            this.processWord(files[0]);
        }
    }

    handleWordSelect(e) {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            this.processWord(files[0]);
        }
        e.target.value = '';
    }

    async processWord(file) {
        const validExtensions = ['.docx', '.doc'];
        const isValid = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));

        if (!isValid) {
            this.imageConverter.showToast('Please select a valid Word file (.docx or .doc)');
            return;
        }

        this.imageConverter.showLoading(true, 'Loading Word file...');

        try {
            this.wordFile = file;

            this.wordFileName.textContent = file.name;
            const sizeKB = (file.size / 1024).toFixed(2);
            this.wordFileSize.textContent = `${sizeKB} KB`;

            this.wordPreviewSection.style.display = 'block';
            this.imageConverter.actionsSection.classList.add('active');

            this.imageConverter.showLoading(false);
            this.imageConverter.showToast('Word file loaded successfully');

        } catch (error) {
            console.error('Error loading Word file:', error);
            this.imageConverter.showLoading(false);
            this.imageConverter.showToast('Error loading Word file. Please try again.');
        }
    }

    removeWord() {
        this.wordFile = null;
        this.wordPreviewSection.style.display = 'none';
        this.imageConverter.actionsSection.classList.remove('active');
        this.imageConverter.showToast('Word file removed');
    }

    async convertToPDF() {
        if (!this.wordFile) {
            this.imageConverter.showToast('Please upload a Word file first');
            return;
        }

        this.imageConverter.showLoading(true, 'Converting Word to PDF...');

        try {
            const arrayBuffer = await this.wordFile.arrayBuffer();
            const result = await mammoth.convertToHtml({ arrayBuffer: arrayBuffer });
            const html = result.value;

            // Create a temporary container for the HTML
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;
            tempDiv.style.padding = '20px';
            tempDiv.style.fontFamily = 'Arial, sans-serif';
            tempDiv.style.lineHeight = '1.6';

            // Use html2pdf to convert
            const opt = {
                margin: 10,
                filename: 'document.pdf',
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            const pdfBlob = await html2pdf().set(opt).from(tempDiv).outputPdf('blob');

            this.imageConverter.showLoading(false);

            const defaultFilename = this.wordFile.name.replace(/\.(docx|doc)$/i, '');

            this.filenameModal.show(defaultFilename, '.pdf', (filename) => {
                const url = window.URL.createObjectURL(pdfBlob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);

                this.imageConverter.showToast(`PDF downloaded: ${filename}`);
            });

        } catch (error) {
            console.error('Word to PDF conversion error:', error);
            this.imageConverter.showLoading(false);
            this.imageConverter.showToast('Error converting to PDF. Complex formatting may not be supported.');
        }
    }
}

// PPTX to PDF Converter (NEW - Placeholder)
class PPTXToPDFConverter {
    constructor(imageConverter, filenameModal) {
        this.imageConverter = imageConverter;
        this.filenameModal = filenameModal;
        this.pptxFile = null;
        this.initializeElements();
        this.attachEventListeners();
    }

    initializeElements() {
        this.pptxUploadArea = document.getElementById('pptxUploadArea');
        this.pptxFileInput = document.getElementById('pptxFileInput');
        this.pptxPreviewSection = document.getElementById('pptxPreviewSection');
        this.pptxFileName = document.getElementById('pptxFileName');
        this.pptxFileSize = document.getElementById('pptxFileSize');
        this.removePptxBtn = document.getElementById('removePptxBtn');
        this.convertBtn = document.getElementById('convertBtn');
    }

    attachEventListeners() {
        this.pptxUploadArea.addEventListener('click', () => this.pptxFileInput.click());
        this.pptxFileInput.addEventListener('change', (e) => this.handlePPTXSelect(e));

        this.pptxUploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.pptxUploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.pptxUploadArea.addEventListener('drop', (e) => this.handleDrop(e));

        this.removePptxBtn.addEventListener('click', () => this.removePPTX());

        this.convertBtn.addEventListener('click', () => {
            if (this.imageConverter.modeController.currentMode === 'pptx-to-pdf') {
                this.convertToPDF();
            }
        });
    }

    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        this.pptxUploadArea.classList.add('drag-over');
    }

    handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        this.pptxUploadArea.classList.remove('drag-over');
    }

    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        this.pptxUploadArea.classList.remove('drag-over');

        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            this.processPPTX(files[0]);
        }
    }

    handlePPTXSelect(e) {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            this.processPPTX(files[0]);
        }
        e.target.value = '';
    }

    async processPPTX(file) {
        const validExtensions = ['.pptx', '.ppt'];
        const isValid = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));

        if (!isValid) {
            this.imageConverter.showToast('Please select a valid PowerPoint file (.pptx or .ppt)');
            return;
        }

        this.imageConverter.showLoading(true, 'Loading PowerPoint file...');

        try {
            this.pptxFile = file;

            this.pptxFileName.textContent = file.name;
            const sizeKB = (file.size / 1024).toFixed(2);
            this.pptxFileSize.textContent = `${sizeKB} KB`;

            this.pptxPreviewSection.style.display = 'block';
            this.imageConverter.actionsSection.classList.add('active');

            this.imageConverter.showLoading(false);
            this.imageConverter.showToast('PowerPoint file loaded successfully');

        } catch (error) {
            console.error('Error loading PowerPoint file:', error);
            this.imageConverter.showLoading(false);
            this.imageConverter.showToast('Error loading PowerPoint file. Please try again.');
        }
    }

    removePPTX() {
        this.pptxFile = null;
        this.pptxPreviewSection.style.display = 'none';
        this.imageConverter.actionsSection.classList.remove('active');
        this.imageConverter.showToast('PowerPoint file removed');
    }

    async convertToPDF() {
        if (!this.pptxFile) {
            this.imageConverter.showToast('Please upload a PowerPoint file first');
            return;
        }

        // Show message about PPTX limitation
        this.imageConverter.showToast('PPTX to PDF conversion requires a server/API service. Feature coming soon!');

        // Note: True PPTX to PDF conversion would require either:
        // 1. A commercial SDK like Apryse or Nutrient
        // 2. A server-side API (LibreOffice, CloudConvert, etc.)
        // 3. Manual implementation which is extremely complex
    }
}

// Initialize all converters
const filenameModal = new FilenameModal();
const modeController = new ModeController();
const imageConverter = new ImageToPDFConverter(modeController, filenameModal);
const pdfConverter = new PDFToWordConverter(imageConverter, filenameModal);
const wordConverter = new WordToPDFConverter(imageConverter, filenameModal);
const pptxConverter = new PPTXToPDFConverter(imageConverter, filenameModal);

// Add fadeOut animation
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        from {
            opacity: 1;
            transform: scale(1);
        }
        to {
            opacity: 0;
            transform: scale(0.8);
        }
    }
`;
document.head.appendChild(style);
