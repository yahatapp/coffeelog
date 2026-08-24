import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { dripperCreateSchema, dripperUpdateSchema } from "@/contracts";
import { dripperQueries, mutations, queryKeys, type Dripper } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type DripperFormValues = {
  name: string;
  isDefault: boolean;
};

const emptyValues: DripperFormValues = { name: "", isDefault: false };

const Drippers = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const drippersQuery = useQuery(dripperQueries.all());
  const drippers = drippersQuery.data ?? [];
  const [editingId, setEditingId] = useState<string | null>(null);

  const form = useForm({
    defaultValues: emptyValues,
    onSubmit: async ({ value }) => {
      const parsed = editingId
        ? dripperUpdateSchema.safeParse(value)
        : dripperCreateSchema.safeParse(value);
      if (!parsed.success) throw new Error("ドリッパー名を入力してください。");
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, value });
      } else {
        await createMutation.mutateAsync(value);
      }
    },
  });

  const createMutation = useMutation({
    mutationFn: (value: DripperFormValues) => mutations.createDripper({ json: value }),
    onSuccess: async () => {
      form.reset(emptyValues);
      await queryClient.invalidateQueries({ queryKey: queryKeys.drippers });
    },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, value }: { id: string; value: DripperFormValues }) =>
      mutations.updateDripper({ param: { id }, json: value }),
    onSuccess: async () => {
      setEditingId(null);
      form.reset(emptyValues);
      await queryClient.invalidateQueries({ queryKey: queryKeys.drippers });
    },
  });
  const defaultMutation = useMutation({
    mutationFn: (id: string) =>
      mutations.updateDripper({ param: { id }, json: { isDefault: true } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.drippers });
    },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => mutations.deleteDripper(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.drippers });
    },
  });
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const handleStartEdit = (dripper: Dripper) => {
    setEditingId(dripper.id);
    form.reset({ name: dripper.name, isDefault: dripper.isDefault });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    form.reset(emptyValues);
  };

  const formError = createMutation.error ?? updateMutation.error;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
          <ArrowLeft size={20} />
        </Button>
        <h2 className="text-xl font-bold text-coffee-primary">ドリッパー管理</h2>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void form.handleSubmit();
        }}
        className="space-y-3 bg-white p-4 rounded-2xl border border-coffee-secondary/15 shadow-sm"
      >
        <div className="flex justify-between items-center pb-1 border-b border-coffee-secondary/10 mb-2">
          <span className="text-xs font-bold text-coffee-primary">
            {editingId ? "ドリッパーの設定を編集" : "新規ドリッパー登録"}
          </span>
          {editingId && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="text-[10px] text-coffee-secondary underline"
            >
              キャンセル
            </button>
          )}
        </div>
        <div className="flex space-x-2">
          <form.Field name="name">
            {(field) => (
              <Input
                placeholder="新しいドリッパー名..."
                value={field.state.value}
                onChange={(event) => field.handleChange(event.target.value)}
                onBlur={field.handleBlur}
                className="rounded-xl border-coffee-secondary/20 flex-1 bg-white"
                required
                disabled={isSubmitting}
              />
            )}
          </form.Field>
          {editingId && (
            <Button
              type="button"
              variant="ghost"
              onClick={handleCancelEdit}
              disabled={isSubmitting}
              className="rounded-xl border border-coffee-secondary/20 text-coffee-secondary px-3 text-xs"
            >
              キャンセル
            </Button>
          )}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="rounded-xl bg-coffee-primary px-4 text-xs"
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin mr-1" size={16} />
            ) : editingId ? (
              <Pencil size={16} className="mr-1" />
            ) : (
              <Plus size={16} className="mr-1" />
            )}
            {editingId ? "保存" : "追加"}
          </Button>
        </div>
        <form.Field name="isDefault">
          {(field) => (
            <label className="flex items-center space-x-2 pt-1 text-xs font-medium text-coffee-text cursor-pointer">
              <input
                type="checkbox"
                checked={field.state.value}
                onChange={(event) => field.handleChange(event.target.checked)}
                className="rounded border-coffee-secondary/30 text-coffee-primary focus:ring-coffee-primary/50 w-4 h-4"
              />
              <span>このドリッパーをデフォルトに設定する</span>
            </label>
          )}
        </form.Field>
        {formError && <p className="text-xs text-red-600">保存に失敗しました。</p>}
      </form>

      {drippersQuery.isPending ? (
        <div className="h-20 w-full animate-pulse bg-coffee-secondary/10 rounded-xl" />
      ) : drippersQuery.isError ? (
        <div className="text-center p-8 text-coffee-secondary">
          <p>ドリッパー一覧の取得に失敗しました。</p>
          <Button className="mt-4" onClick={() => void drippersQuery.refetch()}>
            再読み込み
          </Button>
        </div>
      ) : drippers.length === 0 ? (
        <div className="text-center py-8 bg-coffee-secondary/5 rounded-2xl border border-dashed border-coffee-secondary/15 text-xs text-coffee-secondary">
          登録されているドリッパーはありません。
        </div>
      ) : (
        <Card>
          <div className="divide-y divide-coffee-secondary/10">
            {drippers.map((dripper) => (
              <div
                key={dripper.id}
                className={`p-4 flex items-center justify-between hover:bg-coffee-secondary/5 transition-colors ${editingId === dripper.id ? "bg-coffee-secondary/5 border-l-2 border-coffee-primary" : ""}`}
              >
                <div className="flex items-center space-x-3 flex-1 mr-2">
                  <button
                    type="button"
                    onClick={() => void defaultMutation.mutateAsync(dripper.id)}
                    className={`p-1 rounded-full transition-colors ${dripper.isDefault ? "text-coffee-primary" : "text-coffee-secondary/30 hover:text-coffee-primary"}`}
                    title={dripper.isDefault ? "デフォルト" : "デフォルトに設定"}
                    disabled={editingId !== null || defaultMutation.isPending}
                  >
                    <CheckCircle
                      size={18}
                      className={dripper.isDefault ? "fill-coffee-primary text-white" : ""}
                    />
                  </button>
                  <span className="text-sm font-medium text-coffee-text flex items-center gap-2">
                    {dripper.name}
                    {dripper.isDefault && (
                      <span className="text-[10px] bg-coffee-secondary/10 text-coffee-primary font-bold px-1.5 py-0.5 rounded-full">
                        デフォルト
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={() => handleStartEdit(dripper)}
                    className="p-1.5 rounded-full text-coffee-secondary/40 hover:text-coffee-primary"
                    title="編集"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm("このドリッパーを削除しますか？"))
                        void deleteMutation.mutateAsync(dripper.id);
                    }}
                    className="text-coffee-secondary/40 hover:text-red-500 p-1.5 rounded-full"
                    title="削除"
                    disabled={editingId !== null || deleteMutation.isPending}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default Drippers;
