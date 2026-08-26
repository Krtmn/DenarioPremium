import {
  AfterViewInit,
  Directive,
  ElementRef,
  HostListener,
  Input,
  OnDestroy,
  Renderer2,
} from '@angular/core';

interface FabPosition {
  x: number;
  y: number;
}

const STORAGE_PREFIX = 'draggable-fab-position:';
const DRAG_THRESHOLD_PX = 8;
const VIEWPORT_PADDING_PX = 4;

@Directive({
  selector: '[appDraggableFab]',
  standalone: true,
})
export class DraggableFabDirective implements AfterViewInit, OnDestroy {
  @Input('appDraggableFab') storageKey = 'default';

  private pointerId: number | null = null;
  private startX = 0;
  private startY = 0;
  private originX = 0;
  private originY = 0;
  private dragging = false;
  private moved = false;
  private suppressNextClick = false;
  private position: FabPosition = { x: 0, y: 0 };

  constructor(
    private readonly el: ElementRef<HTMLElement>,
    private readonly renderer: Renderer2,
  ) {}

  ngAfterViewInit(): void {
    this.renderer.addClass(this.el.nativeElement, 'draggable-fab');
    requestAnimationFrame(() => this.initializePosition());
  }

  ngOnDestroy(): void {
    this.endDrag(true);
  }

  @HostListener('pointerdown', ['$event'])
  onPointerDown(event: PointerEvent): void {
    if (event.button !== 0 || !this.isMainFabButtonTarget(event.target)) {
      return;
    }

    this.pointerId = event.pointerId;
    this.startX = event.clientX;
    this.startY = event.clientY;
    this.originX = this.position.x;
    this.originY = this.position.y;
    this.dragging = false;
    this.moved = false;

    this.el.nativeElement.setPointerCapture(event.pointerId);
  }

  @HostListener('pointermove', ['$event'])
  onPointerMove(event: PointerEvent): void {
    if (this.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - this.startX;
    const deltaY = event.clientY - this.startY;

    if (!this.dragging) {
      if (Math.hypot(deltaX, deltaY) < DRAG_THRESHOLD_PX) {
        return;
      }
      this.dragging = true;
      this.renderer.addClass(this.el.nativeElement, 'is-dragging');
    }

    this.moved = true;
    event.preventDefault();
    this.applyPosition(this.originX + deltaX, this.originY + deltaY, false);
  }

  @HostListener('pointerup', ['$event'])
  onPointerUp(event: PointerEvent): void {
    if (this.pointerId !== event.pointerId) {
      return;
    }
    this.endDrag(this.moved);
  }

  @HostListener('pointercancel', ['$event'])
  onPointerCancel(event: PointerEvent): void {
    if (this.pointerId !== event.pointerId) {
      return;
    }
    this.endDrag(false);
  }

  @HostListener('click', ['$event'])
  onClick(event: Event): void {
    if (!this.suppressNextClick) {
      return;
    }

    event.preventDefault();
    event.stopImmediatePropagation();
    this.suppressNextClick = false;
  }

  private initializePosition(): void {
    const saved = this.loadPosition();
    if (saved) {
      this.applyPosition(saved.x, saved.y, false);
      return;
    }

    const rect = this.el.nativeElement.getBoundingClientRect();
    this.applyPosition(rect.left, rect.top, false);
  }

  private endDrag(save: boolean): void {
    if (this.pointerId !== null) {
      try {
        this.el.nativeElement.releasePointerCapture(this.pointerId);
      } catch {
        // Ignorar si el puntero ya no está capturado.
      }
    }

    if (this.dragging) {
      this.renderer.removeClass(this.el.nativeElement, 'is-dragging');
      if (save) {
        this.suppressNextClick = true;
        this.savePosition();
      }
    }

    this.pointerId = null;
    this.dragging = false;
    this.moved = false;
  }

  private isMainFabButtonTarget(target: EventTarget | null): boolean {
    if (!(target instanceof Element)) {
      return false;
    }

    const fabList = this.el.nativeElement.querySelector('ion-fab-list');
    if (fabList?.contains(target)) {
      return false;
    }

    const mainButton = this.el.nativeElement.querySelector(':scope > ion-fab-button');
    return !!mainButton && (mainButton === target || mainButton.contains(target));
  }

  private applyPosition(x: number, y: number, persistDefaults: boolean): void {
    const clamped = this.clampPosition(x, y);
    this.position = clamped;

    const host = this.el.nativeElement;
    this.renderer.setStyle(host, 'position', 'fixed');
    this.renderer.setStyle(host, 'left', `${clamped.x}px`);
    this.renderer.setStyle(host, 'top', `${clamped.y}px`);
    this.renderer.setStyle(host, 'right', 'auto');
    this.renderer.setStyle(host, 'bottom', 'auto');
    this.renderer.setStyle(host, 'margin', '0');

    if (persistDefaults) {
      this.savePosition();
    }
  }

  private clampPosition(x: number, y: number): FabPosition {
    const rect = this.el.nativeElement.getBoundingClientRect();
    const width = rect.width || 56;
    const height = rect.height || 56;
    const safeArea = this.getSafeAreaInsets();

    const minX = safeArea.left + VIEWPORT_PADDING_PX;
    const minY = safeArea.top + VIEWPORT_PADDING_PX;
    const maxX = Math.max(minX, window.innerWidth - width - safeArea.right - VIEWPORT_PADDING_PX);
    const maxY = Math.max(minY, window.innerHeight - height - safeArea.bottom - VIEWPORT_PADDING_PX);

    return {
      x: Math.min(Math.max(x, minX), maxX),
      y: Math.min(Math.max(y, minY), maxY),
    };
  }

  private getSafeAreaInsets(): { top: number; right: number; bottom: number; left: number } {
    const styles = getComputedStyle(document.documentElement);
    const read = (name: string): number => {
      const value = parseInt(styles.getPropertyValue(name) || '0', 10);
      return Number.isFinite(value) ? value : 0;
    };

    return {
      top: read('--ion-safe-area-top'),
      right: read('--ion-safe-area-right'),
      bottom: read('--ion-safe-area-bottom'),
      left: read('--ion-safe-area-left'),
    };
  }

  private loadPosition(): FabPosition | null {
    try {
      const raw = localStorage.getItem(`${STORAGE_PREFIX}${this.storageKey}`);
      if (!raw) {
        return null;
      }

      const parsed = JSON.parse(raw) as FabPosition;
      if (typeof parsed.x !== 'number' || typeof parsed.y !== 'number') {
        return null;
      }

      return this.clampPosition(parsed.x, parsed.y);
    } catch {
      return null;
    }
  }

  private savePosition(): void {
    try {
      localStorage.setItem(
        `${STORAGE_PREFIX}${this.storageKey}`,
        JSON.stringify(this.position),
      );
    } catch {
      // Ignorar fallos de almacenamiento local.
    }
  }
}
