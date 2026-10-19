// Persona-style names for the time of day, shared by the menu HUD and the monitor's lock screen.

const TIMES_OF_DAY: [endHour: number, label: string][] = [
  [1, 'Dark Hour'],
  [5, 'Late Night'],
  [8, 'Early Morning'],
  [11, 'Morning'],
  [13, 'Lunchtime'],
  [16, 'Afternoon'],
  [18, 'After School'],
  [24, 'Evening'],
]

export const timeOfDay = (hour: number) => TIMES_OF_DAY.find(([end]) => hour < end)![1]
