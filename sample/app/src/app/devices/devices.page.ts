import { Component, OnInit } from '@angular/core';
import { webusb } from './usb/usb.service';
import { webnfc } from './nfc/nfc.service';

@Component({
  selector: 'devices',
  templateUrl: './devices.page.html',
  styleUrls: ['./devices.page.scss'],
})
export class DevicesPage implements OnInit {
  constructor() {}

  ngOnInit() {}

  callMethod() {
    webusb();
  }

  callMethod2() {
    webnfc();
  }
}
