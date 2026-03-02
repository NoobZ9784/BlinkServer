import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BackToHomeComponent } from './back-to-home.component';

describe('BackToHomeComponent', () => {
  let component: BackToHomeComponent;
  let fixture: ComponentFixture<BackToHomeComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [BackToHomeComponent]
    });
    fixture = TestBed.createComponent(BackToHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
