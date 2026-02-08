Dưới đây là tổng hợp **các cách sử dụng chính** của **@dnd-kit** (dựa trên tài liệu chính thức tại https://docs.dndkit.com/). Tôi sẽ trình bày dưới dạng **markdown** rõ ràng, tập trung vào các cách sử dụng phổ biến và thực tế nhất.

### 1. Cài đặt (Installation)

```bash
# Core (bắt buộc)
npm install @dnd-kit/core
# hoặc
yarn add @dnd-kit/core

# Nếu muốn dùng tính năng sortable (rất phổ biến)
npm install @dnd-kit/sortable

# Thường dùng thêm modifiers đẹp hơn
npm install @dnd-kit/modifiers
```

### 2. Cách sử dụng cơ bản nhất (Low-level – @dnd-kit/core)

Đây là cách **tự xây** drag & drop từ đầu.

```tsx
import { DndContext, useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

function DraggableItem() {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: 'item-1',
  });

  const style = transform ? {
    transform: CSS.Translate.toString(transform),
  } : undefined;

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      Kéo tôi đi
    </div>
  );
}

function DroppableZone() {
  const { setNodeRef, isOver } = useDroppable({
    id: 'droppable-zone',
  });

  return (
    <div ref={setNodeRef} style={{ background: isOver ? '#e0ffe0' : '#f0f0f0' }}>
      Thả vào đây
    </div>
  );
}

function App() {
  function handleDragEnd(event) {
    const { active, over } = event;
    if (over) {
      console.log(`${active.id} được thả vào ${over.id}`);
      // → xử lý logic ở đây (reorder, move giữa container, ...)
    }
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <DraggableItem />
      <DroppableZone />
    </DndContext>
  );
}
```

### 3. Các cách sử dụng phổ biến nhất (thực tế 90% dự án)

#### 3.1 Sortable List dọc (Vertical list) – Cách dùng phổ biến nhất

```tsx
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableItem({ id, children }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
}

function SortableList() {
  const [items, setItems] = useState(['A', 'B', 'C', 'D']);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={(event) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
          setItems((items) => {
            const oldIndex = items.indexOf(active.id);
            const newIndex = items.indexOf(over.id);
            return arrayMove(items, oldIndex, newIndex);
          });
        }
      }}
    >
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        {items.map((id) => (
          <SortableItem key={id} id={id}>
            Item {id}
          </SortableItem>
        ))}
      </SortableContext>
    </DndContext>
  );
}
```

#### 3.2 Các biến thể sortable rất hay dùng

| Cách dùng                     | Strategy / Đặc điểm chính                              | Khi nào dùng                              |
|-------------------------------|-----------------------------------------------------|--------------------------------------------|
| **Horizontal list**           | `horizontalListSortingStrategy`                     | Menu ngang, tabs, carousel items           |
| **Grid / Masonry**            | `rectSortingStrategy` (mặc định)                    | Gallery ảnh, kanban cards, dashboard       |
| **Multiple containers**       | Nhiều `<SortableContext>` + logic `onDragOver`      | Kanban board, 4 cột, trello-like           |
| **Nested Sortable**           | `<SortableContext>` lồng nhau                       | Tree view, folder có sub-items             |
| **Drag Handle**               | Chỉ gắn `listeners` vào icon grip                   | Tránh kéo nhầm nội dung (card có text dài) |
| **Drag Overlay**              | Dùng `<DragOverlay>`                                | Hiển thị item đẹp khi đang kéo             |
| **Keyboard accessible**       | Thêm `KeyboardSensor` + `sortableKeyboardCoordinates` | Ứng dụng cần hỗ trợ bàn phím (accessibility) |

#### 3.3 Drag Overlay (hiển thị item đang kéo đẹp hơn)

```tsx
import { DragOverlay } from '@dnd-kit/core';

function App() {
  const [activeId, setActiveId] = useState(null);

  return (
    <DndContext
      onDragStart={(e) => setActiveId(e.active.id)}
      onDragEnd={() => setActiveId(null)}
    >
      {/* ... các sortable items ... */}

      <DragOverlay>
        {activeId ? <div className="dragging-item">Item {activeId}</div> : null}
      </DragOverlay>
    </DndContext>
  );
}
```

### 4. Các tính năng nâng cao hay dùng

- **Sensors** (cách kích hoạt kéo):
  - `PointerSensor` (chuột + cảm ứng)
  - `MouseSensor` / `TouchSensor` riêng biệt
  - `KeyboardSensor` (dùng phím mũi tên)
  - Tự viết sensor (ví dụ: kéo bằng long-press)

- **Modifiers** (@dnd-kit/modifiers):
  - `restrictToVerticalAxis`
  - `restrictToHorizontalAxis`
  - `restrictToWindowEdges`
  - `snapToGrid`
  - `snapCenterToCenter`

```tsx
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';

<DndContext modifiers={[restrictToVerticalAxis]}>
  ...
</DndContext>
```

- **Collision Detection** (thay đổi thuật toán phát hiện va chạm):
  - `closestCenter` (khuyên dùng cho list/sortable)
  - `closestCorners`
  - `rectangleIntersection` (mặc định)
  - Tự viết thuật toán riêng

- **Auto-scroll**:
  - Dùng `useDraggable` / `useSortable` trong container có `overflow: auto`
  - Có thể tùy chỉnh với `activationConstraint`

### 5. Tóm tắt các cách sử dụng chính theo mức độ phổ biến

1. **Sortable list dọc / ngang** (phổ biến nhất)  
2. **Kanban board / multiple containers**  
3. **Grid / photo gallery**  
4. **Drag handle + DragOverlay** (cho UX đẹp)  
5. **Nested / tree sortable**  
6. **Custom drag & drop** (dùng `useDraggable` + `useDroppable` thuần)  
7. **Accessibility-focused** (keyboard + screen reader)  
8. **Restrict axis / snap / modifiers**  

Nếu bạn muốn code mẫu chi tiết cho một trường hợp cụ thể (kanban, nested, grid, tree, form builder, …), cứ nói rõ mình sẽ đưa code đầy đủ hơn nhé!