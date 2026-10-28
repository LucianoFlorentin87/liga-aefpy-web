/** Las fechas de fixture se guardan como días UTC y la hora como HH:mm local. */
export function upcomingScheduleFilter(now = new Date()): { OR: [{ date: { gt: Date } }, { date: Date; time: { gte: string } }] } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Asuncion", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(now);
  const value = (type: string) => parts.find(part => part.type === type)!.value;
  const today = new Date(value("year") + "-" + value("month") + "-" + value("day") + "T00:00:00.000Z");
  const time = value("hour") + ":" + value("minute");
  return { OR: [{ date: { gt: today } }, { date: today, time: { gte: time } }] };
}
