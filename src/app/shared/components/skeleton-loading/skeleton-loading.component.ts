import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-skeleton-loading',
  templateUrl: './skeleton-loading.component.html',
  styleUrls: ['./skeleton-loading.component.scss'],
  standalone: false,
})
export class SkeletonLoadingComponent {
  @Input() rows = 3;

  get skeletonRows(): number[] {
    return Array.from({ length: this.rows }, (_, i) => i);
  }
}
