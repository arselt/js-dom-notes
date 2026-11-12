const noteContainer = document.getElementById('noteContainer');
const addNoteButton = document.getElementById('addNote');
const ribbonList = document.getElementById('ribbons');
const notebookActions = document.getElementById('notebookActions');
const confirmDialog = document.getElementById('confirmDialog');
const notebookDialog = document.getElementById('notebookDialog');
const notebookNameInput = document.getElementById('notebookNameInput');

const NOTES_KEY = 'notes';
const NOTEBOOKS_KEY = 'notebooks';
const ACTIVE_NOTEBOOK_KEY = 'activeNotebook';
const RIBBON_COLOR_COUNT = 4; // keep in sync with $ribbon-colors in style.scss
const DEFAULT_NOTEBOOK = { id: 'general', name: 'General', colorIndex: 0 };

const state = { notebooks: [], notes: [], activeNotebookId: DEFAULT_NOTEBOOK.id };
let noteCounter = 1;

function readStorage(key, fallback) {
    try {
        return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
        return fallback;
    }
}

function loadState() {
    const savedNotebooks = readStorage(NOTEBOOKS_KEY, []);
    const savedNotes = readStorage(NOTES_KEY, []);
    state.notebooks = Array.isArray(savedNotebooks) && savedNotebooks.length ? savedNotebooks : [DEFAULT_NOTEBOOK];
    // Notes saved before notebooks existed belong to "General".
    const firstNotebookId = state.notebooks[0].id;
    state.notes = (Array.isArray(savedNotes) ? savedNotes : []).map(note => ({
        ...note,
        notebookId: state.notebooks.some(notebook => notebook.id === note.notebookId) ? note.notebookId : firstNotebookId
    }));
    const savedActiveId = readStorage(ACTIVE_NOTEBOOK_KEY, firstNotebookId);
    state.activeNotebookId = state.notebooks.some(notebook => notebook.id === savedActiveId) ? savedActiveId : firstNotebookId;
    noteCounter = state.notes.reduce((max, note) => Math.max(max, parseInt(note.id.replace('note', ''), 10) || 0), 0) + 1;
}

function persist() {
    localStorage.setItem(NOTEBOOKS_KEY, JSON.stringify(state.notebooks));
    localStorage.setItem(NOTES_KEY, JSON.stringify(state.notes));
    localStorage.setItem(ACTIVE_NOTEBOOK_KEY, JSON.stringify(state.activeNotebookId));
}

function getActiveNotebook() {
    return state.notebooks.find(notebook => notebook.id === state.activeNotebookId);
}

// ---------- Notes ----------

function renderNotes() {
    noteContainer.replaceChildren();
    state.notes
        .filter(note => note.notebookId === state.activeNotebookId)
        .forEach((note, index) => {
            const article = createNoteElement(note);
            article.style.setProperty('--enter-delay', `${Math.min(index, 12) * 60}ms`);
            noteContainer.appendChild(article);
        });
}

function addNote() {
    const note = { id: `note${noteCounter++}`, notebookId: state.activeNotebookId, content: '' };
    state.notes.push(note);
    noteContainer.appendChild(createNoteElement(note));
    persist();
}

function createNoteElement(note) {
    const article = document.createElement('article');

    const textarea = document.createElement('textarea');
    textarea.id = note.id;
    textarea.value = note.content;
    textarea.setAttribute('aria-label', 'Note');
    textarea.placeholder = 'Write something…';
    textarea.addEventListener('input', () => {
        note.content = textarea.value;
        persist();
    });

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.classList.add('delete-button', 'button');
    deleteButton.textContent = 'delete note';
    deleteButton.addEventListener('click', () => {
        askConfirmation('Permanently delete this note?', () => removeNote(note, article));
    });

    article.appendChild(textarea);
    article.appendChild(deleteButton);

    // Deterministic slight tilt (-1.6deg to 1.6deg) so each note rests a bit crooked.
    const noteNumber = parseInt(note.id.replace('note', ''), 10) || 0;
    article.style.setProperty('--rest-rotation', `${((noteNumber % 5) - 2) * 0.8}deg`);

    article.addEventListener('pointermove', tiltNote);
    article.addEventListener('pointerleave', resetTilt);

    return article;
}

function tiltNote(e) {
    if (e.pointerType !== 'mouse') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = (e.clientX - rect.left) / rect.width - 0.5;
    const offsetY = (e.clientY - rect.top) / rect.height - 0.5;
    e.currentTarget.style.setProperty('--tilt-x', `${-offsetY * 14}deg`);
    e.currentTarget.style.setProperty('--tilt-y', `${offsetX * 14}deg`);
}

function resetTilt(e) {
    e.currentTarget.style.setProperty('--tilt-x', '0deg');
    e.currentTarget.style.setProperty('--tilt-y', '0deg');
}

function removeNote(note, article) {
    const finishRemoval = () => {
        state.notes = state.notes.filter(item => item !== note);
        article.remove();
        persist();
    };
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        finishRemoval();
        return;
    }
    article.classList.add('is-removing');
    article.addEventListener('animationend', finishRemoval, { once: true });
}

// ---------- Notebooks ----------

function renderNotebooks() {
    ribbonList.replaceChildren();
    state.notebooks.forEach(notebook => {
        const ribbon = document.createElement('button');
        ribbon.type = 'button';
        ribbon.className = 'button ribbon';
        ribbon.dataset.color = notebook.colorIndex;
        ribbon.textContent = notebook.name;
        if (notebook.id === state.activeNotebookId) ribbon.setAttribute('aria-current', 'true');
        ribbon.addEventListener('click', () => selectNotebook(notebook.id));
        ribbonList.appendChild(ribbon);
    });

    const addRibbon = document.createElement('button');
    addRibbon.type = 'button';
    addRibbon.className = 'button ribbon ribbon-add';
    addRibbon.textContent = '+';
    addRibbon.setAttribute('aria-label', 'New notebook');
    addRibbon.addEventListener('click', () => askNotebookName('New notebook', '', createNotebook));
    ribbonList.appendChild(addRibbon);

    notebookActions.replaceChildren();
    const renameButton = createActionButton('rename', () => {
        askNotebookName('Rename notebook', getActiveNotebook().name, renameNotebook);
    });
    notebookActions.appendChild(renameButton);
    if (state.notebooks.length > 1) {
        notebookActions.appendChild(createActionButton('delete notebook', () => {
            askConfirmation(`Delete “${getActiveNotebook().name}” and all its notes?`, deleteNotebook);
        }));
    }
}

function createActionButton(label, onClick) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'button action-button';
    button.textContent = label;
    button.addEventListener('click', onClick);
    return button;
}

function selectNotebook(notebookId) {
    if (notebookId === state.activeNotebookId) return;
    state.activeNotebookId = notebookId;
    persist();
    renderNotebooks();
    renderNotes();
}

function createNotebook(name) {
    const notebook = { id: crypto.randomUUID(), name, colorIndex: state.notebooks.length % RIBBON_COLOR_COUNT };
    state.notebooks.push(notebook);
    selectNotebook(notebook.id);
}

function renameNotebook(name) {
    getActiveNotebook().name = name;
    persist();
    renderNotebooks();
}

function deleteNotebook() {
    const deletedId = state.activeNotebookId;
    state.notebooks = state.notebooks.filter(notebook => notebook.id !== deletedId);
    state.notes = state.notes.filter(note => note.notebookId !== deletedId);
    state.activeNotebookId = state.notebooks[0].id;
    persist();
    renderNotebooks();
    renderNotes();
}

// ---------- Dialogs ----------

let onConfirm = null;
let onNotebookName = null;

function askConfirmation(message, callback) {
    onConfirm = callback;
    document.getElementById('confirmDialogMessage').textContent = message;
    confirmDialog.showModal();
}

confirmDialog.addEventListener('close', () => {
    const callback = onConfirm;
    const isConfirmed = confirmDialog.returnValue === 'confirm';
    onConfirm = null;
    confirmDialog.returnValue = ''; // Escape keeps the previous value otherwise
    if (isConfirmed && callback) callback();
});

function askNotebookName(title, currentName, callback) {
    onNotebookName = callback;
    document.getElementById('notebookDialogTitle').textContent = title;
    notebookNameInput.value = currentName;
    notebookDialog.showModal();
    notebookNameInput.select();
}

notebookDialog.addEventListener('close', () => {
    const callback = onNotebookName;
    const isConfirmed = notebookDialog.returnValue === 'confirm';
    const name = notebookNameInput.value.trim();
    onNotebookName = null;
    notebookDialog.returnValue = '';
    if (isConfirmed && name && callback) callback(name);
});

addNoteButton.addEventListener('click', addNote);

loadState();
renderNotebooks();
renderNotes();
