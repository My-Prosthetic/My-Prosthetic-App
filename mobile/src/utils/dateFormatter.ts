export type DateFormatMode = 
  | 'numeric'         // YYYY-MM-DD
  | 'label'           // Today/dayname monthName YYYY


const DAY_NAMES = ['Niedz.', 'Pon.', 'Wt.', 'Śr.', 'Czw.', 'Pt.', 'Sob.'];
const MONTH_NAMES = ['sty', 'lut', 'mar', 'kwi', 'maj', 'cze', 'lip', 'sie', 'wrz', 'paź', 'lis', 'gru'];

export const formatDate = (
  date: Date, 
  mode: DateFormatMode = 'numeric',
  referenceDate: Date = new Date()
): string => {
  const isToday = date.toDateString() === referenceDate.toDateString();

  const year = date.getFullYear();
  const monthNum = String(date.getMonth() + 1).padStart(2, '0');
  const dayNum = String(date.getDate()).padStart(2, '0');
  const numericDate = `${year}-${monthNum}-${dayNum}`;

  switch (mode) {
    case 'numeric':
      return isToday ? 'Dzisiaj ('+numericDate+')' : numericDate;

    case 'label':
        const dayName = DAY_NAMES[date.getDay()];
        const monthName = MONTH_NAMES[date.getMonth()];
        return isToday ? `Dzisiaj (${dayName} ${dayNum} ${monthName} ${year})` : `${dayName} ${dayNum} ${monthName} ${year}`
    }
};