
/* =========================================
   DIGITAL DOCUMENT ORGANIZER
   DOCUMATE
   ========================================= */

/*
   This project uses IndexedDB to store
   document information and actual files.
*/

// =========================================
// 1. GET HTML ELEMENTS
// =========================================

const openUploadBtn = document.getElementById("openUploadBtn");
const uploadModal = document.getElementById("uploadModal");

const closeUploadBtn = document.getElementById("closeUploadBtn");
const cancelUploadBtn = document.getElementById("cancelUploadBtn");

const uploadForm = document.getElementById("uploadForm");

const documentNameInput = document.getElementById("documentName");
const documentCategoryInput = document.getElementById("documentCategory");
const documentDescriptionInput = document.getElementById("documentDescription");
const documentFileInput = document.getElementById("documentFile");

const documentContainer = document.getElementById("documentContainer");

const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");

const totalDocuments = document.getElementById("totalDocuments");
const pdfDocuments = document.getElementById("pdfDocuments");
const imageDocuments = document.getElementById("imageDocuments");
const otherDocuments = document.getElementById("otherDocuments");

const documentCount = document.getElementById("documentCount");

const submitUploadBtn = document.getElementById("submitUploadBtn");


// =========================================
// 2. DATABASE SETTINGS
// =========================================

const DATABASE_NAME = "DocuMateDatabase";
const DATABASE_VERSION = 1;

let database;


// =========================================
// 3. OPEN INDEXEDDB DATABASE
// =========================================

function openDatabase() {

    return new Promise((resolve, reject) => {

        const request = indexedDB.open(
            DATABASE_NAME,
            DATABASE_VERSION
        );

        // Create database structure

        request.onupgradeneeded = function (event) {

            const db = event.target.result;

            if (!db.objectStoreNames.contains("documents")) {

                const store = db.createObjectStore(
                    "documents",
                    {
                        keyPath: "id",
                        autoIncrement: true
                    }
                );

                store.createIndex(
                    "name",
                    "name",
                    { unique: false }
                );

                store.createIndex(
                    "category",
                    "category",
                    { unique: false }
                );

            }

        };

        // Database opened successfully

        request.onsuccess = function (event) {

            database = event.target.result;

            resolve(database);

        };

        // Database error

        request.onerror = function () {

            reject(request.error);

        };

    });

}


// =========================================
// 4. SAVE DOCUMENT
// =========================================

function saveDocument(documentData) {

    return new Promise((resolve, reject) => {

        const transaction = database.transaction(
            ["documents"],
            "readwrite"
        );

        const store = transaction.objectStore("documents");

        const request = store.add(documentData);

        request.onsuccess = function () {

            resolve(request.result);

        };

        request.onerror = function () {

            reject(request.error);

        };

    });

}


// =========================================
// 5. GET ALL DOCUMENTS
// =========================================

function getAllDocuments() {

    return new Promise((resolve, reject) => {

        const transaction = database.transaction(
            ["documents"],
            "readonly"
        );

        const store = transaction.objectStore("documents");

        const request = store.getAll();

        request.onsuccess = function () {

            resolve(request.result);

        };

        request.onerror = function () {

            reject(request.error);

        };

    });

}


// =========================================
// 6. GET ONE DOCUMENT
// =========================================

function getDocumentById(id) {

    return new Promise((resolve, reject) => {

        const transaction = database.transaction(
            ["documents"],
            "readonly"
        );

        const store = transaction.objectStore("documents");

        const request = store.get(Number(id));

        request.onsuccess = function () {

            resolve(request.result);

        };

        request.onerror = function () {

            reject(request.error);

        };

    });

}


// =========================================
// 7. DELETE DOCUMENT
// =========================================

function deleteDocument(id) {

    return new Promise((resolve, reject) => {

        const transaction = database.transaction(
            ["documents"],
            "readwrite"
        );

        const store = transaction.objectStore("documents");

        const request = store.delete(Number(id));

        request.onsuccess = function () {

            resolve();

        };

        request.onerror = function () {

            reject(request.error);

        };

    });

}


// =========================================
// 8. OPEN UPLOAD MODAL
// =========================================

function openModal() {

    uploadModal.style.display = "flex";

}

openUploadBtn.addEventListener("click", openModal);


// =========================================
// 9. CLOSE UPLOAD MODAL
// =========================================

function closeModal() {

    uploadModal.style.display = "none";

}

closeUploadBtn.addEventListener("click", closeModal);

cancelUploadBtn.addEventListener("click", closeModal);


// Close modal when clicking outside

uploadModal.addEventListener("click", function (event) {

    if (event.target === uploadModal) {

        closeModal();

    }

});


// Close modal with Escape key

document.addEventListener("keydown", function (event) {

    if (event.key === "Escape") {

        closeModal();

    }

});


// =========================================
// 10. UPLOAD DOCUMENT
// =========================================

uploadForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const name = documentNameInput.value.trim();

    const category = documentCategoryInput.value;

    const description = documentDescriptionInput.value.trim();

    const file = documentFileInput.files[0];


    // Validate document name

    if (!name) {

        alert("Please enter a document name.");

        return;

    }


    // Validate category

    if (!category) {

        alert("Please select a category.");

        return;

    }


    // Validate file

    if (!file) {

        alert("Please select a document.");

        return;

    }


    // Allowed file types

    const allowedTypes = [

        "application/pdf",

        "application/msword",

        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

        "image/jpeg",

        "image/png"

    ];


    if (!allowedTypes.includes(file.type)) {

        alert("Unsupported file type. Please select a PDF, DOC, DOCX, JPG, or PNG file.");

        return;

    }


    // Limit file size to 10MB

    const MAX_FILE_SIZE = 10 * 1024 * 1024;

    if (file.size > MAX_FILE_SIZE) {

        alert("File is too large. Maximum file size is 10MB.");

        return;

    }


    // Disable button while saving

    submitUploadBtn.disabled = true;

    submitUploadBtn.textContent = "Uploading...";


    try {

        // Prepare document data

        const documentData = {

            name: name,

            category: category,

            description: description,

            fileName: file.name,

            fileType: file.type,

            fileSize: file.size,

            file: file,

            dateAdded: new Date().toISOString()

        };


        // Save to database

        await saveDocument(documentData);


        // Clear form

        uploadForm.reset();


        // Close modal

        closeModal();


        // Refresh dashboard

        await renderDocuments();


        alert("Document uploaded successfully!");

    }

    catch (error) {

        console.error("Upload error:", error);

        alert("Unable to upload document. Please try again.");

    }

    finally {

        submitUploadBtn.disabled = false;

        submitUploadBtn.textContent = "Upload Document";

    }

});


// =========================================
// 11. FORMAT FILE SIZE
// =========================================

function formatFileSize(bytes) {

    if (bytes < 1024) {

        return bytes + " B";

    }

    if (bytes < 1024 * 1024) {

        return (bytes / 1024).toFixed(1) + " KB";

    }

    return (bytes / (1024 * 1024)).toFixed(2) + " MB";

}


// =========================================
// 12. GET FILE TYPE LABEL
// =========================================

function getFileLabel(fileName) {

    const extension = fileName
        .split(".")
        .pop()
        .toUpperCase();

    return extension;

}


// =========================================
// 13. ESCAPE HTML TEXT
// =========================================

function escapeHTML(value) {

    return String(value).replace(/[&<>"']/g, function (character) {

        const entities = {

            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"

        };

        return entities[character];

    });

}


// =========================================
// 14. UPDATE DASHBOARD STATISTICS
// =========================================

function updateStatistics(documents) {

    let pdfCount = 0;

    let imageCount = 0;

    let otherCount = 0;


    documents.forEach(function (document) {

        const extension = getFileLabel(document.fileName);


        if (extension === "PDF") {

            pdfCount++;

        }

        else if (

            extension === "JPG" ||

            extension === "JPEG" ||

            extension === "PNG"

        ) {

            imageCount++;

        }

        else {

            otherCount++;

        }

    });


    totalDocuments.textContent = documents.length;

    pdfDocuments.textContent = pdfCount;

    imageDocuments.textContent = imageCount;

    otherDocuments.textContent = otherCount;

}


// =========================================
// 15. DISPLAY DOCUMENTS
// =========================================

async function renderDocuments() {

    try {

        const documents = await getAllDocuments();


        // Update statistics

        updateStatistics(documents);


        // Search value

        const searchValue = searchInput.value
            .trim()
            .toLowerCase();


        // Selected category

        const selectedCategory = categoryFilter.value;


        // Filter documents

        const filteredDocuments = documents.filter(function (document) {

            const matchesName = document.name
                .toLowerCase()
                .includes(searchValue);

            const matchesCategory =

                selectedCategory === "All" ||

                document.category === selectedCategory;


            return matchesName && matchesCategory;

        });


        // Update document count

        documentCount.textContent =

            filteredDocuments.length +

            (filteredDocuments.length === 1
                ? " document"
                : " documents");


        // Empty state

        if (filteredDocuments.length === 0) {

            documentContainer.innerHTML = `

                <div class="empty-state">

                    <h3>No Documents Found</h3>

                    <p>
                        Upload a document or change your search.
                    </p>

                </div>

            `;

            return;

        }


        // Create document list

        let documentHTML = `<div class="document-list">`;


        filteredDocuments.forEach(function (document) {

            const safeName = escapeHTML(document.name);

            const safeCategory = escapeHTML(document.category);

            const safeDescription = escapeHTML(
                document.description || "No description provided."
            );

            const safeFileName = escapeHTML(document.fileName);

            const fileLabel = escapeHTML(
                getFileLabel(document.fileName)
            );

            const fileSize = formatFileSize(document.fileSize);


            documentHTML += `

                <div class="document-card">

                    <div class="document-icon">

                        ${fileLabel}

                    </div>

                    <h3>${safeName}</h3>

                    <p>${safeDescription}</p>

                    <p>

                        <strong>File:</strong>

                        ${safeFileName}

                    </p>

                    <p>

                        <strong>Size:</strong>

                        ${fileSize}

                    </p>

                    <p>

                        <strong>Added:</strong>

                        ${new Date(
                            document.dateAdded
                        ).toLocaleDateString()}

                    </p>

                    <span class="document-category">

                        ${safeCategory}

                    </span>

                    <div class="document-actions">

                        <button
                            class="view-btn"
                            data-action="view"
                            data-id="${document.id}"
                        >

                            View

                        </button>

                        <button
                            class="download-btn"
                            data-action="download"
                            data-id="${document.id}"
                        >

                            Download

                        </button>

                        <button
                            class="delete-btn"
                            data-action="delete"
                            data-id="${document.id}"
                        >

                            Delete

                        </button>

                    </div>

                </div>

            `;

        });


        documentHTML += `</div>`;


        // Display documents

        documentContainer.innerHTML = documentHTML;

    }

    catch (error) {

        console.error("Display error:", error);

        documentContainer.innerHTML = `

            <div class="empty-state">

                <h3>Unable to Load Documents</h3>

                <p>Please refresh the page and try again.</p>

            </div>

        `;

    }

}


// =========================================
// 16. VIEW DOCUMENT
// =========================================

async function viewDocument(id) {

    try {

        const document = await getDocumentById(id);


        if (!document) {

            alert("Document not found.");

            return;

        }


        // Create temporary file URL

        const fileURL = URL.createObjectURL(document.file);


        // Open file in a new tab

        const newWindow = window.open(
            fileURL,
            "_blank",
            "noopener"
        );


        if (!newWindow) {

            URL.revokeObjectURL(fileURL);

            alert("Please allow pop-ups to view this document.");

            return;

        }


        // Revoke URL after a delay

        setTimeout(function () {

            URL.revokeObjectURL(fileURL);

        }, 60000);

    }

    catch (error) {

        console.error("View error:", error);

        alert("Unable to open this document.");

    }

}


// =========================================
// 17. DOWNLOAD DOCUMENT
// =========================================

async function downloadDocument(id) {

    try {

        const document = await getDocumentById(id);


        if (!document) {

            alert("Document not found.");

            return;

        }


        // Create temporary file URL

        const fileURL = URL.createObjectURL(document.file);


        // Create download link

        const link = document.createElement("a");

        link.href = fileURL;

        link.download = document.fileName;


        // Start download

        document.body.appendChild(link);

        link.click();

        link.remove();


        // Release temporary URL

        setTimeout(function () {

            URL.revokeObjectURL(fileURL);

        }, 1000);

    }

    catch (error) {

        console.error("Download error:", error);

        alert("Unable to download this document.");

    }

}


// =========================================
// 18. DELETE DOCUMENT
// =========================================

async function removeDocument(id) {

    const confirmDelete = confirm(

        "Are you sure you want to delete this document?"

    );


    if (!confirmDelete) {

        return;

    }


    try {

        await deleteDocument(id);


        // Refresh dashboard

        await renderDocuments();


        alert("Document deleted successfully!");

    }

    catch (error) {

        console.error("Delete error:", error);

        alert("Unable to delete this document.");

    }

}


// =========================================
// 19. DOCUMENT ACTIONS
// =========================================

documentContainer.addEventListener("click", function (event) {

    const button = event.target.closest("button[data-action]");


    if (!button) {

        return;

    }


    const action = button.dataset.action;

    const id = button.dataset.id;


    if (action === "view") {

        viewDocument(id);

    }

    else if (action === "download") {

        downloadDocument(id);

    }

    else if (action === "delete") {

        removeDocument(id);

    }

});


// =========================================
// 20. SEARCH DOCUMENTS
// =========================================

searchInput.addEventListener("input", function () {

    renderDocuments();

});


// =========================================
// 21. FILTER DOCUMENTS
// =========================================

categoryFilter.addEventListener("change", function () {

    renderDocuments();

});


// =========================================
// 22. START APPLICATION
// =========================================

async function startApplication() {

    try {

        await openDatabase();


        // Load saved documents

        await renderDocuments();


        console.log("DocuMate started successfully.");

    }

    catch (error) {

        console.error("Database error:", error);

        alert(

            "Unable to open the document database. " +

            "Please use a modern browser and try again."

        );

    }

}


// Start the application

startApplication();
