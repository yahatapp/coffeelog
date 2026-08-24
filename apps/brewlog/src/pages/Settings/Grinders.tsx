import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, Loader2, Pencil, Plus, Sliders, Trash2 } from "lucide-react";
import { grinderQueries, mutations, queryKeys, type Grinder } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FormApiLike } from "@/components/forms/types";
import { getFirstValidationError } from "@/components/forms/formValidation";
import { grinderFormSchema, type GrinderFormValues } from "@/components/forms/grinderForm";

const emptyValues: GrinderFormValues = {
  name: "",
  fineMax: 6,
  mediumFineMax: 9,
  mediumMax: 15,
  mediumCoarseMax: 22,
  isDefault: false,
};

const toPayload = (value: GrinderFormValues) => ({
  name: value.name.trim(),
  fineMax: Number(value.fineMax),
  mediumFineMax: Number(value.mediumFineMax),
  mediumMax: Number(value.mediumMax),
  mediumCoarseMax: Number(value.mediumCoarseMax),
  isDefault: value.isDefault,
});

const GrinderFields = ({
  form,
  isSubmitting,
}: {
  form: FormApiLike<GrinderFormValues>;
  isSubmitting: boolean;
}) => {
  const numberFields = [
    ["fineMax", "fine", "細挽き上限 (Clicks)"],
    ["mediumFineMax", "medFine", "中細挽き上限 (Clicks)"],
    ["mediumMax", "medium", "中挽き上限 (Clicks)"],
    ["mediumCoarseMax", "medCoarse", "中粗挽き上限 (Clicks)"],
  ] as const;
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="grinderName" className="font-bold text-xs text-coffee-secondary">
          グラインダー名
        </Label>
        <form.Field name="name">
          {(field) => (
            <Input
              id="grinderName"
              placeholder="例: コマンダンテ C40、タイムモア C3"
              value={field.state.value}
              onChange={(event) => field.handleChange(event.target.value)}
              onBlur={field.handleBlur}
              className="rounded-xl border-coffee-secondary/20"
              required
              disabled={isSubmitting}
            />
          )}
        </form.Field>
      </div>
      <div className="space-y-2 pt-1 border-t border-coffee-secondary/10">
        <Label className="font-bold text-xs text-coffee-secondary flex items-center">
          <Sliders size={12} className="mr-1" />
          挽き目段階の境界値（クリック数上限）
        </Label>
        <p className="text-[10px] text-coffee-secondary/70">
          それぞれの挽き目の最大クリック数を設定します。
        </p>
        <div className="grid grid-cols-2 gap-3 text-xs pt-1">
          {numberFields.map(([name, id, label]) => (
            <div className="space-y-1" key={name}>
              <Label htmlFor={id} className="text-[11px] text-coffee-secondary font-medium">
                {label}
              </Label>
              <form.Field name={name}>
                {(field) => (
                  <Input
                    id={id}
                    type="number"
                    min="1"
                    max="40"
                    value={field.state.value}
                    onChange={(event) =>
                      field.handleChange(
                        event.target.value === "" ? "" : Number(event.target.value),
                      )
                    }
                    onBlur={field.handleBlur}
                    className="rounded-xl h-8 border-coffee-secondary/20"
                    disabled={isSubmitting}
                    required
                  />
                )}
              </form.Field>
            </div>
          ))}
        </div>
        <form.Subscribe
          selector={(state) => [
            state.values.fineMax,
            state.values.mediumFineMax,
            state.values.mediumMax,
            state.values.mediumCoarseMax,
          ]}
        >
          {([fineMax, mediumFineMax, mediumMax, mediumCoarseMax]) => (
            <div className="text-[10px] text-coffee-secondary/60 bg-coffee-background p-2 rounded-xl border border-coffee-secondary/5 mt-1.5 leading-relaxed">
              挽き目レンジの目安:
              <ul className="list-disc pl-4 mt-0.5 space-y-0.5">
                <li>細挽き: ~{fineMax || 0}</li>
                <li>
                  中細挽き: {(Number(fineMax) || 0) + 1}~{mediumFineMax || 0}
                </li>
                <li>
                  中挽き: {(Number(mediumFineMax) || 0) + 1}~{mediumMax || 0}
                </li>
                <li>
                  中粗挽き: {(Number(mediumMax) || 0) + 1}~{mediumCoarseMax || 0}
                </li>
                <li>粗挽き: {(Number(mediumCoarseMax) || 0) + 1}+</li>
              </ul>
            </div>
          )}
        </form.Subscribe>
      </div>
      <form.Field name="isDefault">
        {(field) => (
          <label className="flex items-center space-x-2 pt-1 pb-2 text-xs font-medium text-coffee-text cursor-pointer">
            <input
              type="checkbox"
              checked={field.state.value}
              onChange={(event) => field.handleChange(event.target.checked)}
              className="rounded border-coffee-secondary/30 text-coffee-primary focus:ring-coffee-primary/50 w-4 h-4"
            />
            <span>このグラインダーをデフォルトに設定する</span>
          </label>
        )}
      </form.Field>
    </>
  );
};

const Grinders = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const grindersQuery = useQuery(grinderQueries.all());
  const grinders = grindersQuery.data ?? [];
  const [editingId, setEditingId] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: (value: GrinderFormValues) => mutations.createGrinder({ json: toPayload(value) }),
    onSuccess: async () => {
      form.reset(emptyValues);
      await queryClient.invalidateQueries({ queryKey: queryKeys.grinders });
    },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, value }: { id: string; value: GrinderFormValues }) =>
      mutations.updateGrinder({ param: { id }, json: toPayload(value) }),
    onSuccess: async () => {
      setEditingId(null);
      form.reset(emptyValues);
      await queryClient.invalidateQueries({ queryKey: queryKeys.grinders });
    },
  });
  const defaultMutation = useMutation({
    mutationFn: (id: string) =>
      mutations.updateGrinder({ param: { id }, json: { isDefault: true } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.grinders });
    },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => mutations.deleteGrinder(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.grinders });
    },
  });
  const form = useForm({
    defaultValues: emptyValues,
    validators: {
      onBlur: grinderFormSchema,
      onSubmit: grinderFormSchema,
    },
    onSubmit: async ({ value }) => {
      if (editingId) await updateMutation.mutateAsync({ id: editingId, value });
      else await createMutation.mutateAsync(value);
    },
  });
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const handleStartEdit = (grinder: Grinder) => {
    setEditingId(grinder.id);
    form.reset({
      name: grinder.name,
      fineMax: grinder.fineMax,
      mediumFineMax: grinder.mediumFineMax,
      mediumMax: grinder.mediumMax,
      mediumCoarseMax: grinder.mediumCoarseMax,
      isDefault: grinder.isDefault,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const handleCancelEdit = () => {
    setEditingId(null);
    form.reset(emptyValues);
  };
  const formError = createMutation.error ?? updateMutation.error;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6 pb-12">
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
          <ArrowLeft size={20} />
        </Button>
        <h2 className="text-xl font-bold text-coffee-primary">グラインダー管理</h2>
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
            {editingId ? "グラインダーの設定を編集" : "新規グラインダー登録"}
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
        <GrinderFields form={form} isSubmitting={isSubmitting} />
        <form.Subscribe selector={(state) => state.errors}>
          {(errors) => {
            const validationError = getFirstValidationError(errors);
            return validationError ? (
              <p className="text-xs text-red-600" role="alert">
                {validationError}
              </p>
            ) : null;
          }}
        </form.Subscribe>
        <div className="flex gap-2">
          {editingId && (
            <Button
              type="button"
              variant="ghost"
              onClick={handleCancelEdit}
              disabled={isSubmitting}
              className="flex-1 rounded-xl border border-coffee-secondary/20 text-coffee-secondary mt-2 h-9 text-xs"
            >
              キャンセル
            </Button>
          )}
          <Button
            type="submit"
            disabled={isSubmitting}
            className={`rounded-xl bg-coffee-primary mt-2 h-9 text-xs ${editingId ? "flex-1" : "w-full"}`}
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin mr-1" size={14} />
            ) : editingId ? (
              <Pencil size={14} className="mr-1" />
            ) : (
              <Plus size={14} className="mr-1" />
            )}
            {editingId ? "変更を保存" : "グラインダーを登録"}
          </Button>
        </div>
        {formError && (
          <p className="text-xs text-red-600">
            {formError instanceof Error ? formError.message : "保存に失敗しました。"}
          </p>
        )}
      </form>
      {grindersQuery.isPending ? (
        <div className="h-20 w-full animate-pulse bg-coffee-secondary/10 rounded-xl" />
      ) : grindersQuery.isError ? (
        <div className="text-center p-8 text-coffee-secondary">
          <p>グラインダー一覧の取得に失敗しました。</p>
          <Button className="mt-4" onClick={() => void grindersQuery.refetch()}>
            再読み込み
          </Button>
        </div>
      ) : grinders.length === 0 ? (
        <div className="text-center py-8 bg-coffee-secondary/5 rounded-2xl border border-dashed border-coffee-secondary/15 text-xs text-coffee-secondary">
          登録されているグラインダーはありません。
        </div>
      ) : (
        <Card>
          <div className="divide-y divide-coffee-secondary/10">
            {grinders.map((grinder) => (
              <div
                key={grinder.id}
                className={`p-4 space-y-2 hover:bg-coffee-secondary/5 transition-colors ${editingId === grinder.id ? "bg-coffee-secondary/5 border-l-2 border-coffee-primary" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => void defaultMutation.mutateAsync(grinder.id)}
                      className={`p-1 rounded-full ${grinder.isDefault ? "text-coffee-primary" : "text-coffee-secondary/30"}`}
                      title={grinder.isDefault ? "デフォルト" : "デフォルトに設定"}
                      disabled={editingId !== null || defaultMutation.isPending}
                    >
                      <CheckCircle
                        size={18}
                        className={grinder.isDefault ? "fill-coffee-primary text-white" : ""}
                      />
                    </button>
                    <span className="text-sm font-bold text-coffee-text flex items-center gap-2">
                      {grinder.name}
                      {grinder.isDefault && (
                        <span className="text-[10px] bg-coffee-secondary/10 text-coffee-primary font-bold px-1.5 py-0.5 rounded-full">
                          デフォルト
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(grinder)}
                      className="p-1.5 rounded-full text-coffee-secondary/40 hover:text-coffee-primary"
                      title="編集"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm("このグラインダーを削除しますか？"))
                          void deleteMutation.mutateAsync(grinder.id);
                      }}
                      className="text-coffee-secondary/40 hover:text-red-500 p-1.5 rounded-full"
                      title="削除"
                      disabled={editingId !== null || deleteMutation.isPending}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 text-[9px] text-coffee-secondary pl-8">
                  <span className="bg-coffee-background px-1.5 py-0.5 rounded">
                    細: ~{grinder.fineMax}
                  </span>
                  <span className="bg-coffee-background px-1.5 py-0.5 rounded">
                    中細: {grinder.fineMax + 1}~{grinder.mediumFineMax}
                  </span>
                  <span className="bg-coffee-background px-1.5 py-0.5 rounded">
                    中: {grinder.mediumFineMax + 1}~{grinder.mediumMax}
                  </span>
                  <span className="bg-coffee-background px-1.5 py-0.5 rounded">
                    中粗: {grinder.mediumMax + 1}~{grinder.mediumCoarseMax}
                  </span>
                  <span className="bg-coffee-background px-1.5 py-0.5 rounded">
                    粗: {grinder.mediumCoarseMax + 1}+
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default Grinders;
