import { Loading, ErrorState } from "@yahatapp/ui";
import { getFirstValidationError } from "@/components/forms/formValidation";
import { Field } from "@yahatapp/ui";
import styles from "../content.module.css";
import { Checkbox } from "@yahatapp/ui";
import { mutationNotices } from "@/lib/mutationNotices";
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
const emptyValues: DripperFormValues = {
  name: "",
  isDefault: false,
};
const Drippers = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const drippersQuery = useQuery(dripperQueries.all());
  const drippers = drippersQuery.data ?? [];
  const [editingId, setEditingId] = useState<string | null>(null);
  const [defaultValues, setDefaultValues] = useState(emptyValues);
  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      const parsed = editingId
        ? dripperUpdateSchema.safeParse(value)
        : dripperCreateSchema.safeParse(value);
      if (!parsed.success) throw new Error("ドリッパー名を入力してください。");
      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          value,
        });
      } else {
        await createMutation.mutateAsync(value);
      }
    },
  });
  const createMutation = useMutation({
    meta: mutationNotices.createDripper,
    mutationFn: (value: DripperFormValues) =>
      mutations.createDripper({
        json: value,
      }),
    onSuccess: async () => {
      setDefaultValues(emptyValues);
      form.reset(emptyValues);
      await queryClient.invalidateQueries({
        queryKey: queryKeys.drippers,
      });
    },
  });
  const updateMutation = useMutation({
    meta: mutationNotices.updateDripper,
    mutationFn: ({ id, value }: { id: string; value: DripperFormValues }) =>
      mutations.updateDripper({
        param: {
          id,
        },
        json: value,
      }),
    onSuccess: async () => {
      setEditingId(null);
      setDefaultValues(emptyValues);
      form.reset(emptyValues);
      await queryClient.invalidateQueries({
        queryKey: queryKeys.drippers,
      });
    },
  });
  const defaultMutation = useMutation({
    meta: mutationNotices.defaultDripper,
    mutationFn: (id: string) =>
      mutations.updateDripper({
        param: {
          id,
        },
        json: {
          isDefault: true,
        },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.drippers,
      });
    },
  });
  const deleteMutation = useMutation({
    meta: mutationNotices.deleteDripper,
    mutationFn: (id: string) => mutations.deleteDripper(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.drippers,
      });
    },
  });
  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const handleStartEdit = (dripper: Dripper) => {
    setEditingId(dripper.id);
    const values = {
      name: dripper.name,
      isDefault: dripper.isDefault,
    };
    setDefaultValues(values);
    form.reset(values);
    window.scrollTo({
      top: 0,
      behavior: "auto",
    });
  };
  const handleCancelEdit = () => {
    setEditingId(null);
    setDefaultValues(emptyValues);
    form.reset(emptyValues);
  };
  const formError = createMutation.error ?? updateMutation.error;
  return (
    <div className={styles.stack}>
      <div className={styles.row}>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          type="button"
          aria-label="戻る"
        >
          <ArrowLeft size={20} />
        </Button>
        <h2 className={[styles.heading, styles.strong, styles.accent].join(" ")}>ドリッパー管理</h2>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          // Mutation errors are shown by the shared notices and the form error state.
          void form.handleSubmit().catch(() => undefined);
        }}
        className={[
          styles.surface,
          styles.border,
          styles.rounded,
          styles.elevated,
          styles.content,
          styles.fieldStack,
        ].join(" ")}
      >
        <div className={[styles.border, styles.row, styles.spread, styles.separated].join(" ")}>
          <span className={[styles.helper, styles.strong, styles.accent].join(" ")}>
            {editingId ? "ドリッパーの設定を編集" : "新規ドリッパー登録"}
          </span>
          {editingId && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className={[styles.helper, styles.muted, styles.textLink].join(" ")}
            >
              キャンセル
            </button>
          )}
        </div>
        <div className={styles.fieldStack}>
          <form.Field name="name">
            {(field) => (
              <Field
                label="ドリッパー名"
                required
                error={getFirstValidationError(field.state.meta.errors)}
              >
                {(control) => (
                  <Input
                    {...control}
                    placeholder="新しいドリッパー名..."
                    value={field.state.value}
                    onChange={(event) => field.handleChange(event.target.value)}
                    onBlur={field.handleBlur}
                    required
                    disabled={isSubmitting}
                  />
                )}
              </Field>
            )}
          </form.Field>
          {editingId && (
            <Button
              type="button"
              variant="ghost"
              onClick={handleCancelEdit}
              disabled={isSubmitting}
            >
              キャンセル
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting} loading={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className={styles.spinner} size={16} />
            ) : editingId ? (
              <Pencil size={16} />
            ) : (
              <Plus size={16} />
            )}
            {editingId ? "保存" : "追加"}
          </Button>
        </div>
        <form.Field name="isDefault">
          {(field) => (
            <label
              className={[
                styles.row,
                styles.helper,
                styles.foreground,
                styles.interactive,
                styles.separated,
              ].join(" ")}
            >
              <Checkbox
                type="checkbox"
                checked={field.state.value}
                onChange={(event) => field.handleChange(event.target.checked)}
              />
              <span>このドリッパーをデフォルトに設定する</span>
            </label>
          )}
        </form.Field>
        {formError && (
          <p className={[styles.helper, styles.dangerText].join(" ")}>保存に失敗しました。</p>
        )}
      </form>

      {drippersQuery.isPending ? (
        <Loading className={styles.state} />
      ) : drippersQuery.isError ? (
        <div className={[styles.roomy, styles.center, styles.muted].join(" ")}>
          <ErrorState
            message={<>ドリッパー一覧の取得に失敗しました。</>}
            onRetry={() => void drippersQuery.refetch()}
          />
        </div>
      ) : drippers.length === 0 ? (
        <div
          className={[
            styles.tonal,
            styles.border,
            styles.rounded,
            styles.center,
            styles.helper,
            styles.muted,
          ].join(" ")}
        >
          登録されているドリッパーはありません。
        </div>
      ) : (
        <Card>
          <div className={styles.cardContent}>
            <div className={styles.divided}>
              {drippers.map((dripper) => (
                <div
                  key={dripper.id}
                  role="group"
                  aria-label={dripper.name}
                  className={styles.masterEntry}
                >
                  <div className={styles.masterHeading}>
                    <Button
                      type="button"
                      onClick={() => defaultMutation.mutate(dripper.id)}
                      title={dripper.isDefault ? "デフォルト" : "デフォルトに設定"}
                      disabled={editingId !== null || defaultMutation.isPending}
                      aria-label={dripper.isDefault ? "デフォルト" : "デフォルトに設定"}
                      aria-pressed={dripper.isDefault}
                      variant="ghost"
                      size="icon"
                    >
                      <CheckCircle size={18} className={dripper.isDefault ? styles.accent : ""} />
                    </Button>
                    <span className={styles.masterName}>
                      {dripper.name}
                      {dripper.isDefault && (
                        <span
                          className={[
                            styles.tonal,
                            styles.pill,
                            styles.helper,
                            styles.strong,
                            styles.accent,
                          ].join(" ")}
                        >
                          デフォルト
                        </span>
                      )}
                    </span>
                  </div>
                  <div className={styles.masterActions}>
                    <Button
                      type="button"
                      onClick={() => handleStartEdit(dripper)}
                      title="編集"
                      aria-label="編集"
                      variant="ghost"
                      size="icon"
                    >
                      <Pencil size={16} />
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        if (confirm("このドリッパーを削除しますか？"))
                          deleteMutation.mutate(dripper.id);
                      }}
                      title="削除"
                      disabled={editingId !== null || deleteMutation.isPending}
                      aria-label="削除"
                      variant="ghost"
                      size="icon"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
export default Drippers;
