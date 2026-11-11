// Помощники для событий в тестах компонентов.

// Метка времени события для Vue. Vue пропускает всплывшее событие, если его метка времени (_vts) не позже подключения
// обработчика; при замороженном Date (vi.setSystemTime) метки равны, и обработчик (например, на корне DateField или
// на кнопке формы) не сработал бы. Так же делает trigger из @vue/test-utils. Возвращает то же событие
export const vtsFix = <T extends Event>(event: T): T => {
  (event as T & { _vts?: number })._vts = Date.now() + 1
  return event
}
