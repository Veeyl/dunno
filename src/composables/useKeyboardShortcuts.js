import { onBeforeUnmount, onMounted } from 'vue'

const TEXT_FIELDS = ['INPUT', 'TEXTAREA', 'SELECT']

/**
 * Register page-level keyboard shortcuts while the calling component is mounted.
 *
 * Usage:
 *   useKeyboardShortcuts({
 *     '/': () => searchInput.value.focus(),
 *     Enter: () => openCheckout(),
 *   })
 *
 * Rules:
 * - Shortcuts never fire while the user types in a text field.
 * - Enter is left alone on links/buttons focused via keyboard (so keyboard
 *   users can still activate them). After a mouse/touch click, focus doesn't
 *   match :focus-visible, so Enter goes to the shortcut instead.
 * - A handler may return `false` to signal "not handled" (default not prevented).
 */
export function useKeyboardShortcuts(shortcuts) {
  function onKeydown(event) {
    if (event.ctrlKey || event.metaKey || event.altKey || event.defaultPrevented) return

    const handler = shortcuts[event.key]
    if (!handler) return

    const target = event.target
    const isElement = target instanceof HTMLElement
    const isTyping = isElement && (target.isContentEditable || TEXT_FIELDS.includes(target.tagName))
    if (isTyping) return

    if (event.key === 'Enter' && isElement && ['BUTTON', 'A'].includes(target.tagName)) {
      let keyboardFocused = true
      try {
        keyboardFocused = target.matches(':focus-visible')
      } catch {
        /* very old browsers: assume keyboard focus */
      }
      if (keyboardFocused) return
    }

    const result = handler(event)
    if (result !== false) event.preventDefault()
  }

  onMounted(() => window.addEventListener('keydown', onKeydown))
  onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
}

