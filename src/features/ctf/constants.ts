/** customId of the "Create CTF" button on the permanent panel. */
export const CTF_CREATE_BUTTON_ID = "ctf:create";

/** customId of the modal shown when the button is clicked. */
export const CTF_MODAL_ID = "ctf:modal";

/**
 * Prefix for the per-channel "Archive CTF" button. The channel id is appended,
 * e.g. `ctf:archive:123456789012345678`, so the handler knows what to move.
 */
export const CTF_ARCHIVE_PREFIX = "ctf:archive:";

/** The category channel that archived CTF channels are moved into. */
export const CTF_ARCHIVE_CATEGORY_ID = "1553726264425193632";

/**
 * Field customIds inside the CTF modal.
 *
 * Note: Discord modals allow at most 5 text inputs, so these five are the
 * complete set.
 */
export const CTF_FIELDS = {
  name: "ctf-name",
  ctftime: "ctf-ctftime",
  dates: "ctf-dates",
  access: "ctf-access",
  description: "ctf-description",
} as const;
