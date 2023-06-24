// use type > https://www.npmjs.com/package/@types/w3c-web-usb
// TODO: 接続されたデバイスを特定する

const DEVICE_FILTER = {};
const DEVICE_OPTIONS = {
  filters: [DEVICE_FILTER],
};
export async function webusb() {
  console.log('webusb()');
  try {
    // @ts-ignore
    // w3c-web-usbを使用するのが本式
    const device = await navigator?.usb.requestDevice(DEVICE_OPTIONS);
    console.log('device', device);
    await device.open();
    console.log('opened', device);
    await device.selectConfiguration(1);
    console.log('configured', device);
  } catch (error) {
    console.error(error);
  }
}
