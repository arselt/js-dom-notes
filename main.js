const noteContainer = document.getElementById("noteContainer");
const addNoteButton = document.getElementById("addNote");

let noteCounter = 1;

document.addEventListener('DOMContentLoaded', loadNotes);

function loadNotes() {
    let savedNotes = [];
    try {
        savedNotes = JSON.parse(localStorage.getItem('notes')) || [];
    } catch {
        savedNotes = [];
    }

    savedNotes.forEach((note, index) => {
        const article = createNoteElement(note.id, note.content);
        article.style.setProperty('--enter-delay', `${Math.min(index, 12) * 60}ms`);
        noteContainer.appendChild(article);
    });

    noteCounter = savedNotes.length ? Math.max(...savedNotes.map(note => parseInt(note.id.replace('note', '')))) + 1 : 1;
}

function addNoteFunc() {
    const noteID = `note${noteCounter}`;
    const article = createNoteElement(noteID, '');
    noteContainer.appendChild(article);

    saveNotes();
    noteCounter++;
}

function createNoteElement(id, content) {
    const article = document.createElement('article');

    const textarea = document.createElement('textarea');
    textarea.id = id;
    textarea.value = content;
    textarea.setAttribute('aria-label', 'Note');
    textarea.placeholder = 'Write something…';
    textarea.addEventListener('input', saveNotes);

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.classList.add('delete-button', 'button');
    deleteButton.textContent = 'delete note';
    deleteButton.addEventListener('click', () => {
        deleteNote(article);
    });

    article.appendChild(textarea);
    article.appendChild(deleteButton);
    article.dataset.id = id;

    // Deterministic slight tilt (-1.6deg to 1.6deg) so each note rests a bit crooked.
    const noteNumber = parseInt(id.replace('note', ''), 10) || 0;
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

function saveNotes() {
    const articles = noteContainer.querySelectorAll('article');
    const notes = Array.from(articles).map(article => {
        return {
            id: article.dataset.id,
            content: article.querySelector('textarea').value
        };
    });

    localStorage.setItem('notes', JSON.stringify(notes));
}

function deleteNote(noteItem) {
    if (!confirm("Permanently delete this note?")) return;

    const removeNote = () => {
        noteItem.remove();
        saveNotes();
    };
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        removeNote();
        return;
    }
    noteItem.classList.add('is-removing');
    noteItem.addEventListener('animationend', removeNote, { once: true });
}

addNoteButton.addEventListener("click", () => {
    addNoteFunc();
});
