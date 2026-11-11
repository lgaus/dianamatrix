<script lang="ts">
// id кнопки таба: по нему область табов (tabpanel) ссылается на выбранный таб (aria-labelledby)
export const formTabId = (prefix: string, tabId: string) => `${prefix}-${tabId}`
</script>

<script setup lang="ts" generic="T extends string">
import { innerFocusClass, interactiveClass } from '~/config/feedback'

// Переключатель режима формы («Личная / Для пары»).
// Недоступный таб виден и получает фокус с клавиатуры (aria-disabled), но не выбирается; рядом — пометка note.
// У недоступного таба нет aria-controls: он не управляет областью.
export interface FormTab<Id extends string> {
  id: Id
  label: string
  disabled?: boolean
  // Маленькая пометка после подписи (например, «скоро»)
  note?: string
}

defineProps<{
  tabs: ReadonlyArray<FormTab<T>>
  // Префикс id кнопок табов (id = formTabId(idPrefix, tab.id))
  idPrefix: string
  // id области, которой управляют табы (aria-controls)
  controls?: string
}>()

const selected = defineModel<T>({ required: true })

const select = (tab: FormTab<T>) => {
  if (!tab.disabled) selected.value = tab.id
}

// Стрелки влево/вправо переводят фокус на соседний таб (по кругу, в порядке разметки), выбор — Enter или пробелом
const moveFocus = (event: KeyboardEvent, step: number) => {
  const current = event.currentTarget as HTMLElement
  const tabElements = Array.from(current.parentElement?.querySelectorAll<HTMLElement>('[role="tab"]') ?? [])
  const index = tabElements.indexOf(current)
  if (index === -1) return
  tabElements[(index + step + tabElements.length) % tabElements.length]?.focus()
}
</script>

<template>
  <div
    class="flex h-13 gap-1 rounded-field bg-page p-1"
    role="tablist"
    data-testid="form-tabs"
  >
    <button
      v-for="tab in tabs"
      :id="formTabId(idPrefix, tab.id)"
      :key="tab.id"
      type="button"
      role="tab"
      class="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-tab text-nav font-medium"
      :class="[
        interactiveClass,
        innerFocusClass,
        tab.id === selected ? 'bg-surface text-ink' : 'text-ink-muted',
        tab.disabled ? 'cursor-default' : 'cursor-pointer',
      ]"
      :aria-selected="tab.id === selected"
      :aria-disabled="tab.disabled || undefined"
      :aria-controls="tab.disabled ? undefined : controls"
      :tabindex="tab.id === selected ? 0 : -1"
      :data-testid="`form-tab-${tab.id}`"
      @click="select(tab)"
      @keydown.left.prevent="moveFocus($event, -1)"
      @keydown.right.prevent="moveFocus($event, 1)"
    >
      {{ tab.label }}
      <span
        v-if="tab.note"
        class="text-xs"
      >
        {{ tab.note }}
      </span>
    </button>
  </div>
</template>
