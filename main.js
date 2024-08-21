const noteContainer = document.getElementById("noteContainer");
const addNoteButton = document.getElementById("addNote");

let noteCounter = 1;

document.addEventListener('DOMContentLoaded', loadNotes);

function loadNotes() {
    const savedNotes = JSON.parse(localStorage.getItem('notes')) || [];

    savedNotes.forEach(note => {
        const article = createNoteElement(note.id, note.content);
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
    textarea.addEventListener('input', saveNotes);

    const deleteButton = document.createElement('a');
    deleteButton.classList.add('delete-button', 'button');
    deleteButton.textContent = 'delete note';
    deleteButton.addEventListener('click', () => {
        deleteNote(article);
    });

    article.appendChild(textarea);
    article.appendChild(deleteButton);
    article.dataset.id = id;

    return article;
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
    if (confirm("Permanently delete this note?")) {
        noteItem.remove();
        saveNotes();
    }
}

addNoteButton.addEventListener("click", () => {
    addNoteFunc();
});
