// Shared time slot list — used by both the booking page and the admin panel
export const TIME_SLOTS: string[] = [];

for (let hour = 9; hour < 17; hour++) {
  for (const minutes of [0, 30]) {
    const h    = hour % 12 === 0 ? 12 : hour % 12;
    const ampm = hour < 12 ? "AM" : "PM";
    const m    = minutes === 0 ? "00" : "30";
    TIME_SLOTS.push(`${h}:${m} ${ampm}`);
  }
}
