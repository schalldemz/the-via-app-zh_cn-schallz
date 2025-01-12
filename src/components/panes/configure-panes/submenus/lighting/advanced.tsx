import React from 'react';
import styled from 'styled-components';
import {
  getLightingDefinition,
  isVIADefinitionV2,
  LightingValue,
} from '@the-via/reader';
import {LightingControl, ControlMeta} from './lighting-control';
import {useAppSelector} from 'src/store/hooks';
import {getSelectedLightingData} from 'src/store/lightingSlice';
import {getSelectedDefinition} from 'src/store/definitionsSlice';
import type {FC} from 'react';

export const AdvancedLightingValues = [
  LightingValue.BACKLIGHT_DISABLE_WHEN_USB_SUSPENDED,
  LightingValue.BACKLIGHT_DISABLE_AFTER_TIMEOUT,
  LightingValue.BACKLIGHT_CAPS_LOCK_INDICATOR_COLOR,
  LightingValue.BACKLIGHT_CAPS_LOCK_INDICATOR_ROW_COL,
  LightingValue.BACKLIGHT_LAYER_1_INDICATOR_COLOR,
  LightingValue.BACKLIGHT_LAYER_1_INDICATOR_ROW_COL,
  LightingValue.BACKLIGHT_LAYER_2_INDICATOR_COLOR,
  LightingValue.BACKLIGHT_LAYER_2_INDICATOR_ROW_COL,
  LightingValue.BACKLIGHT_LAYER_3_INDICATOR_COLOR,
  LightingValue.BACKLIGHT_LAYER_3_INDICATOR_ROW_COL,
];

const AccentText = styled.span`
  color: var(--color_accent);
`;

type AdvancedControlMeta = [
  LightingValue,
  string | React.FC<any>,
  {type: string} & Partial<{min?: number; max?: number}>,
];

const RGBControls: ControlMeta[] = [
  [
    LightingValue.BACKLIGHT_DISABLE_WHEN_USB_SUSPENDED,
    '当 USB 停止时关闭 LED 灯珠',
    {type: 'slider'},
  ],
  [
    LightingValue.BACKLIGHT_DISABLE_AFTER_TIMEOUT,
    () => {
      const lightingData = useAppSelector(getSelectedLightingData);
      const valArr =
        lightingData &&
        lightingData[LightingValue.BACKLIGHT_DISABLE_AFTER_TIMEOUT];
      if (!valArr) {
        return null;
      }

      return (
        <span>
          LED Sleep Timeout:{' '}
          <AccentText>
            {!valArr[0] ? '永不' : `在 ${valArr[0]} 分钟之后`}
          </AccentText>
        </span>
      );
    },
    {type: 'range', min: 0, max: 255},
  ],
  [
    LightingValue.BACKLIGHT_CAPS_LOCK_INDICATOR_COLOR,
    '大写锁定指示灯颜色',
    {type: 'color'},
  ],
  [
    LightingValue.BACKLIGHT_CAPS_LOCK_INDICATOR_ROW_COL,
    '大写锁定指示灯位置',
    {type: 'row_col'},
  ],
  [
    LightingValue.BACKLIGHT_LAYER_1_INDICATOR_COLOR,
    '键层 1 指示灯颜色',
    {type: 'color'},
  ],
  [
    LightingValue.BACKLIGHT_LAYER_1_INDICATOR_ROW_COL,
    '键层 1 指示灯位置',
    {type: 'row_col'},
  ],
  [
    LightingValue.BACKLIGHT_LAYER_2_INDICATOR_COLOR,
    '键层 2 指示灯颜色',
    {type: 'color'},
  ],
  [
    LightingValue.BACKLIGHT_LAYER_2_INDICATOR_ROW_COL,
    '键层 2 指示灯位置',
    {type: 'row_col'},
  ],
  [
    LightingValue.BACKLIGHT_LAYER_3_INDICATOR_COLOR,
    '键层 3 指示灯颜色',
    {type: 'color'},
  ],
  [
    LightingValue.BACKLIGHT_LAYER_3_INDICATOR_ROW_COL,
    '键层 3 指示灯位置',
    {type: 'row_col'},
  ],
];
export const AdvancedPane: FC = () => {
  const lightingData = useAppSelector(getSelectedLightingData);
  const selectedDefinition = useAppSelector(getSelectedDefinition);
  if (isVIADefinitionV2(selectedDefinition) && lightingData) {
    const {supportedLightingValues} = getLightingDefinition(
      selectedDefinition.lighting,
    );
    return (
      <>
        {RGBControls.filter(
          (control) => supportedLightingValues.indexOf(control[0]) !== -1,
        ).map((meta: AdvancedControlMeta) => (
          <LightingControl meta={meta} />
        ))}
      </>
    );
  }
  return null;
};
