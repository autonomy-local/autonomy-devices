// use type > https://www.npmjs.com/package/@types/w3c-web-nfc

export async function webnfc() {
  console.log('webnfc()');
  try {
    // @ts-ignore
    // w3c-web-nfcを使用するのが本式
    const ndef = new NDEFReader();
    await ndef.scan();
    console.log('> Scan started');
    // @ts-ignore
    // w3c-web-nfcを使用するのが本式
    ndef.addEventListener('reading', ({ message, serialNumber }) => {
      console.log(`> Serial Number: ${serialNumber}`);
      console.log(`> Records: (${message.records.length})`);
      for (const record of message.records) {
        console.log(`> Record type: ${record.recordType}`);
        console.log(`> MIME type: ${record.mediaType}`);
        console.log(`> Record id: ${record.id}`);
        console.log(`> Record data: ${record.data}`);
      }
    });
  } catch (error) {
    console.error(error);
  }
}
