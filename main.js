const noteContainer = document.getElementById("noteContainer")

const addNoteButton = document.getElementById("addNote")

addNoteButton.addEventListener("click", () => {
	addNote = noteContainer.insertAdjacentHTML("beforeend", "<article><textarea></textarea><button>delete note</button></article>")
})