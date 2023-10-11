import {
  advancedKeycodeToString,
  advancedStringToKeycode,
} from './advanced-keys';
import {
  BuiltInKeycodeModule,
  VIADefinitionV3,
  VIADefinitionV2,
  getLightingDefinition,
  KeycodeType,
} from '@the-via/reader';

export interface IKeycode {
  name: string;
  code: string;
  title?: string;
  shortName?: string;
  keys?: string;
  width?: number;
  type?: 'container' | 'text' | 'layer';
  layer?: number;
}

export interface IKeycodeMenu {
  id: string;
  label: string;
  keycodes: IKeycode[];
  width?: 'label';
  detailed?: string;
}

// Tests if label is an alpha
export function isAlpha(label: string) {
  return /[A-Za-z]/.test(label) && label.length === 1;
}

// Test if label is a numpad number
export function isNumpadNumber(label: string) {
  return /['0-9]/.test(label) && label.length === 1;
}

export function isArrowKey(label: string) {
  return /[🠗🠕🠖🠔←↑→↓]$/.test(label);
}

export function isNumpadSymbol(label: string) {
  const centeredSymbol = '-+.÷×'.split('');
  return label.length === 1 && centeredSymbol.includes(label[0]);
}

// Test if label is a multi-legend, e.g. "!\n1"
export function isMultiLegend(label: string) {
  const topLegend = '~!@#$%^&*()_+|{}:"<>?'.split('');
  return label.length !== 1 && topLegend.includes(label[0]);
}

// Tests if label is a number
export function isNumericOrShiftedSymbol(label: string) {
  const numbersTop = '!@#$%^&*()_+|~{}:"<>?1234567890'.split('');
  return label.length === 1 && numbersTop.includes(label[0]);
}

// Tests if label is a number
export function isNumericSymbol(label: string) {
  const numbersTop = '!@#$%^&*()_+|~{}:"<>?'.split('');
  return label.length !== 1 && numbersTop.includes(label[0]);
}

// Maps the byte value to the keycode
export function getByteForCode(
  code: string,
  basicKeyToByte: Record<string, number>,
) {
  const byte: number | undefined = basicKeyToByte[code];
  if (byte !== undefined) {
    return byte;
  } else if (isLayerCode(code)) {
    return getByteForLayerCode(code, basicKeyToByte);
  } else if (advancedStringToKeycode(code, basicKeyToByte) !== null) {
    return advancedStringToKeycode(code, basicKeyToByte);
  }
  throw `无法为 ${code} 找到字节`;
}

function isLayerCode(code: string) {
  return /([A-Za-z]+)\((\d+)\)/.test(code);
}

function getByteForLayerCode(
  keycode: string,
  basicKeyToByte: Record<string, number>,
): number {
  const keycodeMatch = keycode.match(/([A-Za-z]+)\((\d+)\)/);
  if (keycodeMatch) {
    const [, code, layer] = keycodeMatch;
    const numLayer = parseInt(layer);
    switch (code) {
      case 'TO': {
        return Math.min(
          basicKeyToByte._QK_TO + numLayer,
          basicKeyToByte._QK_TO_MAX,
        );
      }
      case 'MO': {
        return Math.min(
          basicKeyToByte._QK_MOMENTARY + numLayer,
          basicKeyToByte._QK_MOMENTARY_MAX,
        );
      }
      case 'DF': {
        return Math.min(
          basicKeyToByte._QK_DEF_LAYER + numLayer,
          basicKeyToByte._QK_DEF_LAYER_MAX,
        );
      }
      case 'TG': {
        return Math.min(
          basicKeyToByte._QK_TOGGLE_LAYER + numLayer,
          basicKeyToByte._QK_TOGGLE_LAYER_MAX,
        );
      }
      case 'OSL': {
        return Math.min(
          basicKeyToByte._QK_ONE_SHOT_LAYER + numLayer,
          basicKeyToByte._QK_ONE_SHOT_LAYER_MAX,
        );
      }
      case 'TT': {
        return Math.min(
          basicKeyToByte._QK_LAYER_TAP_TOGGLE + numLayer,
          basicKeyToByte._QK_LAYER_TAP_TOGGLE_MAX,
        );
      }
      case 'CUSTOM': {
        return Math.min(
          basicKeyToByte._QK_KB + numLayer,
          basicKeyToByte._QK_KB_MAX,
        );
      }
      case 'MACRO': {
        return Math.min(
          basicKeyToByte._QK_MACRO + numLayer,
          basicKeyToByte._QK_MACRO_MAX,
        );
      }
      default: {
        throw new Error('无效键码');
      }
    }
  }
  throw new Error('无匹配');
}

function getCodeForLayerByte(
  byte: number,
  basicKeyToByte: Record<string, number>,
) {
  if (basicKeyToByte._QK_TO <= byte && basicKeyToByte._QK_TO_MAX >= byte) {
    const layer = byte - basicKeyToByte._QK_TO;
    return `TO(${layer})`;
  } else if (
    basicKeyToByte._QK_MOMENTARY <= byte &&
    basicKeyToByte._QK_MOMENTARY_MAX >= byte
  ) {
    const layer = byte - basicKeyToByte._QK_MOMENTARY;
    return `MO(${layer})`;
  } else if (
    basicKeyToByte._QK_DEF_LAYER <= byte &&
    basicKeyToByte._QK_DEF_LAYER_MAX >= byte
  ) {
    const layer = byte - basicKeyToByte._QK_DEF_LAYER;
    return `DF(${layer})`;
  } else if (
    basicKeyToByte._QK_TOGGLE_LAYER <= byte &&
    basicKeyToByte._QK_TOGGLE_LAYER_MAX >= byte
  ) {
    const layer = byte - basicKeyToByte._QK_TOGGLE_LAYER;
    return `TG(${layer})`;
  } else if (
    basicKeyToByte._QK_ONE_SHOT_LAYER <= byte &&
    basicKeyToByte._QK_ONE_SHOT_LAYER_MAX >= byte
  ) {
    const layer = byte - basicKeyToByte._QK_ONE_SHOT_LAYER;
    return `OSL(${layer})`;
  } else if (
    basicKeyToByte._QK_LAYER_TAP_TOGGLE <= byte &&
    basicKeyToByte._QK_LAYER_TAP_TOGGLE_MAX >= byte
  ) {
    const layer = byte - basicKeyToByte._QK_LAYER_TAP_TOGGLE;
    return `TT(${layer})`;
  } else if (
    basicKeyToByte._QK_KB <= byte &&
    basicKeyToByte._QK_KB_MAX >= byte
  ) {
    const n = byte - basicKeyToByte._QK_KB;
    return `CUSTOM(${n})`;
  } else if (
    basicKeyToByte._QK_MACRO <= byte &&
    basicKeyToByte._QK_MACRO_MAX >= byte
  ) {
    const n = byte - basicKeyToByte._QK_MACRO;
    return `MACRO(${n})`;
  }
}

export const keycodesList = getKeycodes().reduce<IKeycode[]>(
  (p, n) => p.concat(n.keycodes),
  [],
);

export const getByteToKey = (basicKeyToByte: Record<string, number>) =>
  Object.keys(basicKeyToByte).reduce((p, n) => {
    const key = basicKeyToByte[n];
    if (key in p) {
      const basicKeycode = keycodesList.find(({code}) => code === n);
      if (basicKeycode) {
        return {...p, [key]: basicKeycode.code};
      }
      return p;
    }
    return {...p, [key]: n};
  }, {} as {[key: number]: string});

function isLayerKey(byte: number, basicKeyToByte: Record<string, number>) {
  return [
    [basicKeyToByte._QK_TO, basicKeyToByte._QK_TO_MAX],
    [basicKeyToByte._QK_MOMENTARY, basicKeyToByte._QK_MOMENTARY_MAX],
    [basicKeyToByte._QK_DEF_LAYER, basicKeyToByte._QK_DEF_LAYER_MAX],
    [basicKeyToByte._QK_TOGGLE_LAYER, basicKeyToByte._QK_TOGGLE_LAYER_MAX],
    [basicKeyToByte._QK_ONE_SHOT_LAYER, basicKeyToByte._QK_ONE_SHOT_LAYER_MAX],
    [
      basicKeyToByte._QK_LAYER_TAP_TOGGLE,
      basicKeyToByte._QK_LAYER_TAP_TOGGLE_MAX,
    ],
    [basicKeyToByte._QK_KB, basicKeyToByte._QK_KB_MAX],
    [basicKeyToByte._QK_MACRO, basicKeyToByte._QK_MACRO_MAX],
  ].some((code) => byte >= code[0] && byte <= code[1]);
}

export function getCodeForByte(
  byte: number,
  basicKeyToByte: Record<string, number>,
  byteToKey: Record<number, string>,
) {
  const keycode = byteToKey[byte];
  if (keycode && !keycode.startsWith('_QK')) {
    return keycode;
  } else if (isLayerKey(byte, basicKeyToByte)) {
    return getCodeForLayerByte(byte, basicKeyToByte);
  } else if (
    advancedKeycodeToString(byte, basicKeyToByte, byteToKey) !== null
  ) {
    return advancedKeycodeToString(byte, basicKeyToByte, byteToKey);
  } else {
    return '0x' + Number(byte).toString(16);
  }
}

export function keycodeInMaster(
  keycode: string,
  basicKeyToByte: Record<string, number>,
) {
  return (
    keycode in basicKeyToByte ||
    isLayerCode(keycode) ||
    advancedStringToKeycode(keycode, basicKeyToByte) !== null
  );
}

function shorten(str: string) {
  return str
    .split(' ')
    .map((word) => word.slice(0, 1) + word.slice(1).replace(/[aeiou ]/gi, ''))
    .join('');
}

export function isCustomKeycodeByte(
  byte: number,
  basicKeyToByte: Record<string, number>,
) {
  return byte >= basicKeyToByte._QK_KB && byte <= basicKeyToByte._QK_KB_MAX;
}

export function getCustomKeycodeIndex(
  byte: number,
  basicKeyToByte: Record<string, number>,
) {
  return byte - basicKeyToByte._QK_KB;
}

export function isMacroKeycodeByte(
  byte: number,
  basicKeyToByte: Record<string, number>,
) {
  return (
    byte >= basicKeyToByte._QK_MACRO && byte <= basicKeyToByte._QK_MACRO_MAX
  );
}

export function getMacroKeycodeIndex(
  byte: number,
  basicKeyToByte: Record<string, number>,
) {
  return byte - basicKeyToByte._QK_MACRO;
}

export function getLabelForByte(
  byte: number,
  size = 100,
  basicKeyToByte: Record<string, number>,
  byteToKey: Record<number, string>,
) {
  const keycode = getCodeForByte(byte, basicKeyToByte, byteToKey);
  const basicKeycode = keycodesList.find(({code}) => code === keycode);
  if (!basicKeycode) {
    return keycode;
  }
  return getShortNameForKeycode(basicKeycode, size);
}

export function getShortNameForKeycode(keycode: IKeycode, size = 100) {
  const {code, name, shortName} = keycode;
  if (size <= 150 && shortName) {
    return shortName;
  }
  if (size === 100 && name.length > 5) {
    const shortenedName = shorten(name);
    if (!!code) {
      const shortCode = code.replace('KC_', '').replace('_', ' ');
      return shortenedName.length > 4 && shortCode.length < shortenedName.length
        ? shortCode
        : shortenedName;
    }
    return shortenedName;
  }
  return name;
}

export function getOtherMenu(
  basicKeyToByte: Record<string, number>,
): IKeycodeMenu {
  const keycodes = Object.keys(basicKeyToByte)
    .filter((key) => !key.startsWith('_QK'))
    .filter((key) => !keycodesList.map(({code}) => code).includes(key))
    .map((code) => ({
      name: code.replace('KC_', '').replace(/_/g, ' '),
      code: code,
    }));

  return {
    id: 'other',
    label: '其他键',
    keycodes,
  };
}

function buildLayerMenu(): IKeycodeMenu {
  const hardCodedKeycodes: IKeycode[] = [
    {
      name: 'Fn1\n(Fn3)',
      code: 'FN_MO13',
      title: '长按 = 层 1, 和层 2 一起长按 = 层 3',
      shortName: 'Fn1(3)',
    },
    {
      name: 'Fn2\n(Fn3)',
      code: 'FN_MO23',
      title: '长按 = 层 2, 和层 1 一起长按 = 层 3',
      shortName: 'Fn2(3)',
    },
    {
      name: '功能空格 1',
      code: 'LT(1,KC_SPC)',
      title: '长按 = 层 1, 短按 = 空格',
      shortName: '功能空格 1',
    },
    {
      name: '功能空格 2',
      code: 'LT(2,KC_SPC)',
      title: '长按 = 层 2, 短按 = 空格',
      shortName: '功能空格 2',
    },
    {
      name: '功能空格 3',
      code: 'LT(3,KC_SPC)',
      title: '长按 = 层 3, 短按 = 空格',
      shortName: '功能空格 3',
    },
  ];

  const menu: IKeycodeMenu = {
    id: 'layers',
    label: '切层按键',
    width: 'label',
    keycodes: [
      {
        name: 'MO',
        code: 'MO(layer)',
        type: 'layer',
        layer: 0,
        title: '临时启用指定层层',
      },
      {
        name: 'TG',
        code: 'TG(layer)',
        type: 'layer',
        layer: 0,
        title: '开关键层',
      },
      {
        name: 'TT',
        code: 'TT(layer)',
        type: 'layer',
        layer: 0,
        title:
          "正常情况下和 MO 一致，但连击后打开指定层",
      },
      {
        name: 'OSL',
        code: 'OSL(layer)',
        type: 'layer',
        layer: 0,
        title: '按下后切换到指定层，按下第一个按键后切换回原键层',
      },
      {
        name: 'TO',
        code: 'TO(layer)',
        type: 'layer',
        layer: 0,
        title: '开启指定层',
      },
      {
        name: 'DF',
        code: 'DF(layer)',
        type: 'layer',
        layer: 0,
        title: '设置指定层为默认层',
      },
    ],
  };

  // Statically generate layer codes from 0-9 instead of making it an input
  return {
    ...menu,
    keycodes: [
      ...hardCodedKeycodes,
      ...menu.keycodes.flatMap((keycode) => {
        let res: IKeycode[] = [];
        for (let idx = 0; idx < 10; idx++) {
          const newTitle = (keycode.title || '').replace(
            'layer',
            `layer ${idx}`,
          );
          const newCode = keycode.code.replace('layer', `${idx}`);
          const newName = keycode.name + `(${idx})`;
          res = [
            ...res,
            {...keycode, name: newName, title: newTitle, code: newCode},
          ];
        }
        return res;
      }),
    ],
  };
}

export function getKeycodes(): IKeycodeMenu[] {
  return [
    {
      id: 'basic',
      label: '基础按键',
      keycodes: [
        {name: '', code: 'KC_NO', title: '无任何触发'},
        {name: '▽', code: 'KC_TRNS', title: '透明键，触发此键层下第一个已启用键层同键位的键码'},
        // TODO: remove "shortName" when multiline keycap labels are working
        {name: 'Esc', code: 'KC_ESC', keys: 'esc'},
        {name: 'A', code: 'KC_A', keys: 'a'},
        {name: 'B', code: 'KC_B', keys: 'b'},
        {name: 'C', code: 'KC_C', keys: 'c'},
        {name: 'D', code: 'KC_D', keys: 'd'},
        {name: 'E', code: 'KC_E', keys: 'e'},
        {name: 'F', code: 'KC_F', keys: 'f'},
        {name: 'G', code: 'KC_G', keys: 'g'},
        {name: 'H', code: 'KC_H', keys: 'h'},
        {name: 'I', code: 'KC_I', keys: 'i'},
        {name: 'J', code: 'KC_J', keys: 'j'},
        {name: 'K', code: 'KC_K', keys: 'k'},
        {name: 'L', code: 'KC_L', keys: 'l'},
        {name: 'M', code: 'KC_M', keys: 'm'},
        {name: 'N', code: 'KC_N', keys: 'n'},
        {name: 'O', code: 'KC_O', keys: 'o'},
        {name: 'P', code: 'KC_P', keys: 'p'},
        {name: 'Q', code: 'KC_Q', keys: 'q'},
        {name: 'R', code: 'KC_R', keys: 'r'},
        {name: 'S', code: 'KC_S', keys: 's'},
        {name: 'T', code: 'KC_T', keys: 't'},
        {name: 'U', code: 'KC_U', keys: 'u'},
        {name: 'V', code: 'KC_V', keys: 'v'},
        {name: 'W', code: 'KC_W', keys: 'w'},
        {name: 'X', code: 'KC_X', keys: 'x'},
        {name: 'Y', code: 'KC_Y', keys: 'y'},
        {name: 'Z', code: 'KC_Z', keys: 'z'},
        {name: '!\n1', code: 'KC_1', keys: '1'},
        {name: '@\n2', code: 'KC_2', keys: '2'},
        {name: '#\n3', code: 'KC_3', keys: '3'},
        {name: '$\n4', code: 'KC_4', keys: '4'},
        {name: '%\n5', code: 'KC_5', keys: '5'},
        {name: '^\n6', code: 'KC_6', keys: '6'},
        {name: '&\n7', code: 'KC_7', keys: '7'},
        {name: '*\n8', code: 'KC_8', keys: '8'},
        {name: '(\n9', code: 'KC_9', keys: '9'},
        {name: ')\n0', code: 'KC_0', keys: '0'},
        {name: '_\n-', code: 'KC_MINS', keys: '-'},
        {name: '+\n=', code: 'KC_EQL', keys: '='},
        {name: '~\n`', code: 'KC_GRV', keys: '`'},
        {name: '{\n[', code: 'KC_LBRC', keys: '['},
        {name: '}\n]', code: 'KC_RBRC', keys: ']'},
        {name: '|\n\\', code: 'KC_BSLS', keys: '\\', width: 1500},
        {name: ':\n;', code: 'KC_SCLN', keys: ';'},
        {name: '"\n\'', code: 'KC_QUOT', keys: "'"},
        {name: '<\n,', code: 'KC_COMM', keys: ','},
        {name: '>\n.', code: 'KC_DOT', keys: '.'},
        {name: '?\n/', code: 'KC_SLSH', keys: '/'},
        {name: '=', code: 'KC_PEQL'},
        {name: ',', code: 'KC_PCMM'},
        {name: 'F1', code: 'KC_F1'},
        {name: 'F2', code: 'KC_F2'},
        {name: 'F3', code: 'KC_F3'},
        {name: 'F4', code: 'KC_F4'},
        {name: 'F5', code: 'KC_F5'},
        {name: 'F6', code: 'KC_F6'},
        {name: 'F7', code: 'KC_F7'},
        {name: 'F8', code: 'KC_F8'},
        {name: 'F9', code: 'KC_F9'},
        {name: 'F10', code: 'KC_F10'},
        {name: 'F11', code: 'KC_F11'},
        {name: 'F12', code: 'KC_F12'},
        {name: 'Print Screen', code: 'KC_PSCR', shortName: '截屏'},
        {name: 'Scroll Lock', code: 'KC_SLCK', shortName: 'Scroll'},
        {name: 'Pause', code: 'KC_PAUS'},
        {name: 'Tab', code: 'KC_TAB', keys: 'tab', width: 1500},
        {
          name: 'Backspace',
          code: 'KC_BSPC',
          keys: 'backspace',
          width: 2000,
          shortName: '退格',
        },
        {name: 'Insert', code: 'KC_INS', keys: 'insert', shortName: '插入'},
        {name: 'Del', code: 'KC_DEL', keys: 'delete', title: '删除'},
        {name: 'Home', code: 'KC_HOME', keys: 'home', title: '开头'},
        {name: 'End', code: 'KC_END', keys: 'end', title: '结尾'},
        {name: 'Page Up', code: 'KC_PGUP', keys: 'pageup', shortName: '上页'},
        {
          name: 'Page Down',
          code: 'KC_PGDN',
          keys: 'pagedown',
          shortName: '下页',
        },
        {name: 'Num\nLock', code: 'KC_NLCK', keys: 'num', shortName: 'N.Lck', title: '数字键盘锁'},
        {name: 'Caps Lock', code: 'KC_CAPS', keys: 'caps_lock', width: 1750, title: '大写锁定'},
        {name: 'Enter', code: 'KC_ENT', keys: 'enter', width: 2250, title: '回车'},
        {name: '1', code: 'KC_P1', keys: 'num_1', title: '数字键盘 1'},
        {name: '2', code: 'KC_P2', keys: 'num_2', title: '数字键盘 2'},
        {name: '3', code: 'KC_P3', keys: 'num_3', title: '数字键盘 3'},
        {name: '4', code: 'KC_P4', keys: 'num_4', title: '数字键盘 4'},
        {name: '5', code: 'KC_P5', keys: 'num_5', title: '数字键盘 5'},
        {name: '6', code: 'KC_P6', keys: 'num_6', title: '数字键盘 6'},
        {name: '7', code: 'KC_P7', keys: 'num_7', title: '数字键盘 7'},
        {name: '8', code: 'KC_P8', keys: 'num_8', title: '数字键盘 8'},
        {name: '9', code: 'KC_P9', keys: 'num_9', title: '数字键盘 9'},
        {
          name: '0',
          code: 'KC_P0',
          width: 2000,
          keys: 'num_0',
          title: '数字键盘 0',
        },
        {name: '÷', code: 'KC_PSLS', keys: 'num_divide', title: '数字键盘 ÷'},
        {name: '×', code: 'KC_PAST', keys: 'num_multiply', title: '数字键盘 ×'},
        {name: '-', code: 'KC_PMNS', keys: 'num_subtract', title: '数字键盘 -'},
        {name: '+', code: 'KC_PPLS', keys: 'num_add', title: '数字键盘 +'},
        {name: '.', code: 'KC_PDOT', keys: 'num_decimal', title: '数字键盘 .'},
        {
          name: 'Num\nEnter',
          code: 'KC_PENT',
          shortName: 'N.Ent',
          title: '数字键盘 回车',
        },
        {
          name: '左 Shift',
          code: 'KC_LSFT',
          keys: 'shift',
          width: 2250,
          shortName: '左 Shft',
          title: '左Shift'
        },
        {name: '右 Shift', code: 'KC_RSFT', width: 2750, shortName: '右 Shft', title: '右Shift'},
        {name: '左 Ctrl', code: 'KC_LCTL', keys: 'ctrl', width: 1250, title: '左Ctrl'},
        {name: '右 Ctrl', code: 'KC_RCTL', width: 1250, shortName: '右 Ctl', title: '右Ctrl'},
        {
          name: '左 Win',
          code: 'KC_LGUI',
          keys: 'cmd',
          width: 1250,
          shortName: '左 Win',
          title: '左Win'
        },
        {name: '右 Win', code: 'KC_RGUI', width: 1250, shortName: '右 Win', title: '右Win'},
        {
          name: '左 Alt',
          code: 'KC_LALT',
          keys: 'alt',
          width: 1250,
          shortName: '左 Alt',
          title: '左Alt'
        },
        {name: '右 Alt', code: 'KC_RALT', width: 1250, shortName: '右 Alt', title: '右Alt'},
        {name: 'Space 空格', code: 'KC_SPC', keys: 'space', width: 6250, title: '空格'},
        {name: '菜单', code: 'KC_APP', width: 1250, shortName: '菜单', title: '菜单'},
        {name: '左', code: 'KC_LEFT', keys: 'left', shortName: '←', title: '左'},
        {name: '下', code: 'KC_DOWN', keys: 'down', shortName: '↓', title: '下'},
        {name: '上', code: 'KC_UP', keys: 'up', shortName: '↑', title: '上'},
        {name: '右', code: 'KC_RGHT', keys: 'right', shortName: '→', title: '右'},
      ],
    },
    {
      id: 'wt_lighting',
      label: '灯光切换',
      width: 'label',
      keycodes: [
        {
          name: 'Bright -',
          code: 'BR_DEC',
          title: '亮度减',
          shortName: 'BR -',
        },
        {
          name: 'Bright +',
          code: 'BR_INC',
          title: '亮度加',
          shortName: 'BR +',
        },
        {
          name: 'Effect -',
          code: 'EF_DEC',
          title: '上一个灯效',
          shortName: 'EF -',
        },
        {
          name: 'Effect +',
          code: 'EF_INC',
          title: '下一个灯效',
          shortName: 'EF +',
        },
        {
          name: 'Effect Speed -',
          code: 'ES_DEC',
          title: '灯效速度减',
          shortName: 'ES -',
        },
        {
          name: 'Effect Speed +',
          code: 'ES_INC',
          title: '灯效速度加',
          shortName: 'ES +',
        },
        {
          name: 'Color1 Hue -',
          code: 'H1_DEC',
          title: 'Color1 Hue -',
          shortName: 'H1 -',
        },
        {
          name: 'Color1 Hue +',
          code: 'H1_INC',
          title: 'Color1 Hue +',
          shortName: 'H1 +',
        },
        {
          name: 'Color2 Hue -',
          code: 'H2_DEC',
          title: 'Color2 Hue -',
          shortName: 'H2 -',
        },
        {
          name: 'Color2 Hue +',
          code: 'H2_INC',
          title: 'Color2 Hue +',
          shortName: 'H2 +',
        },
        {
          name: 'Color1 Sat -',
          code: 'S1_DEC',
          title: 'Color1 Sat -',
          shortName: 'S1 -',
        },
        {
          name: 'Color1 Sat +',
          code: 'S1_INC',
          title: 'Color1 Sat +',
          shortName: 'S1 +',
        },
        {
          name: 'Color2 Sat -',
          code: 'S2_DEC',
          title: 'Color2 Sat -',
          shortName: 'S2 -',
        },
        {
          name: 'Color2 Sat +',
          code: 'S2_INC',
          title: 'Color2 Sat +',
          shortName: 'S2 +',
        },
      ],
    },
    {
      id: 'media',
      label: '媒体键',
      width: 'label',
      keycodes: [
        {name: '音量减', code: 'KC_VOLD', title: '音量减小'},
        {name: '音量加', code: 'KC_VOLU', title: '音量增大'},
        {name: '静音', code: 'KC_MUTE', title: '音频静音'},
        {name: '播放', code: 'KC_MPLY', title: '播放/暂停'},
        {name: '停止媒体', code: 'KC_MSTP', title: '停止媒体'},
        {name: 'Prev', code: 'KC_MPRV', title: '切换到上一媒体'},
        {name: 'Next', code: 'KC_MNXT', title: '切换到下一媒体'},
        {name: '重播', code: 'KC_MRWD', title: '跳到媒体开头'},
        {name: '快进', code: 'KC_MFFD', title: '快进'},
        {name: '选择', code: 'KC_MSEL', title: '选择媒体'},
        {name: '弹出', code: 'KC_EJCT', title: '弹出媒体'},
      ],
    },
    {
      id: 'macro',
      label: '宏键',
      width: 'label',
      keycodes: [
        {name: 'M0', code: 'MACRO(0)', title: '宏 0'},
        {name: 'M1', code: 'MACRO(1)', title: '宏 1'},
        {name: 'M2', code: 'MACRO(2)', title: '宏 2'},
        {name: 'M3', code: 'MACRO(3)', title: '宏 3'},
        {name: 'M4', code: 'MACRO(4)', title: '宏 4'},
        {name: 'M5', code: 'MACRO(5)', title: '宏 5'},
        {name: 'M6', code: 'MACRO(6)', title: '宏 6'},
        {name: 'M7', code: 'MACRO(7)', title: '宏 7'},
        {name: 'M8', code: 'MACRO(8)', title: '宏 8'},
        {name: 'M9', code: 'MACRO(9)', title: '宏 9'},
        {name: 'M10', code: 'MACRO(10)', title: '宏 10'},
        {name: 'M11', code: 'MACRO(11)', title: '宏 11'},
        {name: 'M12', code: 'MACRO(12)', title: '宏 12'},
        {name: 'M13', code: 'MACRO(13)', title: '宏 13'},
        {name: 'M14', code: 'MACRO(14)', title: '宏 14'},
        {name: 'M15', code: 'MACRO(15)', title: '宏 15'},
      ],
    },
    buildLayerMenu(),
    {
      id: 'special',
      label: '特殊按键',
      width: 'label',
      keycodes: [
        {name: '~', code: 'S(KC_GRV)', keys: '`', title: 'Shift + `'},
        {name: '!', code: 'S(KC_1)', keys: '!', title: 'Shift + 1'},
        {name: '@', code: 'S(KC_2)', keys: '@', title: 'Shift + 2'},
        {name: '#', code: 'S(KC_3)', keys: '#', title: 'Shift + 3'},
        {name: '$', code: 'S(KC_4)', keys: '$', title: 'Shift + 4'},
        {name: '%', code: 'S(KC_5)', keys: '%', title: 'Shift + 5'},
        {name: '^', code: 'S(KC_6)', keys: '^', title: 'Shift + 6'},
        {name: '&', code: 'S(KC_7)', keys: '&', title: 'Shift + 7'},
        {name: '*', code: 'S(KC_8)', keys: '*', title: 'Shift + 8'},
        {name: '(', code: 'S(KC_9)', keys: '(', title: 'Shift + 9'},
        {name: ')', code: 'S(KC_0)', keys: ')', title: 'Shift + 0'},
        {name: '_', code: 'S(KC_MINS)', keys: '_', title: 'Shift + -'},
        {name: '+', code: 'S(KC_EQL)', keys: '+', title: 'Shift + ='},
        {name: '{', code: 'S(KC_LBRC)', keys: '{', title: 'Shift + ['},
        {name: '}', code: 'S(KC_RBRC)', keys: '}', title: 'Shift + ]'},
        {name: '|', code: 'S(KC_BSLS)', keys: '|', title: 'Shift + \\'},
        {name: ':', code: 'S(KC_SCLN)', keys: ':', title: 'Shift + /'},
        {name: '"', code: 'S(KC_QUOT)', keys: '"', title: "Shift + '"},
        {name: '<', code: 'S(KC_COMM)', keys: '<', title: 'Shift + ,'},
        {name: '>', code: 'S(KC_DOT)', keys: '>', title: 'Shift + .'},
        {name: '?', code: 'S(KC_SLSH)', keys: '?', title: 'Shift + /'},
        {name: 'NUHS', code: 'KC_NUHS', title: 'Non-US # and ~'},
        {name: 'NUBS', code: 'KC_NUBS', title: 'Non-US \\ and |'},
        {name: 'Ro', code: 'KC_RO', title: 'JIS \\ and |'},
        {name: '¥', code: 'KC_JYEN', title: 'JPN Yen'},
        {name: '無変換', code: 'KC_MHEN', title: 'JIS Muhenkan'},
        {name: '漢字', code: 'KC_HANJ', title: 'Hanja'},
        {name: '한영', code: 'KC_HAEN', title: 'HanYeong'},
        {name: '変換', code: 'KC_HENK', title: 'JIS Henkan'},
        {name: 'かな', code: 'KC_KANA', title: 'JIS Katakana/Hiragana'},
        {
          name: 'Esc `',
          code: 'KC_GESC',
          title: '平常为 Esc, 当 Shift 或 Win 键按下时为 `',
        },
        {
          name: 'LS (',
          code: 'KC_LSPO',
          title: '长按时为左 Shift, 短按时为 (',
        },
        {
          name: 'RS )',
          code: 'KC_RSPC',
          title: '长按时为右 Shift, 短按时为 )',
        },
        {
          name: 'LC (',
          code: 'KC_LCPO',
          title: '长按时为左 Ctrl, 短按时为 (',
        },
        {
          name: 'RC )',
          code: 'KC_RCPC',
          title: '长按时为右 Control, 短按时为 )',
        },
        {
          name: 'LA (',
          code: 'KC_LAPO',
          title: '长按时为左 Alt, 短按时为 (',
        },
        {
          name: 'RA )',
          code: 'KC_RAPC',
          title: '长按时为右 Alt, 短按时为 )',
        },
        {
          name: 'SftEnt',
          code: 'KC_SFTENT',
          title: '长按时为右Shift, 短按时为回车',
        },
        {name: 'Reset', code: 'RESET', title: '重置键盘, 进入刷机模式'},
        {name: 'Debug', code: 'DEBUG', title: '开启键盘调试模式'},
        {
          name: '开关全键无冲',
          code: 'MAGIC_TOGGLE_NKRO',
          shortName: 'NKRO',
          title: 'Toggle NKRO 开关全键无冲',
        },
        // I don't even think the locking stuff is enabled...
        {name: 'Locking Num Lock', code: 'KC_LNUM'},
        {name: 'Locking Caps Lock', code: 'KC_LCAP'},
        {name: 'Locking Scroll Lock', code: 'KC_LSCR'},
        {name: 'Power', code: 'KC_PWR'},
        {name: 'Power OSX', code: 'KC_POWER'},
        {name: 'Sleep', code: 'KC_SLEP'},
        {name: 'Wake', code: 'KC_WAKE'},
        {name: 'Calc', code: 'KC_CALC'},
        {name: 'Mail', code: 'KC_MAIL'},
        {name: 'Help', code: 'KC_HELP'},
        {name: 'Stop', code: 'KC_STOP'},
        {name: 'Alt Erase', code: 'KC_ERAS'},
        {name: 'Again', code: 'KC_AGAIN'},
        {name: 'Menu', code: 'KC_MENU'},
        {name: 'Undo', code: 'KC_UNDO'},
        {name: 'Select', code: 'KC_SELECT'},
        {name: 'Exec', code: 'KC_EXECUTE'},
        {name: 'Cut', code: 'KC_CUT'},
        {name: 'Copy', code: 'KC_COPY'},
        {name: 'Paste', code: 'KC_PASTE'},
        {name: 'Find', code: 'KC_FIND'},
        {name: 'My Comp', code: 'KC_MYCM'},
        {name: 'Home', code: 'KC_WWW_HOME'},
        {name: 'Back', code: 'KC_WWW_BACK'},
        {name: 'Forward', code: 'KC_WWW_FORWARD'},
        {name: 'Stop', code: 'KC_WWW_STOP'},
        {name: 'Refresh', code: 'KC_WWW_REFRESH'},
        {name: 'Favorites', code: 'KC_WWW_FAVORITES'},
        {name: 'Search', code: 'KC_WWW_SEARCH'},
        {
          name: 'Screen +',
          code: 'KC_BRIU',
          shortName: 'Scr +',
          title: '调亮屏幕',
        },
        {
          name: 'Screen -',
          code: 'KC_BRID',
          shortName: 'Scr -',
          title: '调暗屏幕',
        },
        {name: 'F13', code: 'KC_F13'},
        {name: 'F14', code: 'KC_F14'},
        {name: 'F15', code: 'KC_F15'},
        {name: 'F16', code: 'KC_F16'},
        {name: 'F17', code: 'KC_F17'},
        {name: 'F18', code: 'KC_F18'},
        {name: 'F19', code: 'KC_F19'},
        {name: 'F20', code: 'KC_F20'},
        {name: 'F21', code: 'KC_F21'},
        {name: 'F22', code: 'KC_F22'},
        {name: 'F23', code: 'KC_F23'},
        {name: 'F24', code: 'KC_F24'},

        // TODO: move these to a new group
        {name: '鼠标 ↑', code: 'KC_MS_UP'},
        {name: '鼠标 ↓', code: 'KC_MS_DOWN'},
        {name: '鼠标 ←', code: 'KC_MS_LEFT'},
        {name: '鼠标 →', code: 'KC_MS_RIGHT'},
        {name: '鼠标 按键1', code: 'KC_MS_BTN1'},
        {name: '鼠标 按键2', code: 'KC_MS_BTN2'},
        {name: '鼠标 按键3', code: 'KC_MS_BTN3'},
        {name: '鼠标 按键4', code: 'KC_MS_BTN4'},
        {name: '鼠标 按键5', code: 'KC_MS_BTN5'},
        {name: '鼠标 按键6', code: 'KC_MS_BTN6'},
        {name: '鼠标 按键7', code: 'KC_MS_BTN7'},
        {name: '鼠标 按键8', code: 'KC_MS_BTN8'},
        {name: '鼠标 滚轮 ↑', code: 'KC_MS_WH_UP'},
        {name: '鼠标 滚轮 ↓', code: 'KC_MS_WH_DOWN'},
        {name: '鼠标 滚轮 ←', code: 'KC_MS_WH_LEFT'},
        {name: '鼠标 滚轮 →', code: 'KC_MS_WH_RIGHT'},
        {name: '鼠标 加速度0', code: 'KC_MS_ACCEL0'},
        {name: '鼠标 加速度1', code: 'KC_MS_ACCEL1'},
        {name: '鼠标 加速度2', code: 'KC_MS_ACCEL2'},

        // TODO: move these to a new group
        {name: 'Audio On', code: 'AU_ON'},
        {name: 'Audio Off', code: 'AU_OFF'},
        {name: 'Audio Toggle', code: 'AU_TOG'},
        {name: 'Clicky Toggle', code: 'CLICKY_TOGGLE'},
        {name: 'Clicky Enable', code: 'CLICKY_ENABLE'},
        {name: 'Clicky Disable', code: 'CLICKY_DISABLE'},
        {name: 'Clicky Up', code: 'CLICKY_UP'},
        {name: 'Clicky Down', code: 'CLICKY_DOWN'},
        {name: 'Clicky Reset', code: 'CLICKY_RESET'},
        {name: 'Music On', code: 'MU_ON'},
        {name: 'Music Off', code: 'MU_OFF'},
        {name: 'Music Toggle', code: 'MU_TOG'},
        {name: 'Music Mode', code: 'MU_MOD'},
      ],
    },
    /* These are for controlling the original backlighting and bottom RGB. */
    {
      id: 'qmk_lighting',
      label: 'RGB 灯光',
      width: 'label',
      keycodes: [
        {name: '背光开关', code: 'BL_TOGG'},
        {name: '背光开', code: 'BL_ON'},
        {name: '背光关', code: 'BL_OFF', shortName: 'BL Off'},
        {name: '背光减暗', code: 'BL_DEC'},
        {name: '背光增亮', code: 'BL_INC'},
        {name: '背光循环', code: 'BL_STEP'},
        {name: '呼吸开关', code: 'BL_BRTG'},
        {name: 'RGB 开关', code: 'RGB_TOG'},
        {name: 'RGB 模式 -', code: 'RGB_RMOD'},
        {name: 'RGB 模式 +', code: 'RGB_MOD'},
        {name: 'Hue -', code: 'RGB_HUD'},
        {name: 'Hue +', code: 'RGB_HUI'},
        {name: 'Sat -', code: 'RGB_SAD'},
        {name: 'Sat +', code: 'RGB_SAI'},
        {name: 'RGB 亮度 -', code: 'RGB_VAD'},
        {name: 'RGB 亮度 +', code: 'RGB_VAI'},
        {name: '效果速度-', code: 'RGB_SPD'},
        {name: '效果速度+', code: 'RGB_SPI'},
        {name: 'RGB 模式 P', code: 'RGB_M_P', title: 'Plain'},
        {name: 'RGB 模式 B', code: 'RGB_M_B', title: 'Breathe'},
        {name: 'RGB 模式 R', code: 'RGB_M_R', title: 'Rainbow'},
        {name: 'RGB 模式 SW', code: 'RGB_M_SW', title: 'Swirl'},
        {name: 'RGB 模式 SN', code: 'RGB_M_SN', title: 'Snake'},
        {name: 'RGB 模式 K', code: 'RGB_M_K', title: 'Knight'},
        {name: 'RGB 模式 X', code: 'RGB_M_X', title: 'Xmas'},
        {name: 'RGB 模式 G', code: 'RGB_M_G', title: 'Gradient'},
      ],
    },
    /*
     These custom keycodes always exist and should be filtered out if necessary
     Name and Title should be replaced with the correct ones from the keyboard json
    */
    {
      id: 'custom',
      label: '自定义键',
      width: 'label',
      keycodes: [
        {name: 'CUSTOM(0)', code: 'CUSTOM(0)', title: '自定义键值 0'},
        {name: 'CUSTOM(1)', code: 'CUSTOM(1)', title: '自定义键值 1'},
        {name: 'CUSTOM(2)', code: 'CUSTOM(2)', title: '自定义键值 2'},
        {name: 'CUSTOM(3)', code: 'CUSTOM(3)', title: '自定义键值 3'},
        {name: 'CUSTOM(4)', code: 'CUSTOM(4)', title: '自定义键值 4'},
        {name: 'CUSTOM(5)', code: 'CUSTOM(5)', title: '自定义键值 5'},
        {name: 'CUSTOM(6)', code: 'CUSTOM(6)', title: '自定义键值 6'},
        {name: 'CUSTOM(7)', code: 'CUSTOM(7)', title: '自定义键值 7'},
        {name: 'CUSTOM(8)', code: 'CUSTOM(8)', title: '自定义键值 8'},
        {name: 'CUSTOM(9)', code: 'CUSTOM(9)', title: '自定义键值 9'},
        {name: 'CUSTOM(10)', code: 'CUSTOM(10)', title: '自定义键值 10'},
        {name: 'CUSTOM(11)', code: 'CUSTOM(11)', title: '自定义键值 11'},
        {name: 'CUSTOM(12)', code: 'CUSTOM(12)', title: '自定义键值 12'},
        {name: 'CUSTOM(13)', code: 'CUSTOM(13)', title: '自定义键值 13'},
        {name: 'CUSTOM(14)', code: 'CUSTOM(14)', title: '自定义键值 14'},
        {name: 'CUSTOM(15)', code: 'CUSTOM(15)', title: '自定义键值 15'},
      ],
    },
  ];
}

export const categoriesForKeycodeModule = (
  keycodeModule: BuiltInKeycodeModule | 'default',
) =>
  ({
    default: ['basic', 'media', 'macro', 'layers', 'special'],
    [BuiltInKeycodeModule.WTLighting]: ['wt_lighting'],
    [BuiltInKeycodeModule.QMKLighting]: ['qmk_lighting'],
  }[keycodeModule]);

export const getKeycodesForKeyboard = (
  definition: VIADefinitionV3 | VIADefinitionV2,
) => {
  // v2
  let includeList: string[] = [];
  if ('lighting' in definition) {
    const {keycodes} = getLightingDefinition(definition.lighting);
    includeList = categoriesForKeycodeModule('default').concat(
      keycodes === KeycodeType.None
        ? []
        : keycodes === KeycodeType.QMK
        ? categoriesForKeycodeModule(BuiltInKeycodeModule.QMKLighting)
        : categoriesForKeycodeModule(BuiltInKeycodeModule.WTLighting),
    );
  } else {
    const {keycodes} = definition;
    includeList = keycodes.flatMap(categoriesForKeycodeModule);
  }
  return getKeycodes()
    .flatMap((keycodeMenu) =>
      includeList.includes(keycodeMenu.id) ? keycodeMenu.keycodes : [],
    )
    .sort((a, b) => {
      if (a.code <= b.code) {
        return -1;
      } else {
        return 1;
      }
    });
};
