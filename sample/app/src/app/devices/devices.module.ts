import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { IonicModule } from '@ionic/angular';

import { DevicesPageRoutingModule } from './devices-routing.module';
import { DevicesPage } from './devices.page';

@NgModule({
  imports: [CommonModule, IonicModule, DevicesPageRoutingModule],
  declarations: [DevicesPage],
  exports: [],
})
export class DevicesPageModule {}
