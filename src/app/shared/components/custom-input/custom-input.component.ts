import { Component, Input } from '@angular/core';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-custom-input',
  templateUrl: './custom-input.component.html',
  styleUrls: ['./custom-input.component.scss'],
  standalone: false,
})
export class CustomInputComponent {
  @Input({ required: true }) label!: string;
  @Input({ required: true }) control!: FormControl;
  @Input() type = 'text';
  @Input() placeholder = '';
  @Input() maxlength?: number;

  get hasError(): boolean {
    return !!this.control && this.control.invalid && (this.control.dirty || this.control.touched);
  }
}
