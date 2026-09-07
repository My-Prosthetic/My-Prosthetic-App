import { DropdownOption } from '@/src/components/DropdownSelect';
import { TFunction } from 'i18next';

export const FUNDING_SOURCE_IDS = [
  'family',
  'fundraiser',
  'grant',
  'savings',
  'other',
] as const;

export type FundingSource = (typeof FUNDING_SOURCE_IDS)[number];

export const getFundingSourceOptions = (t: TFunction): DropdownOption<FundingSource>[] =>
  FUNDING_SOURCE_IDS.map((id) => ({
    value: id,
    label: t(`funds.sources.${id}`),
  }));