import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProseEditorComponent } from './prose-editor.component';

describe('ProseEditorComponent', () => {
  let component: ProseEditorComponent;
  let fixture: ComponentFixture<ProseEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProseEditorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProseEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
