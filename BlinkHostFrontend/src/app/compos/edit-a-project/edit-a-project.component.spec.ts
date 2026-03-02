import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditAProjectComponent } from './edit-a-project.component';

describe('EditAProjectComponent', () => {
  let component: EditAProjectComponent;
  let fixture: ComponentFixture<EditAProjectComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EditAProjectComponent]
    });
    fixture = TestBed.createComponent(EditAProjectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
