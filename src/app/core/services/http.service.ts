import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class HttpService {
  constructor(private readonly http: HttpClient) {}

  post<T>(url: string, body: unknown, token?: string): Observable<T> {
    const headers = token
      ? new HttpHeaders({ Authorization: token })
      : undefined;
    return this.http.post<T>(url, body, { headers });
  }
}
