// use type > https://www.npmjs.com/package/@types/w3c-web-usb
// TODO: 接続されたデバイスを特定する

const DEVICE_FILTER = {};
const DEVICE_OPTIONS = {
  filters: [DEVICE_FILTER],
};
const ACK_PACKET = Uint8Array.of(0x00, 0x00, 0xff, 0x00, 0xff, 0x00);

// @ts-ignore
async function sleep(msec) {
  return new Promise((resolve) => setTimeout(resolve, msec));
}
// @ts-ignore
async function send(device, data) {
  let uint8a = new Uint8Array(data);
  window.alert('send' + uint8a);
  const result = await device.transferOut(2, uint8a);
  await sleep(10);
  window.alert('result: ' + result.status);
}

// @ts-ignore
async function receive(device, len) {
  const result = await device.transferIn(2, len);
  await sleep(10);
  let arr = [];
  for (let i = result.data.byteOffset; i < result.data.byteLength; i++) {
    arr.push(result.data.getUint8(i));
  }
  window.alert('receive: ' + arr);
  return arr;
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

export async function webusb() {
  console.log('webusb()');
  try {
    // @ts-ignore
    // w3c-web-usbを使用するのが本式
    const device = await navigator?.usb.requestDevice(DEVICE_OPTIONS);
    // @ts-ignore
    window.alert('connected: ' + device.productName); // Pasori RC-S300/S
    window.alert('venderId: ' + device.vendorId); // 1356
    window.alert('productId: ' + device.productId); // 3528
    await device.open();
    if (device.productId === 3528) {
      // only Pasori RC-S300/S
      await device.selectConfiguration(1);
      await device.claimInterface(1);
      await send(device, ACK_PACKET); // カードの活性化と疎通確認
      console.log('send ACK_PACKET');
      await sendCommand(device, 0x2a, [0x01]); // SetCommandType
      console.log('send SetCommandType');
      await sendCommand(device, 0x06, [0x00]); // SwitchRF
      console.log('send SwitchRF');
      // ↑ここまででカードの活性化と疎通確認ができる(共通処理)
      // ↓ここからカードの種類によって異なる処理
      await sendCommand(device, 0x00, [0x01, 0x01, 0x0f, 0x01]); // InSetRF
      console.log('send InSetRF');
      await sendCommand(
        device,
        0x02,
        [
          0x00, 0x18, 0x01, 0x01, 0x02, 0x01, 0x03, 0x00, 0x04, 0x00, 0x05,
          0x00, 0x06, 0x00, 0x07, 0x08, 0x08, 0x00, 0x09, 0x00, 0x0a, 0x00,
          0x0b, 0x00, 0x0c, 0x00, 0x0e, 0x04, 0x0f, 0x00, 0x10, 0x00, 0x11,
          0x00, 0x12, 0x00, 0x13, 0x06,
        ]
      ); // InSetProtocol
      // >> OK
      console.log('send InSetProtocol');
      await sendCommand(device, 0x02, [0x00, 0x18]); // InSetProtocol
      console.log('send InSetProtocol');
      await sendCommand(device, 0x04, [0x36, 0x01, 0x26]); // InCommRF:SENS
      console.log('send InCommRF:SENS');
      await sendCommand(device, 0x02, [0x04, 0x01, 0x07, 0x08]); // InCommRF:SOD
      console.log('send InCommRF:SOD');
      await sendCommand(device, 0x02, [0x01, 0x00, 0x02, 0x00]); // InCommRF:
      console.log('send InCommRF:');
      console.log('working');
      const ssdRes = await sendCommand(device, 0x04, [0x36, 0x01, 0x93, 0x20]);
      const array = ssdRes.slice(15, 19);
      window.alert('ssd: ' + array);
    } else {
      throw new Error('device.productId is not 3528');
    }
  } catch (error) {
    console.error(error);
    window.alert('error: ' + error);
  }
}
