// use type > https://www.npmjs.com/package/@types/w3c-web-usb
// TODO: 接続されたデバイスを特定する

const DEVICE_FILTER = {};
const DEVICE_OPTIONS = {
  filters: [DEVICE_FILTER],
};
const ACK_PACKET = Uint8Array.of(0x00, 0x00, 0xff, 0x00, 0xff, 0x00);
const command = Uint8Array.of(
  0x00,
  0x00,
  0xff,
  0xff,
  0xff,
  0x03,
  0x00,
  0xfd,
  0xd6,
  0x2a,
  0x01,
  0xff,
  0x00
);
export async function webusb() {
  console.log('webusb()');
  try {
    // @ts-ignore
    // w3c-web-usbを使用するのが本式
    const device = await navigator?.usb.requestDevice(DEVICE_OPTIONS);
    console.log('device', device);
    window.alert('device: ' + device.productName);
    await device.open();
    console.log('opened', device.productName);
    window.alert('opened: ' + device.productName);
    await device.selectConfiguration(1);
    console.log('configured', device.productName);
    window.alert('configured: ' + device.productName);
    await device.claimInterface(1);
    console.log('claimed', device.productName);
    window.alert('claimed: ' + device.productName);
    const result = await device.transferOut(2, ACK_PACKET);
    console.log('transferOut', result);
    window.alert('transferOut: ' + JSON.stringify(result));
    const result1 = await device.transferOut(2, command);
    console.log('transferOut', result1);
    window.alert('transferOut: ' + JSON.stringify(result1));
    const result2 = await device.transferIn(2, 6);
    console.log('transferIn', result2);
    window.alert('transferIn: ' + JSON.stringify(result2));
  } catch (error) {
    console.error(error);
    window.alert('error: ' + error);
  }
}
