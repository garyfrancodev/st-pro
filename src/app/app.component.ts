import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {ProseEditorComponent} from './shared/prose-editor/prose-editor.component';
import {ProseMirrorEditableDirective} from './shared/prose-editor/prosemirror-editable.directive';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ProseEditorComponent, ProseMirrorEditableDirective],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'st-pro';
  protected readonly alert = alert;
}
