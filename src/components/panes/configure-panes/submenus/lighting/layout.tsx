import {ControlRow, Label, Detail} from '../../../grid';
import {AccentSlider} from '../../../../inputs/accent-slider';
import {
  getLightingDefinition,
  isVIADefinitionV2,
  LightingValue,
} from '@the-via/reader';
import {
  getSelectedLightingData,
  updateBacklightValue,
} from 'src/store/lightingSlice';
import {useAppSelector} from 'src/store/hooks';
import {getSelectedDefinition} from 'src/store/definitionsSlice';
import type {FC} from 'react';
import {useAppDispatch} from 'src/store/hooks';
export const LayoutConfigValues = [
  LightingValue.BACKLIGHT_USE_7U_SPACEBAR,
  LightingValue.BACKLIGHT_USE_ISO_ENTER,
  LightingValue.BACKLIGHT_USE_SPLIT_BACKSPACE,
  LightingValue.BACKLIGHT_USE_SPLIT_LEFT_SHIFT,
  LightingValue.BACKLIGHT_USE_SPLIT_RIGHT_SHIFT,
  LightingValue.BACKLIGHT_DISABLE_HHKB_BLOCKER_LEDS,
];

const BooleanControls: [LightingValue, string][] = [
  [LightingValue.BACKLIGHT_USE_7U_SPACEBAR, '使用 7U 空格 LED'],
  [LightingValue.BACKLIGHT_USE_ISO_ENTER, '使用 ISO 回车 LED'],
  [LightingValue.BACKLIGHT_USE_SPLIT_BACKSPACE, '使用分裂空格 LED'],
  [LightingValue.BACKLIGHT_USE_SPLIT_LEFT_SHIFT, '使用分裂左 Shift LED'],
  [LightingValue.BACKLIGHT_USE_SPLIT_RIGHT_SHIFT, '使用分裂右 Shift LED'],
  [
    LightingValue.BACKLIGHT_DISABLE_HHKB_BLOCKER_LEDS,
    '关闭被 HHKB 配列遮挡的 LED',
  ],
];

export const Pane: FC = () => {
  const dispatch = useAppDispatch();
  const lightingData = useAppSelector(getSelectedLightingData);
  const selectedDefinition = useAppSelector(getSelectedDefinition);

  if (!lightingData) {
    return null;
  }

  if (!isVIADefinitionV2(selectedDefinition)) {
    throw new Error(
      '灯光组件只兼容第 2 版定义',
    );
  }

  const lightingDefinition = getLightingDefinition(selectedDefinition.lighting);
  if (lightingDefinition.supportedLightingValues.length !== 0) {
    const controls = BooleanControls.filter(
      (control) =>
        lightingDefinition.supportedLightingValues.indexOf(control[0]) !== -1,
    );

    return (
      <>
        {controls.map(([command, label]) => {
          const valArr = lightingData && lightingData[command];
          const isChecked = valArr && valArr[0];
          return (
            <ControlRow key={command}>
              <Label>{label}</Label>
              <Detail>
                <AccentSlider
                  isChecked={!!isChecked}
                  onChange={(val) =>
                    dispatch(updateBacklightValue(command, +val))
                  }
                />
              </Detail>
            </ControlRow>
          );
        })}
      </>
    );
  }
  return null;
};
