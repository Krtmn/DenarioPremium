import { Component, Input } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import {
  TEXT_COMMENT_MAX_LENGTH,
  TEXT_COMMENT_MIN_LENGTH,
} from 'src/app/utils/text-comment-field.constants';
import {
  getTextCommentCounter,
  getTextCommentHint,
  getTextCommentLength,
} from 'src/app/utils/text-comment-field.util';

@Component({
  selector: 'app-text-comment-counter',
  standalone: true,
  imports: [IonicModule],
  template: `
    <div class="text-comment-counter">
      <ion-note class="text-comment-hint">{{ hintText }}</ion-note>
      <ion-note class="text-comment-count">{{ counterText }}</ion-note>
    </div>
  `,
  styles: [`
    .text-comment-counter {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
      padding: 2px 4px 0;
      font-size: 12px;
      line-height: 1.2;
    }

    .text-comment-hint,
    .text-comment-count {
      font-size: 12px;
    }

    .text-comment-count {
      margin-left: auto;
      white-space: nowrap;
    }
  `],
})
export class TextCommentCounterComponent {
  @Input() value: string | null | undefined = '';
  @Input() minLength: number = TEXT_COMMENT_MIN_LENGTH;
  @Input() maxLength: number = TEXT_COMMENT_MAX_LENGTH;

  get hintText(): string {
    return getTextCommentHint(this.minLength, this.maxLength);
  }

  get counterText(): string {
    return getTextCommentCounter(getTextCommentLength(this.value), this.maxLength);
  }
}
