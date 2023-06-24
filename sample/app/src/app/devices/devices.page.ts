import { Component, OnInit } from '@angular/core';
import { webusb } from './usb/usb.service';
import { webnfc } from './nfc/nfc.service';
import { webusbNew } from './usb/usb.service';

@Component({
  selector: 'devices',
  templateUrl: './devices.page.html',
  styleUrls: ['./devices.page.scss'],
})
export class DevicesPage implements OnInit {
  constructor() {}

  ngOnInit() {}

  callMethod() {
    webusbNew();
  }

  callMethod2() {
    webnfc();
  }
}
