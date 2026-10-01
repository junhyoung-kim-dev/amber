// 목록 배치를 유지한 채 오버레이와 삽입선만 움직인다. 원본을 제거하면 목록 높이와
// scrollTop이 바뀌므로 드래그 시작 직후 항목과 화면이 튈 수 있다.
import { clampDropDepth, type DropSlot, type TreeRow } from "./todoTree";

type Candidate = TreeRow & { element: HTMLElement };

export function trackTodoDrag({
  list,
  sourceRow,
  sourceUnit,
  candidates,
  sourceDepth,
  startX,
  startY,
  label,
  descendants,
  indent,
  onDrop,
}: {
  list: HTMLElement;
  sourceRow: HTMLElement;
  sourceUnit: HTMLElement;
  candidates: Candidate[];
  sourceDepth: number;
  startX: number;
  startY: number;
  label: string;
  descendants: number;
  indent: number;
  onDrop: (slot: DropSlot) => void;
}): () => void {
  const sourceRect = sourceRow.getBoundingClientRect();
  const grabX = startX - sourceRect.left;
  const grabY = startY - sourceRect.top;
  let pointer = { x: startX, y: startY };
  let moved = false;
  let finished = false;
  let frame: number | null = null;
  let overlay: HTMLDivElement | null = null;
  let line: HTMLDivElement | null = null;
  let slot: DropSlot | null = null;

  const begin = () => {
    document.body.classList.add("dragging-rows");
    sourceUnit.classList.add("drag-source");
    overlay = document.createElement("div");
    overlay.className = "todo-drag-overlay";
    overlay.style.width = `${Math.min(sourceRect.width, 420)}px`;
    const text = document.createElement("span");
    text.className = "todo-drag-label";
    text.textContent = label;
    overlay.appendChild(text);
    if (descendants > 0) {
      const chip = document.createElement("span");
      chip.className = "todo-drag-count";
      chip.textContent = `+${descendants}`;
      overlay.appendChild(chip);
    }
    document.body.appendChild(overlay);
    line = document.createElement("div");
    line.className = "todo-drop-line on";
    list.appendChild(line);
  };

  const apply = () => {
    if (!overlay || !line) return;
    overlay.style.transform = `translate(${pointer.x - grabX}px, ${pointer.y - grabY}px)`;
    // 스크롤 뒤에도 현재 표시 위치를 쓴다. 후보 행은 움직이지 않아 판정과 표시가 일치한다.
    const rects = candidates.map((row) => row.element.getBoundingClientRect());
    let idx = 0;
    while (idx < rects.length && pointer.y > rects[idx].top + rects[idx].height / 2) idx++;
    const above = candidates[idx - 1] ?? null;
    const below = candidates[idx] ?? null;
    const desired = sourceDepth + Math.round((pointer.x - startX) / indent);
    const depth = clampDropDepth(desired, above, below);
    slot = { idx, depth };

    const listRect = list.getBoundingClientRect();
    const css = getComputedStyle(list);
    const padL = parseFloat(css.paddingLeft) || 0;
    const padR = parseFloat(css.paddingRight) || 0;
    const y = below ? rects[idx].top : above ? rects[idx - 1].bottom : sourceRect.top;
    const x = padL + 10 + depth * indent;
    line.style.width = `${Math.max(0, listRect.width - padR - x - 8)}px`;
    line.style.transform = `translate(${x}px, ${y - listRect.top - list.clientTop + list.scrollTop - 1}px)`;
  };

  const schedule = () => {
    if (frame != null) return;
    frame = requestAnimationFrame(() => {
      frame = null;
      if (!finished) apply();
    });
  };

  const cleanup = () => {
    if (finished) return;
    finished = true;
    if (frame != null) cancelAnimationFrame(frame);
    window.removeEventListener("mousemove", move);
    window.removeEventListener("mouseup", up);
    window.removeEventListener("keydown", key);
    window.removeEventListener("blur", cleanup);
    window.removeEventListener("scroll", scroll, true);
    document.body.classList.remove("dragging-rows");
    sourceUnit.classList.remove("drag-source");
    overlay?.remove();
    line?.remove();
  };
  const move = (event: MouseEvent) => {
    pointer = { x: event.clientX, y: event.clientY };
    if (!moved) {
      if (Math.abs(pointer.x - startX) < 5 && Math.abs(pointer.y - startY) < 5) return;
      moved = true;
      begin();
    }
    schedule();
  };
  const up = (event: MouseEvent) => {
    pointer = { x: event.clientX, y: event.clientY };
    if (moved) apply(); // 마지막 이동이 그리기 대기 중이어도 실제로 놓은 위치를 저장한다.
    const drop = slot;
    cleanup();
    if (moved && drop) onDrop(drop);
  };
  const key = (event: KeyboardEvent) => {
    if (event.key !== "Escape") return;
    event.preventDefault();
    cleanup();
  };
  const scroll = () => {
    if (moved) schedule();
  };
  window.addEventListener("mousemove", move);
  window.addEventListener("mouseup", up);
  window.addEventListener("keydown", key);
  window.addEventListener("blur", cleanup);
  window.addEventListener("scroll", scroll, true);
  return cleanup;
}
