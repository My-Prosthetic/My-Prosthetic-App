import React from 'react';
import {
  Image,
  StyleSheet,
  View,
} from 'react-native';
import type { ParseKeys } from 'i18next';
import { ThemedText } from '../ThemedText';
import { ThemedView } from '../ThemedView';

export type LimbType = 'upper' | 'lower';

export type AmputationLevel =
  | 'hemipelvectomy'
  | 'hip_disarticulation'
  | 'short_thigh'
  | 'medium_thigh'
  | 'long_thigh'
  | 'knee_disarticulation'
  | 'short_lower_leg'
  | 'medium_lower_leg'
  | 'long_lower_leg'
  | 'syme'
  | 'partial_foot'
  | 'forequarter'
  | 'shoulder_disarticulation'
  | 'short_upper_arm'
  | 'medium_upper_arm'
  | 'long_upper_arm'
  | 'elbow_disarticulation'
  | 'short_forearm'
  | 'medium_forearm'
  | 'long_forearm'
  | 'wrist_disarticulation'
  | 'partial_hand';

interface LevelOption {
  value: AmputationLevel;
  labelKey: ParseKeys;
}

const LOWER_LEVELS: LevelOption[] = [
  {
    value: 'hemipelvectomy',
    labelKey:
      'newProsthesis.amputationLevels.lower.hemipelvectomy',
  },
  {
    value: 'hip_disarticulation',
    labelKey:
      'newProsthesis.amputationLevels.lower.hipDisarticulation',
  },
  {
    value: 'short_thigh',
    labelKey:
      'newProsthesis.amputationLevels.lower.shortThigh',
  },
  {
    value: 'medium_thigh',
    labelKey:
      'newProsthesis.amputationLevels.lower.mediumThigh',
  },
  {
    value: 'long_thigh',
    labelKey:
      'newProsthesis.amputationLevels.lower.longThigh',
  },
  {
    value: 'knee_disarticulation',
    labelKey:
      'newProsthesis.amputationLevels.lower.kneeDisarticulation',
  },
  {
    value: 'short_lower_leg',
    labelKey:
      'newProsthesis.amputationLevels.lower.shortLowerLeg',
  },
  {
    value: 'medium_lower_leg',
    labelKey:
      'newProsthesis.amputationLevels.lower.mediumLowerLeg',
  },
  {
    value: 'long_lower_leg',
    labelKey:
      'newProsthesis.amputationLevels.lower.longLowerLeg',
  },
  {
    value: 'syme',
    labelKey:
      'newProsthesis.amputationLevels.lower.syme',
  },
  {
    value: 'partial_foot',
    labelKey:
      'newProsthesis.amputationLevels.lower.partialFoot',
  },
];

const UPPER_LEVELS: LevelOption[] = [
  {
    value: 'forequarter',
    labelKey:
      'newProsthesis.amputationLevels.upper.forequarter',
  },
  {
    value: 'shoulder_disarticulation',
    labelKey:
      'newProsthesis.amputationLevels.upper.shoulderDisarticulation',
  },
  {
    value: 'short_upper_arm',
    labelKey:
      'newProsthesis.amputationLevels.upper.shortUpperArm',
  },
  {
    value: 'medium_upper_arm',
    labelKey:
      'newProsthesis.amputationLevels.upper.mediumUpperArm',
  },
  {
    value: 'long_upper_arm',
    labelKey:
      'newProsthesis.amputationLevels.upper.longUpperArm',
  },
  {
    value: 'elbow_disarticulation',
    labelKey:
      'newProsthesis.amputationLevels.upper.elbowDisarticulation',
  },
  {
    value: 'short_forearm',
    labelKey:
      'newProsthesis.amputationLevels.upper.shortForearm',
  },
  {
    value: 'medium_forearm',
    labelKey:
      'newProsthesis.amputationLevels.upper.mediumForearm',
  },
  {
    value: 'long_forearm',
    labelKey:
      'newProsthesis.amputationLevels.upper.longForearm',
  },
  {
    value: 'wrist_disarticulation',
    labelKey:
      'newProsthesis.amputationLevels.upper.wristDisarticulation',
  },
  {
    value: 'partial_hand',
    labelKey:
      'newProsthesis.amputationLevels.upper.partialHand',
  },
];

interface Props {
  limb: LimbType;
  value: AmputationLevel | null;
  onChange: (value: AmputationLevel) => void;
}

export function AmputationLevelSelector({
  limb,
  value,
  onChange,
}: Props) {
  const levels =
    limb === 'lower'
      ? LOWER_LEVELS
      : UPPER_LEVELS;

  const limbImage =
    limb === 'lower'
      ? require('../../../assets/images/amputation-lower.png')
      : require('../../../assets/images/amputation-upper.png');

  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        <Image
          source={limbImage}
          resizeMode="contain"
          style={styles.limbImage}
        />
      </View>

      <View style={styles.optionsContainer}>
        {levels.map((level) => {
          const selected =
            value === level.value;

          return (
            <View
              key={level.value}
              style={styles.optionRow}
            >
              <ThemedView
                style={[
                  styles.option,
                  selected &&
                    styles.optionSelected,
                ]}
                onPress={() =>
                  onChange(level.value)
                }
                accessibilityRole="radio"
                accessibilityState={{
                  checked: selected,
                }}
              >
                <ThemedText
                  tx={level.labelKey}
                  variant="body1Regular"
                  style={[
                    styles.optionText,
                    selected &&
                      styles.optionTextSelected,
                  ]}
                />
              </ThemedView>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 260,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    paddingVertical: 2,
  },

  imageContainer: {
  width: 105,
  height: 215,
  justifyContent: 'center',
  alignItems: 'center',
  marginRight: -2,
},

limbImage: {
  width: 105,
  height: 215,
},

  optionsContainer: {
    width: 112,
    height: 218,

    justifyContent: 'space-between',
    alignItems: 'flex-start',

    marginLeft: 0,
  },

  optionRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },

  option: {
    width: 105,
    height: 14,
    minHeight: 14,

    backgroundColor: '#FFFFFF',

    borderWidth: 0.43,
    borderColor: '#CBD5E1',
    borderRadius: 2,

    paddingHorizontal: 2,
    paddingVertical: 0,

    justifyContent: 'center',
    alignItems: 'center',
  },

  optionSelected: {
    backgroundColor: '#052D8F',
    borderColor: '#052D8F',
  },

  optionText: {
    width: '100%',

    fontFamily: 'Inter-Regular',
    fontWeight: '400',
    fontSize: 4.05,
    lineHeight: 4.8,
    letterSpacing: 0,

    textAlign: 'center',
    textAlignVertical: 'center',

    color: '#052D8F',
  },

  optionTextSelected: {
    color: '#FFFFFF',
  },
});