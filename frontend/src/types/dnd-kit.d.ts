declare module '@dnd-kit/core' {
  export const DndContext: any
  export const PointerSensor: any
  export const closestCenter: any
  export function useSensor(...args: any[]): any
  export function useSensors(...args: any[]): any
  export type DragEndEvent = any
}

declare module '@dnd-kit/sortable' {
  export const SortableContext: any
  export const arrayMove: any
  export const useSortable: any
  export const verticalListSortingStrategy: any
}

declare module '@dnd-kit/utilities' {
  export const CSS: any
}

declare module '@dnd-kit/modifiers' {
  export const restrictToVerticalAxis: any
  export const restrictToParentElement: any
}
