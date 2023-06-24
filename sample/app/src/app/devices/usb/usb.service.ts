// use type > https://www.npmjs.com/package/@types/w3c-web-usb
// ISO7816-4/8/9
//@ts-igonore
export async function webHoge() {
  //@ts-ignore
  const device = await navigator?.usb.requestDevice(DEVICE_OPTIONS);
  console.log(device);
  if (device.productId === 3528) {
    // RC-S300S
    await device.open();
  }
  if (device.productId === 1731) {
    // RC-S380p
    await device.open();
  }
}

const DEVICE_FILTER = {};
const DEVICE_OPTIONS = {
  filters: [DEVICE_FILTER],
};
const ACK_PACKET = Uint8Array.of(0x00, 0x00, 0xff, 0x00, 0xff, 0x00);
let seqNumber = 0;

//@ts-ignore
function padding_zero(num, p) {
  return ('0'.repeat(p * 1) + num).slice(-(p * 1));
}
//@ts-ignore
function get_header_length(header) {
  return (header[4] << 24) | (header[3] << 16) | (header[2] << 8) | header[1];
}

//@ts-ignore
function dec2HexString(n) {
  return padding_zero((n * 1).toString(16).toUpperCase(), 2);
}
// @ts-ignore
async function sleep(msec) {
  return new Promise((resolve) => setTimeout(resolve, msec));
}
// @ts-ignore
async function send(device, data) {
  let uint8a = new Uint8Array(data);
  // window.alert('send' + uint8a);
  const result = await device.transferOut(2, uint8a);
  await sleep(10);
  // window.alert('result: ' + result.status);
}

// @ts-ignore
async function receive(device, len) {
  const result = await device.transferIn(2, len);
  await sleep(10);
  let arr = [];
  for (let i = result.data.byteOffset; i < result.data.byteLength; i++) {
    arr.push(result.data.getUint8(i));
  }
  // window.alert('receive: ' + arr);
  return arr;
}

//@ts-ignore
async function sendCommand2(device, data) {
  let argData = new Uint8Array(data);
  const dataLen = argData.length;
  const SLOTNUMBER = 0x00;
  let retVal = new Uint8Array(10 + dataLen);

  retVal[0] = 0x6b; // ヘッダー作成
  retVal[1] = 255 & dataLen; // length をリトルエンディアン
  retVal[2] = (dataLen >> 8) & 255;
  retVal[3] = (dataLen >> 16) & 255;
  retVal[4] = (dataLen >> 24) & 255;
  retVal[5] = SLOTNUMBER; // タイムスロット番号
  retVal[6] = ++seqNumber; // 認識番号

  0 != dataLen && retVal.set(argData, 10); // コマンド追加
  console.log('>>>>>>>>>>');
  console.log(Array.from(retVal).map((v) => v.toString(16)));
  await device.transferOut(2, retVal);
  await sleep(50);
}

// @ts-ignore
async function sendCommand(device, cmd, params) {
  let command = [0x00, 0x00, 0xff, 0xff, 0xff]; // packet header
  let data = [0xd6, cmd].concat(params); // command
  command = command.concat([data.length, 0, 256 - data.length]); // command length
  command = command.concat(data);
  // リトルエンディアンで計算
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    sum += data[i];
  }
  let parity = ((256 - sum) % 256) + 256;
  command = command.concat([parity, 0]);
  await send(device, command);
  await receive(device, 6); // カードからは必ずACKから帰るのでそれをまず受ける
  const result = await receive(device, 290); // max length?
  return result;
}

export async function webusbNew() {
  console.log('webusb()');
  // @ts-ignore
  // w3c-web-usbを使用するのが本式
  const device = await navigator?.usb.requestDevice(DEVICE_OPTIONS);
  console.log(device);
  // @ts-ignore
  // window.alert('connected: ' + device.productName); // Pasori RC-S300/S
  // window.alert('venderId: ' + device.vendorId); // 1356
  // window.alert('productId: ' + device.productId); // 3528
  await device.open();
  // only Pasori RC-S300/S
  await device.selectConfiguration(1);
  await device.claimInterface(1);
  let rcs300_com_length = 0;
  let header = [];
  // endtransparent
  await sendCommand2(device, [0xff, 0x50, 0x00, 0x00, 0x02, 0x82, 0x00, 0x00]);
  // ['83', '07', '00', '00', '00', '00', '01', '02', '00', '00']
  header = await receive(device, 10);
  // ['C0', '03', '00', '90', '00', '90', '00']
  await receive(device, get_header_length(header));
  // startransparent

  await sendCommand2(device, [0xff, 0x50, 0x00, 0x00, 0x02, 0x81, 0x00, 0x00]);
  // ['83', '07', '00', '00', '00', '00', '01', '02', '00', '00']
  header = await receive(device, 10);
  // ['C0', '03', '00', '90', '00', '90', '00']
  await receive(device, get_header_length(header));

  // rf off
  await sendCommand2(device, [0xff, 0x50, 0x00, 0x00, 0x02, 0x83, 0x00, 0x00]);
  // ['83', '07', '00', '00', '00', '00', '01', '02', '00', '00']
  header = await receive(device, 10);
  // ['C0', '03', '00', '90', '00', '90', '00']
  await receive(device, get_header_length(header));

  // rf on
  await sendCommand2(device, [0xff, 0x50, 0x00, 0x00, 0x02, 0x84, 0x00, 0x00]);
  // ['83', '07', '00', '00', '00', '00', '01', '02', '00', '00']
  header = await receive(device, 10);
  // ['C0', '03', '00', '90', '00', '90', '00']
  await receive(device, get_header_length(header));

  // SwitchProtocolTypeF
  await sendCommand2(
    device,
    [0xff, 0x50, 0x00, 0x02, 0x04, 0x8f, 0x02, 0x03, 0x00, 0x00]
  );
  header = await receive(device, 10);
  // ['C0', '03', '00', '90', '00', '90', '00']
  await receive(device, get_header_length(header));

  // ferica poling
  await sendCommand2(
    device,
    [
      0xff, 0x50, 0x00, 0x01, 0x00, 0x00, 0x11, 0x5f, 0x46, 0x04, 0xa0, 0x86,
      0x01, 0x00, 0x95, 0x82, 0x00, 0x06, 0x06, 0x00, 0xff, 0xff, 0x01, 0x00,
      0x00, 0x00, 0x00,
    ]
  );
  // poling検出時 *がIDm
  // ['83', '24', '00', '00', '00', '00', '06', '02', '00', '00']
  // ['C0', '03', '00', '90', '00', '92', '01', '00', '96', '02', '00', '00', '97', '14', '14', '01', '**', '**', '**', '**', '**', '**', '**', '**', '05', '31', '43', '45', '46', '82', 'B7', 'FF', '00', '03', '90', '00']
  // poling未検出時
  // ['83', '07', '00', '00', '00', '00', '98', '02', '00', '00']
  // ['C0', '03', '02', '64', '01', '90', '00']
  header = await receive(device, 10);
  const poling_res_f = await receive(device, get_header_length(header));
  if (poling_res_f.length == 36) {
    const idm = poling_res_f.slice(16, 24).map((v) => dec2HexString(v));
    const idmStr = idm.join(' ');
    console.log('Card Type: Felica  カードのIDm: ' + idmStr);

    return;
  }
  // SwitchProtocolTypeA
  await sendCommand2(
    device,
    [0xff, 0x50, 0x00, 0x02, 0x04, 0x8f, 0x02, 0x00, 0x03, 0x00]
  );
  header = await receive(device, 10);
  // ['C0', '03', '00', '90', '00', '90', '00']
  await receive(device, get_header_length(header));

  // GET Card UID
  await sendCommand2(device, [0xff, 0xca, 0x00, 0x00]);

  // poling検出時 *がIDm
  // ['83', '06', '00', '00', '00', '00', '04', '02', '00', '00']
  // ['**', '**', '**', '**', '90', '00']

  // ['83', '07', '00', '00', '00', '00', '41', '02', '00', '00']
  // ['C0', '03', '01', '64', '01', '90', '00']
  // or ['6F', '00']
  header = await receive(device, 10);
  const poling_res_a = await receive(device, get_header_length(header));
  if (poling_res_a.length == 6) {
    const id = poling_res_a.slice(0, 4).map((v) => dec2HexString(v));
    const idStr = id.join(' ');
    console.log('Card Type : MIFARE  カードのID: ' + idStr);
    return;
  }
}

export async function webusb() {
  console.log('webusb()');
  try {
    // @ts-ignore
    // w3c-web-usbを使用するのが本式
    const device = await navigator?.usb.requestDevice(DEVICE_OPTIONS);
    console.log(device);
    // @ts-ignore
    // window.alert('connected: ' + device.productName); // Pasori RC-S300/S
    // window.alert('venderId: ' + device.vendorId); // 1356
    // window.alert('productId: ' + device.productId); // 3528
    await device.open();
    if (device.productId === 3528) {
      // only Pasori RC-S300/S
      await device.selectConfiguration(1);
      await device.claimInterface(1);
      await send(device, ACK_PACKET); // カードの活性化と疎通確認
      console.log('send ACK_PACKET');
      // [0x00, 0x00, 0xff, 0xff, 0xff, 0x03, 0x00, 0xfd, 0xd6, 0x2a, 0x01, 0xff, 0x00]
      // [0x00, 0x00, 0xff, 0xff, 0xff, 0x03, 0x00, 0xfd, 0xd6, 0x06, 0x00, 0x24, 0x00]
      // [0x00, 0x00, 0xff, 0xff, 0xff, 0x03, 0x00, 0xfd, 0xd6, 0x06, 0x00, 0x24, 0x00]
      // [0x00, 0x00, 0xff, 0xff, 0xff, 0x06, 0x00, 0xfa, 0xd6, 0x00, 0x01, 0x01, 0x0f, 0x01, 0x18, 0x00]
      // [0x00, 0x00, 0xff, 0xff, 0xff, 0x28, 0x00, 0xd8, 0xd6, 0x02, 0x00, 0x18, 0x01, 0x01, 0x02, 0x01, 0x03, 0x00, 0x04, 0x00, 0x05, 0x00, 0x06, 0x00, 0x07, 0x08, 0x08, 0x00, 0x09, 0x00, 0x0a, 0x00, 0x0b, 0x00, 0x0c, 0x00, 0x0e, 0x04, 0x0f, 0x00, 0x10, 0x00, 0x11, 0x00, 0x12, 0x00, 0x13, 0x06, 0x4b, 0x00]
      // [0x00, 0x00, 0xff, 0xff, 0xff, 0x04, 0x00, 0xfc, 0xd6, 0x02, 0x00, 0x18, 0x10, 0x00]
      // [0x00, 0x00, 0xff, 0xff, 0xff, 0x0a, 0x00, 0xf6, 0xd6, 0x04, 0x6e, 0x00, 0x06, 0x00, 0xff, 0xff, 0x01, 0x00, 0xb3, 0x00]
    }
    if (device.productId === 1731) {
    }
  } catch (error) {
    console.error(error);
    window.alert('error: ' + error);
  }
}
