<script setup lang="ts">
import { interactiveClass, outerFocusClass } from '~/config/feedback'

// Поле формы: подпись, поле ввода, текст ошибки под ним.
// Атрибуты и обработчики (placeholder, inputmode, @input, aria-*) уходят на <input>, class — на корневой блок.
// Слот — всплывающие элементы, привязанные к полю (календарь у DateField); в разметке стоят перед <input>.
// reserveErrorSpace — место под строку ошибки занято всегда: появление ошибки не сдвигает то, что ниже.
defineOptions({ inheritAttrs: false })

const props = defineProps<{
  id: string
  label: string
  // Текст ошибки; пока его нет — поле в обычном состоянии
  error?: string
  reserveErrorSpace?: boolean
}>()

const value = defineModel<string>({ required: true })

const errorId = computed(() => `${props.id}-error`)

const input = ref<HTMLInputElement>()

defineExpose({
  focus: () => input.value?.focus(),
  input,
})
</script>

<template>
  <div :class="$attrs.class">
    <label
      :for="id"
      class="block text-sm leading-normal font-medium text-ink"
    >
      {{ label }}
    </label>
    <div class="relative mt-2">
      <slot />
      <input
        :id="id"
        ref="input"
        v-model="value"
        class="h-13 w-full rounded-field border bg-surface px-4 text-base text-ink placeholder:text-ink-muted lg:h-14 lg:px-5 lg:text-field"
        :class="[interactiveClass, outerFocusClass, error ? 'border-accent' : 'border-line-input']"
        :aria-invalid="error ? true : undefined"
        :aria-describedby="error ? errorId : undefined"
        v-bind="{ ...$attrs, class: undefined }"
      >
    </div>
    <!-- Строка ошибки: id и тестовый id — только когда ошибка есть (на неё ссылается aria-describedby).
         aria-live="polite": появление и смена ошибки зачитываются диктором после текущей фразы, не перебивая (role="alert" —
         assertive — перебил бы чтение поля, в которое переводится фокус при отправке). Зачитывание надёжно, только если
         строка уже есть в разметке до появления текста — с reserveErrorSpace (поле даты) -->
    <p
      v-if="error || reserveErrorSpace"
      :id="error ? errorId : undefined"
      aria-live="polite"
      class="mt-2 min-h-5 text-sm leading-5 text-accent"
      :data-testid="error ? `${id}-error` : undefined"
    >
      {{ error }}
    </p>
  </div>
</template>
