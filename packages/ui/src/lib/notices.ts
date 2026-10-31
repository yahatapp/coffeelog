export type NoticeVariant = "success" | "warning" | "error";
export type Notice = {
  id: number;
  message: string;
  variant: NoticeVariant;
};

let nextId = 0;
let notices: Notice[] = [];
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((listener) => listener());

export const noticeStore = {
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  getSnapshot: () => notices,
  dismiss: (id: number) => {
    notices = notices.filter((notice) => notice.id !== id);
    emit();
  },
};

// Keep notices outside route components so navigation cannot discard an operation's result.
export const notify = (notice: Omit<Notice, "id">) => {
  const id = ++nextId;
  notices = [...notices, { ...notice, id }];
  emit();
  return id;
};
