import { ref } from "vue";

export const showAssignmentModal = ref(false);
export const showEmailBox = ref(false);
export const showCommentBox = ref(false);

// LCS: which message types the "Konversation" tab shows.
// "alle" = everything, "comment" = only internal notes, "email" = only mails.
export type ConversationFilter = "alle" | "comment" | "email";
export const conversationFilter = ref<ConversationFilter>("alle");
export function toggleEmailBox() {
  if (showCommentBox.value) {
    showCommentBox.value = false;
  }
  showEmailBox.value = !showEmailBox.value;
}
export function toggleCommentBox() {
  if (showEmailBox.value) {
    showEmailBox.value = false;
  }
  showCommentBox.value = !showCommentBox.value;
}
