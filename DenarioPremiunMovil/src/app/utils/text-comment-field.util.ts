import {
  TEXT_COMMENT_MAX_LENGTH,
  TEXT_COMMENT_MIN_LENGTH,
} from './text-comment-field.constants';

export function getTextCommentHint(
  minLength: number = TEXT_COMMENT_MIN_LENGTH,
  maxLength: number = TEXT_COMMENT_MAX_LENGTH,
): string {
  return `Mín. ${minLength} - Máx. ${maxLength} caracteres`;
}

export function getTextCommentCounter(
  currentLength: number,
  maxLength: number = TEXT_COMMENT_MAX_LENGTH,
): string {
  return `${currentLength}/${maxLength}`;
}

export function getTextCommentLength(value: string | null | undefined): number {
  return String(value ?? '').length;
}

export function applyTextCommentMaxLength(
  value: string,
  maxLength: number = TEXT_COMMENT_MAX_LENGTH,
): string {
  if (!value) {
    return '';
  }

  return value.length > maxLength ? value.slice(0, maxLength) : value;
}
