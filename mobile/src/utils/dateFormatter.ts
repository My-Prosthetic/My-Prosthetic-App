import i18n from "@/translations/i18n";

export type DateFormatMode = 
  | 'numeric'         // YYYY-MM-DD
  | 'label'           // Today/dayname monthName YYYY


export const formatDate = (
  date: Date, 
  mode: DateFormatMode = 'numeric',
  referenceDate: Date = new Date()
): string => {
  const locale = i18n.language;

  const isToday = date.toDateString() === referenceDate.toDateString();
  const year = date.getFullYear();
  const monthNum = String(date.getMonth() + 1).padStart(2, '0');
  const dayNum = String(date.getDate()).padStart(2, '0');
  const numericDate = `${year}-${monthNum}-${dayNum}`;
  const todayLabel = i18n.t('common.today');

  switch (mode) {
    case 'numeric':
      return isToday ? `${todayLabel} (${numericDate})` : numericDate;

    case 'label':
      const formatter = new Intl.DateTimeFormat(locale, {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });

      const formattedLabel = formatter.format(date);
      return isToday ? `${todayLabel} (${formattedLabel})` : formattedLabel;
    }
};