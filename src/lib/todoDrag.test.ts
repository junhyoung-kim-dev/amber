// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { trackTodoDrag } from "./todoDrag";
import { resolveDrop, type DropSlot, type TreeRow } from "./todoTree";

const rect = (top: number, height = 40) => ({
  top, bottom: top + height, left: 0, right: 300, width: 300, height, x: 0, y: top,
  toJSON: () => ({}),
}) as DOMRect;

function fixture() {
  const list = document.createElement("div");
  list.innerHTML = '<div id="a"></div><div id="source"><div id="b"></div><div id="child"></div></div><div id="c"></div>';
  document.body.appendChild(list);
  const a = list.querySelector<HTMLElement>("#a")!;
  const b = list.querySelector<HTMLElement>("#b")!;
  const c = list.querySelector<HTMLElement>("#c")!;
  const source = list.querySelector<HTMLElement>("#source")!;
  vi.spyOn(list, "getBoundingClientRect").mockImplementation(() => rect(80, 200));
  for (const [element, top] of [[a, 100], [b, 140], [c, 220]] as const) {
    vi.spyOn(element, "getBoundingClientRect").mockImplementation(() => rect(top - list.scrollTop));
  }
  const candidates = [
    { id: 1, parent_id: null, depth: 0, element: a },
    { id: 3, parent_id: null, depth: 0, element: c },
  ];
  const onDrop = vi.fn<(slot: DropSlot) => void>();
  const cancel = trackTodoDrag({ list, sourceRow: b, sourceUnit: source, candidates,
    sourceDepth: 0, startX: 10, startY: 150, label: "작업 B", descendants: 1, indent: 24, onDrop });
  return { list, source, a, c, candidates, onDrop, cancel };
}
const move = (x: number, y: number) => window.dispatchEvent(new MouseEvent("mousemove", { clientX: x, clientY: y }));
const up = (x: number, y: number) => window.dispatchEvent(new MouseEvent("mouseup", { clientX: x, clientY: y }));
const draw = () => vi.advanceTimersByTime(16);

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => setTimeout(() => cb(0), 16));
  vi.stubGlobal("cancelAnimationFrame", (id: number) => clearTimeout(id));
});
afterEach(() => {
  window.dispatchEvent(new Event("blur"));
  document.body.replaceChildren();
  document.body.className = "";
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("할 일 드래그의 표시와 실제 드롭", () => {
  it("원본과 자손을 목록에 남겨 높이를 유지하고 다른 행을 밀지 않는다", () => {
    const { list, source, a, c, cancel } = fixture();
    list.scrollTop = 60;
    move(10, 160);
    draw();
    expect(source.classList.contains("drag-source")).toBe(true);
    expect(source.style.display).toBe("");
    expect(source.querySelector("#child")).not.toBeNull();
    expect(list.scrollTop).toBe(60);
    expect(a.style.transform).toBe("");
    expect(c.style.transform).toBe("");
    cancel();
    expect(source.classList.contains("drag-source")).toBe(false);
    expect(document.querySelector(".todo-drag-overlay")).toBeNull();
    expect(document.querySelector(".todo-drop-line")).toBeNull();
  });

  it.each([[110, 0, [2, 1, 3]], [270, 2, [1, 3, 2]]] as const)(
    "세로 %i에서 표시한 위치로 형제 순서를 정한다", (y, idx, order) => {
      const { candidates, onDrop } = fixture();
      move(10, y);
      draw();
      up(10, y);
      expect(onDrop).toHaveBeenCalledWith({ idx, depth: 0 });
      const nodes = [1, 2, 3].map(id => ({ id, parent_id: null }));
      expect(resolveDrop(nodes, candidates, 2, onDrop.mock.calls[0][0])?.orderedSiblingIds).toEqual(order);
    },
  );

  it("가로 이동을 하위 항목 드롭으로 해석한다", () => {
    const { onDrop, candidates } = fixture();
    move(34, 180);
    draw();
    up(34, 180);
    expect(onDrop).toHaveBeenCalledWith({ idx: 1, depth: 1 });
    const nodes = [1, 2, 3].map(id => ({ id, parent_id: null }));
    expect(resolveDrop(nodes, candidates as TreeRow[], 2, onDrop.mock.calls[0][0])?.newParentId).toBe(1);
  });

  it("스크롤만 바뀌어도 현재 행 좌표로 삽입선을 다시 그린다", () => {
    const { list, onDrop } = fixture();
    move(10, 180);
    draw();
    expect(list.querySelector<HTMLElement>(".todo-drop-line")!.style.transform).toBe("translate(10px, 139px)");
    list.scrollTop = 100;
    list.dispatchEvent(new Event("scroll"));
    draw();
    expect(list.querySelector<HTMLElement>(".todo-drop-line")!.style.transform).toBe("translate(10px, 179px)");
    up(10, 180);
    expect(onDrop).toHaveBeenCalledWith({ idx: 2, depth: 0 });
  });

  it("그리기 대기 중에 놓아도 마지막 mouseup 좌표를 저장한다", () => {
    const { onDrop } = fixture();
    move(10, 110);
    up(10, 270);
    expect(onDrop).toHaveBeenCalledExactlyOnceWith({ idx: 2, depth: 0 });
    draw();
    expect(document.querySelector(".todo-drop-line")).toBeNull();
  });

  it.each(["Escape", "blur", "화면 전환"])("%s 취소는 저장하지 않고 효과를 정리한다", (reason) => {
    const { onDrop, source, cancel } = fixture();
    move(10, 270);
    draw();
    if (reason === "Escape") window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    else if (reason === "blur") window.dispatchEvent(new Event("blur"));
    else cancel();
    up(10, 270);
    expect(onDrop).not.toHaveBeenCalled();
    expect(source.classList.contains("drag-source")).toBe(false);
    expect(document.querySelector(".todo-drag-overlay")).toBeNull();
  });

  it("손잡이 클릭만 하면 드래그 효과나 저장이 없다", () => {
    const { onDrop } = fixture();
    move(12, 152);
    up(12, 152);
    expect(onDrop).not.toHaveBeenCalled();
    expect(document.querySelector(".todo-drag-overlay")).toBeNull();
  });
});
