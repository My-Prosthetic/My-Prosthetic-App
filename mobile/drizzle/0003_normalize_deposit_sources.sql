UPDATE `deposits`
SET `source` = CASE `source`
  WHEN 'Rodzina' THEN 'family'
  WHEN 'Zbiórka' THEN 'fundraiser'
  WHEN 'Zrzutka.pl' THEN 'fundraiser'
  WHEN 'Fundraiser' THEN 'fundraiser'
  WHEN 'Grant' THEN 'grant'
  WHEN 'Dotacja' THEN 'grant'
  WHEN 'Oszczędności' THEN 'savings'
  WHEN 'Wpłata własna' THEN 'savings'
  WHEN 'Savings' THEN 'savings'
  WHEN 'Inne' THEN 'other'
  WHEN 'Fundacja' THEN 'other'
  WHEN 'Program' THEN 'other'
  WHEN 'Wpłata' THEN 'other'
  WHEN 'Other' THEN 'other'
  ELSE `source`
END;