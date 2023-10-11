import {FC, useState} from 'react';
import styled from 'styled-components';
import stringify from 'json-stringify-pretty-compact';
import {ErrorMessage, SuccessMessage} from '../../styled';
import {AccentUploadButton} from '../../inputs/accent-upload-button';
import {AccentButton} from '../../inputs/accent-button';
import {getByteForCode, getCodeForByte} from '../../../utils/key';
import deprecatedKeycodes from '../../../utils/key-to-byte/deprecated-keycodes';
import {title, component} from '../../icons/save';
import {CenterPane} from '../pane';
import {Detail, Label, ControlRow, SpanOverflowCell} from '../grid';
import {
  getBasicKeyToByte,
  getSelectedDefinition,
} from 'src/store/definitionsSlice';
import {
  getSelectedRawLayers,
  saveRawKeymapToDevice,
} from 'src/store/keymapSlice';
import {useAppDispatch, useAppSelector} from 'src/store/hooks';
import {
  getSelectedConnectedDevice,
  getSelectedKeyboardAPI,
} from 'src/store/devicesSlice';
import {getExpressions, saveMacros} from 'src/store/macrosSlice';

type ViaSaveFile = {
  name: string;
  vendorProductId: number;
  layers: string[][];
  macros?: string[];
  encoders?: [string, string][][];
};

const isViaSaveFile = (obj: any): obj is ViaSaveFile =>
  obj && obj.name && obj.layers && obj.vendorProductId;

const SaveLoadPane = styled(CenterPane)`
  height: 100%;
  background: var(--color_dark_grey);
`;

const Container = styled.div`
  display: flex;
  align-items: center;
  flex-direction: column;
  padding: 0 12px;
`;

export const Pane: FC = () => {
  const dispatch = useAppDispatch();
  const selectedDefinition = useAppSelector(getSelectedDefinition);
  const selectedDevice = useAppSelector(getSelectedConnectedDevice);
  const api = useAppSelector(getSelectedKeyboardAPI);
  const rawLayers = useAppSelector(getSelectedRawLayers);
  const macros = useAppSelector((state) => state.macros);
  const expressions = useAppSelector(getExpressions);
  const {basicKeyToByte, byteToKey} = useAppSelector(getBasicKeyToByte);

  // TODO: improve typing so we can remove this
  if (!selectedDefinition || !selectedDevice || !api) {
    return null;
  }

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const getEncoderValues = async () => {
    const {layouts} = selectedDefinition;
    const {keys, optionKeys} = layouts;
    const encoders = [
      ...keys,
      ...Object.values(optionKeys)
        .flatMap((a) => Object.values(a))
        .flat(),
    ]
      .filter((a) => 'ei' in a)
      .map((a) => a.ei as number);
    if (encoders.length > 0) {
      const maxEncoder = Math.max(...encoders) + 1;
      const numberOfLayers = rawLayers.length;
      const encoderValues = await Promise.all(
        Array(maxEncoder)
          .fill(0)
          .map((_, i) =>
            Promise.all(
              Array(numberOfLayers)
                .fill(0)
                .map((_, j) =>
                  Promise.all([
                    api.getEncoderValue(j, i, false),
                    api.getEncoderValue(j, i, true),
                  ]).then(
                    (a) =>
                      a.map(
                        (keyByte) =>
                          getCodeForByte(keyByte, basicKeyToByte, byteToKey) ||
                          '',
                      ) as [string, string],
                  ),
                ),
            ),
          ),
      );
      return encoderValues;
    } else {
      return [];
    }
  };

  const saveLayout = async () => {
    const {name, vendorProductId} = selectedDefinition;
    const suggestedName =
      name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase() + '.layout.json';
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName,
      });
      const encoderValues = await getEncoderValues();
      const saveFile: ViaSaveFile = {
        name,
        vendorProductId,
        macros: [...expressions],
        layers: rawLayers.map(
          (layer: {keymap: number[]}) =>
            layer.keymap.map(
              (keyByte: number) =>
                getCodeForByte(keyByte, basicKeyToByte, byteToKey) || '',
            ), // TODO: should empty string be empty keycode instead?
        ),
        encoders: encoderValues,
      };

      const content = stringify(saveFile);
      const blob = new Blob([content], {type: 'application/json'});
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
    } catch (err) {
      console.log('User cancelled save file request');
    }

    /*
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = defaultFilename;

    link.click();
    URL.revokeObjectURL(url);
*/
  };

  const loadLayout = ([file]: Blob[]) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    const reader = new FileReader();

    reader.onabort = () => setErrorMessage('文件读取已取消');
    reader.onerror = () => setErrorMessage('无法读取文件');

    reader.onload = async () => {
      const saveFile = JSON.parse((reader as any).result.toString());
      if (!isViaSaveFile(saveFile)) {
        setErrorMessage('无法加载文件：无效数据');
        return;
      }

      if (saveFile.vendorProductId !== selectedDefinition.vendorProductId) {
        setErrorMessage(
          `无法导入配列：这把键盘不适配此文件: ${saveFile.name}`,
        );
        return;
      }

      if (
        saveFile.layers.findIndex(
          (layer, idx) => layer.length !== rawLayers[idx].keymap.length,
        ) > -1
      ) {
        setErrorMessage(
          '无法导入配列：按键数量在一个或多个键层有误',
        );
        return;
      }

      if (macros.isFeatureSupported && saveFile.macros) {
        if (saveFile.macros.length !== expressions.length) {
          setErrorMessage(
            '无法导入配列：宏数量有误',
          );
          return;
        }

        dispatch(saveMacros(selectedDevice, saveFile.macros));
      }

      const keymap: number[][] = saveFile.layers.map((layer) =>
        layer.map((key) =>
          getByteForCode(`${deprecatedKeycodes[key] ?? key}`, basicKeyToByte),
        ),
      );

      // John you drongo, don't trust the compiler, dispatches are totes awaitable for async thunks
      await dispatch(saveRawKeymapToDevice(keymap, selectedDevice));

      if (saveFile.encoders) {
        await Promise.all(
          saveFile.encoders.map((encoder, id) =>
            Promise.all(
              encoder.map((layer, layerId) =>
                Promise.all([
                  api.setEncoderValue(
                    layerId,
                    id,
                    false,
                    getByteForCode(
                      `${deprecatedKeycodes[layer[0]] ?? layer[0]}`,
                      basicKeyToByte,
                    ),
                  ),
                  api.setEncoderValue(
                    layerId,
                    id,
                    true,
                    getByteForCode(
                      `${deprecatedKeycodes[layer[1]] ?? layer[1]}`,
                      basicKeyToByte,
                    ),
                  ),
                ]),
              ),
            ),
          ),
        );
      }

      setSuccessMessage('成功更新配列！');
    };

    reader.readAsBinaryString(file);
  };

  return (
    <SpanOverflowCell>
      <SaveLoadPane>
        <Container>
          <ControlRow>
            <Label>保存当前配列</Label>
            <Detail>
              <AccentButton onClick={saveLayout}>保存</AccentButton>
            </Detail>
          </ControlRow>
          <ControlRow>
            <Label>加载已保存的配列</Label>
            <Detail>
              <AccentUploadButton onLoad={loadLayout}>加载</AccentUploadButton>
            </Detail>
          </ControlRow>
          {errorMessage ? <ErrorMessage>{errorMessage}</ErrorMessage> : null}
          {successMessage ? (
            <SuccessMessage>{successMessage}</SuccessMessage>
          ) : null}
        </Container>
      </SaveLoadPane>
    </SpanOverflowCell>
  );
};

export const Icon = component;
export const Title = title;
