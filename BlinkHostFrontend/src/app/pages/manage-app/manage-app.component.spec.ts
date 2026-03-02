import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageAppComponent } from './manage-app.component';

describe('ManageAppComponent', () => {
  let component: ManageAppComponent;
  let fixture: ComponentFixture<ManageAppComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ManageAppComponent]
    });
    fixture = TestBed.createComponent(ManageAppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
