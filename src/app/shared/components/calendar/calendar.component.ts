import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss'],
  standalone: false,
})
export class CalendarComponent {
  @Output() dateChange = new EventEmitter<string | null>();
  value = '';

  onDateSelect(value: string): void {
    this.value = value;
    const normalized = value ? value.slice(0, 10) : null;
    this.dateChange.emit(normalized);
  }

  clear(): void {
    this.value = '';
    this.dateChange.emit(null);
  }
}
