const noteContainer = document.getElementById("noteContainer")

const addNoteButton = document.getElementById("addNote")

addNoteButton.addEventListener("click", () => {
	addNote = noteContainer.insertAdjacentHTML("beforeend", "<article><textarea></textarea><button class='delete-button'>delete note</button></article>")
})

// removes note on button click
noteContainer.addEventListener("click", (event) => {
	if (event.target.classList.contains("delete-button")) {
		deleteNote(event.target.parentElement)
	}
})

function deleteNote(noteItem) {
	if (confirm("Permanently delete this note?")) {
		noteItem.remove();
	}
}